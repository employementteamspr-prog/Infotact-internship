import os
import asyncio
import threading
import traci

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware


# ==================================================
# EcoTwin - FastAPI + SUMO + RL Integration
# ==================================================

app = FastAPI(
    title="EcoTwin Traffic Data API"
)


# ==================================================
# CORS
# ==================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================================================
# SUMO CONFIGURATION
# ==================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

SUMO_CONFIG = os.path.join(
    BASE_DIR,
    "sumo",
    "simulation.sumocfg"
)

SIMULATION_DURATION = 3600


# ==================================================
# RL CONFIGURATION
# ==================================================

RL_ALGORITHM = "PPO"

RL_ENABLED = False

RL_STATUS = "STANDBY"

RL_SOURCE = "environment"

RL_CURRENT_ACTION = None

# Week 2 reward weights
WAITING_WEIGHT = 0.5
CO2_WEIGHT = 0.3
QUEUE_WEIGHT = 0.2


# ==================================================
# SUMO STATE
# ==================================================

sumo_lock = threading.Lock()

sumo_started = False

phase_tracking = {}


# ==================================================
# START SUMO
# ==================================================

def start_sumo():

    global sumo_started
    global phase_tracking

    if sumo_started:
        return

    print("Starting SUMO simulation...")

    traci.start([
        "sumo",
        "-c",
        SUMO_CONFIG,
        "--step-length",
        "1"
    ])

    sumo_started = True

    phase_tracking = {}

    print("SUMO simulation started.")


# ==================================================
# RESTART SUMO
# ==================================================

def restart_sumo():

    global sumo_started
    global phase_tracking

    print("Restarting SUMO simulation...")

    try:

        if sumo_started:
            traci.close()

    except Exception:

        pass

    sumo_started = False

    phase_tracking = {}

    start_sumo()


# ==================================================
# ADVANCE SIMULATION
# ==================================================

def advance_simulation():

    global sumo_started

    start_sumo()

    current_time = (
        traci.simulation.getTime()
    )

    if current_time >= SIMULATION_DURATION:

        restart_sumo()

    traci.simulationStep()

    return traci.simulation.getTime()


# ==================================================
# PHASE ELAPSED TIME
# ==================================================

def get_phase_elapsed_time(
    tls_id,
    current_phase,
    simulation_time
):

    previous_phase_data = (
        phase_tracking.get(tls_id)
    )

    # First observation
    if previous_phase_data is None:

        phase_tracking[tls_id] = {
            "phase": current_phase,
            "start_time": simulation_time
        }

        return 0.0

    # Phase changed
    if (
        previous_phase_data["phase"]
        != current_phase
    ):

        phase_tracking[tls_id] = {
            "phase": current_phase,
            "start_time": simulation_time
        }

        return 0.0

    # Phase still active
    elapsed_time = (
        simulation_time
        - previous_phase_data["start_time"]
    )

    return round(
        max(elapsed_time, 0),
        2
    )


# ==================================================
# DETERMINE PHASE TYPE
# ==================================================

def get_phase_type(
    tls_id,
    phase
):

    try:

        program = (
            traci.trafficlight
            .getAllProgramLogics(tls_id)
        )

        if not program:
            return "unknown"

        logic = program[0]

        phases = logic.phases

        if phase < 0 or phase >= len(phases):
            return "unknown"

        phase_state = phases[phase].state

        if "G" in phase_state:
            return "green"

        if "y" in phase_state:
            return "yellow"

        return "red"

    except Exception:

        return "unknown"


# ==================================================
# DETERMINE APPROXIMATE DIRECTION
# ==================================================

def get_phase_direction(
    tls_id,
    phase
):

    try:

        program = (
            traci.trafficlight
            .getAllProgramLogics(tls_id)
        )

        if not program:
            return "unknown"

        logic = program[0]

        phases = logic.phases

        if phase < 0 or phase >= len(phases):
            return "unknown"

        phase_state = phases[phase].state

        active_positions = []

        for index, signal in enumerate(
            phase_state
        ):

            if signal in ("G", "g", "y"):

                active_positions.append(index)

        if not active_positions:
            return "unknown"

        first_half = (
            len(phase_state) // 2
        )

        first_group = any(
            index < first_half
            for index in active_positions
        )

        second_group = any(
            index >= first_half
            for index in active_positions
        )

        if first_group and not second_group:
            return "north_south"

        if second_group and not first_group:
            return "east_west"

        return "mixed"

    except Exception:

        return "unknown"


# ==================================================
# CALCULATE RL REWARD
# ==================================================

def calculate_rl_reward(
    queue_length,
    waiting_time,
    co2
):

    # ----------------------------------------------
    # Normalize observations
    # ----------------------------------------------

    normalized_waiting = min(
        max(waiting_time, 0) / 1000.0,
        1.0
    )

    normalized_co2 = min(
        max(co2, 0) / 50000.0,
        1.0
    )

    normalized_queue = min(
        max(queue_length, 0) / 25.0,
        1.0
    )

    # ----------------------------------------------
    # Weighted penalties
    # ----------------------------------------------

    waiting_penalty = (
        WAITING_WEIGHT
        * normalized_waiting
    )

    co2_penalty = (
        CO2_WEIGHT
        * normalized_co2
    )

    queue_penalty = (
        QUEUE_WEIGHT
        * normalized_queue
    )

    # ----------------------------------------------
    # Final reward
    # ----------------------------------------------

    reward = -(
        waiting_penalty
        + co2_penalty
        + queue_penalty
    )

    return {
        "reward": round(
            float(reward),
            4
        ),
        "waiting_penalty": round(
            float(waiting_penalty),
            4
        ),
        "co2_penalty": round(
            float(co2_penalty),
            4
        ),
        "queue_penalty": round(
            float(queue_penalty),
            4
        )
    }


# ==================================================
# COLLECT LIVE SIMULATION DATA
# ==================================================

def collect_simulation_data():

    simulation_time = (
        traci.simulation.getTime()
    )

    vehicle_ids = (
        traci.vehicle.getIDList()
    )

    traffic_light_ids = (
        traci.trafficlight.getIDList()
    )

    # ==================================================
    # VEHICLES
    # ==================================================

    vehicles = []

    total_vehicle_waiting = 0.0

    total_vehicle_co2 = 0.0

    for vehicle_id in vehicle_ids:

        try:

            x, y = (
                traci.vehicle.getPosition(
                    vehicle_id
                )
            )

            speed = (
                traci.vehicle.getSpeed(
                    vehicle_id
                )
            )

            vehicle_type = (
                traci.vehicle.getTypeID(
                    vehicle_id
                )
            )

            co2 = (
                traci.vehicle.getCO2Emission(
                    vehicle_id
                )
            )

            waiting = (
                traci.vehicle
                .getAccumulatedWaitingTime(
                    vehicle_id
                )
            )

            total_vehicle_waiting += waiting

            total_vehicle_co2 += co2

            vehicles.append({

                "vehicle_id":
                    vehicle_id,

                "x":
                    round(x, 2),

                "y":
                    round(y, 2),

                "speed":
                    round(speed, 2),

                "type":
                    vehicle_type,

                "co2":
                    round(co2, 2),

                "waiting_time":
                    round(waiting, 2)

            })

        except Exception:

            continue

    # ==================================================
    # TRAFFIC LIGHTS
    # ==================================================

    traffic_lights = []

    total_queue_length = 0

    total_waiting_time = 0.0

    total_intersection_co2 = 0.0

    for tls_id in traffic_light_ids:

        # ----------------------------------------------
        # Current phase
        # ----------------------------------------------

        phase = (
            traci.trafficlight
            .getPhase(tls_id)
        )

        # ----------------------------------------------
        # Phase duration
        # ----------------------------------------------

        phase_duration = (
            traci.trafficlight
            .getPhaseDuration(tls_id)
        )

        # ----------------------------------------------
        # Phase elapsed
        # ----------------------------------------------

        phase_elapsed_time = (
            get_phase_elapsed_time(
                tls_id,
                phase,
                simulation_time
            )
        )

        # ----------------------------------------------
        # Phase type
        # ----------------------------------------------

        phase_type = (
            get_phase_type(
                tls_id,
                phase
            )
        )

        # ----------------------------------------------
        # Phase direction
        # ----------------------------------------------

        phase_direction = (
            get_phase_direction(
                tls_id,
                phase
            )
        )

        # ----------------------------------------------
        # Controlled lanes
        # ----------------------------------------------

        controlled_lanes = (
            traci.trafficlight
            .getControlledLanes(
                tls_id
            )
        )

        controlled_lanes = list(
            dict.fromkeys(
                controlled_lanes
            )
        )

        # ----------------------------------------------
        # Intersection metrics
        # ----------------------------------------------

        queue_length = 0

        intersection_waiting = 0.0

        total_speed = 0.0

        vehicle_count = 0

        intersection_co2 = 0.0

        nearby_vehicle_ids = set()

        # ----------------------------------------------
        # Find nearby vehicles
        # ----------------------------------------------

        for lane_id in controlled_lanes:

            try:

                lane_vehicle_ids = (
                    traci.lane
                    .getLastStepVehicleIDs(
                        lane_id
                    )
                )

                for vehicle_id in lane_vehicle_ids:

                    nearby_vehicle_ids.add(
                        vehicle_id
                    )

            except Exception:

                continue

        # ----------------------------------------------
        # Calculate metrics
        # ----------------------------------------------

        for vehicle_id in nearby_vehicle_ids:

            try:

                speed = (
                    traci.vehicle
                    .getSpeed(
                        vehicle_id
                    )
                )

                waiting = (
                    traci.vehicle
                    .getAccumulatedWaitingTime(
                        vehicle_id
                    )
                )

                co2 = (
                    traci.vehicle
                    .getCO2Emission(
                        vehicle_id
                    )
                )

                vehicle_count += 1

                total_speed += speed

                intersection_waiting += waiting

                intersection_co2 += co2

                if speed < 0.1:

                    queue_length += 1

            except Exception:

                continue

        # ----------------------------------------------
        # Averages
        # ----------------------------------------------

        if vehicle_count > 0:

            average_speed = (
                total_speed
                / vehicle_count
            )

            average_waiting_time = (
                intersection_waiting
                / vehicle_count
            )

        else:

            average_speed = 0.0

            average_waiting_time = 0.0

        total_queue_length += queue_length

        total_waiting_time += (
            average_waiting_time
        )

        total_intersection_co2 += (
            intersection_co2
        )

        # ----------------------------------------------
        # Traffic light response
        # ----------------------------------------------

        traffic_lights.append({

            "id":
                tls_id,

            "current_phase":
                phase,

            "phase_type":
                phase_type,

            "phase_direction":
                phase_direction,

            "phase_duration":
                round(
                    phase_duration,
                    2
                ),

            "phase_elapsed_time":
                phase_elapsed_time,

            "queue_length":
                queue_length,

            "waiting_time":
                round(
                    average_waiting_time,
                    2
                ),

            "average_speed":
                round(
                    average_speed,
                    2
                ),

            "co2_emission":
                round(
                    intersection_co2,
                    2
                )

        })

    # ==================================================
    # GLOBAL RL OBSERVATION
    # ==================================================

    vehicle_count = len(vehicles)

    if traffic_lights:

        global_queue = (
            total_queue_length
            / len(traffic_lights)
        )

        global_waiting = (
            total_waiting_time
            / len(traffic_lights)
        )

        global_co2 = (
            total_intersection_co2
            / len(traffic_lights)
        )

    else:

        global_queue = 0.0

        global_waiting = 0.0

        global_co2 = 0.0

    if vehicle_count > 0:

        average_speed = (
            sum(
                vehicle["speed"]
                for vehicle in vehicles
            )
            / vehicle_count
        )

    else:

        average_speed = 0.0

    # ==================================================
    # WEEK 2 RL REWARD
    # ==================================================

    reward_data = calculate_rl_reward(
        global_queue,
        global_waiting,
        global_co2
    )

    # ==================================================
    # RL INFORMATION
    # ==================================================

    rl_data = {

        "enabled":
            RL_ENABLED,

        "algorithm":
            RL_ALGORITHM,

        "current_action":
            RL_CURRENT_ACTION,

        "reward":
            reward_data["reward"],

        "waiting_penalty":
            reward_data["waiting_penalty"],

        "co2_penalty":
            reward_data["co2_penalty"],

        "queue_penalty":
            reward_data["queue_penalty"],

        "status":
            RL_STATUS,

        "source":
            RL_SOURCE

    }

    # ==================================================
    # NORMALIZED CONTRACT
    # ==================================================

    intersections = []

    signals = []

    for traffic_light in traffic_lights:

        intersection = {

            "id":
                traffic_light["id"],

            "queue_length":
                traffic_light["queue_length"],

            "waiting_time":
                traffic_light["waiting_time"],

            "co2":
                traffic_light["co2_emission"],

            "average_speed":
                traffic_light["average_speed"],

            "current_phase":
                traffic_light["current_phase"],

            "phase_type":
                traffic_light["phase_type"],

            "phase_direction":
                traffic_light["phase_direction"]

        }

        intersections.append(
            intersection
        )

        signals.append({

            "id":
                traffic_light["id"],

            "phase":
                traffic_light["phase_type"],

            "current_phase":
                traffic_light["current_phase"],

            "phase_direction":
                traffic_light["phase_direction"],

            "remaining_seconds":
                max(
                    0,
                    round(
                        traffic_light["phase_duration"]
                        - traffic_light["phase_elapsed_time"],
                        2
                    )
                ),

            "phase_duration":
                traffic_light["phase_duration"],

            "phase_elapsed_time":
                traffic_light["phase_elapsed_time"],

            "queue_length":
                traffic_light["queue_length"],

            "waiting_time":
                traffic_light["waiting_time"],

            "average_speed":
                traffic_light["average_speed"],

            "co2_emission":
                traffic_light["co2_emission"]

        })

    # ==================================================
    # FINAL RESPONSE
    # ==================================================

    return {

        # Original backend fields
        "simulation_time":
            simulation_time,

        "vehicle_count":
            vehicle_count,

        "traffic_light_count":
            len(traffic_lights),

        "vehicles":
            vehicles,

        "traffic_lights":
            traffic_lights,

        # Leader's frontend contract
        "timestamp":
            simulation_time,

        "simulation_status":
            "running",

        "signals":
            signals,

        "intersections":
            intersections,

        "metrics": {

            "vehicle_count":
                vehicle_count,

            "avg_waiting_time":
                round(
                    total_vehicle_waiting
                    / vehicle_count,
                    2
                )
                if vehicle_count > 0
                else 0.0,

            "queue_length":
                total_queue_length,

            "total_co2":
                round(
                    total_vehicle_co2,
                    2
                ),

            "rl_reward":
                reward_data["reward"]

        },

        "rl":
            rl_data

    }


# ==================================================
# ROOT
# ==================================================

@app.get("/")
def root():

    return {

        "message":
            "EcoTwin Traffic Data API is running"

    }


# ==================================================
# HEALTH
# ==================================================

@app.get("/health")
def health():

    return {

        "status":
            "ok",

        "sumo_connected":
            sumo_started,

        "rl_enabled":
            RL_ENABLED,

        "rl_status":
            RL_STATUS

    }


# ==================================================
# REST SIMULATION STATE
# ==================================================

@app.get("/simulation/state")
def simulation_state():

    with sumo_lock:

        advance_simulation()

        return (
            collect_simulation_data()
        )


# ==================================================
# WEBSOCKET
# ==================================================

@app.websocket("/ws/simulation")
async def simulation_websocket(
    websocket: WebSocket
):

    await websocket.accept()

    print(
        "EcoTwin WebSocket client connected."
    )

    try:

        while True:

            with sumo_lock:

                advance_simulation()

                data = (
                    collect_simulation_data()
                )

            await websocket.send_json(
                data
            )

            await asyncio.sleep(1)

    except WebSocketDisconnect:

        print(
            "EcoTwin WebSocket client disconnected."
        )

    except Exception as error:

        print(
            "WebSocket error:",
            error
        )

        try:

            await websocket.close()

        except Exception:

            pass


# ==================================================
# SHUTDOWN
# ==================================================

@app.on_event("shutdown")
def shutdown():

    global sumo_started
    global phase_tracking

    print(
        "Shutting down EcoTwin SUMO..."
    )

    try:

        if sumo_started:

            traci.close()

    except Exception:

        pass

    sumo_started = False

    phase_tracking = {}

    print(
        "EcoTwin SUMO closed."
    )