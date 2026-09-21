import os
import asyncio
import threading
import traci

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware


# ==================================================
# EcoTwin - FastAPI + SUMO Backend
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

    # --------------------------------------------------
    # First observation
    # --------------------------------------------------

    if previous_phase_data is None:

        phase_tracking[tls_id] = {

            "phase":
                current_phase,

            "start_time":
                simulation_time

        }

        return 0


    # --------------------------------------------------
    # Phase changed
    # --------------------------------------------------

    if (
        previous_phase_data["phase"]
        != current_phase
    ):

        phase_tracking[tls_id] = {

            "phase":
                current_phase,

            "start_time":
                simulation_time

        }

        return 0


    # --------------------------------------------------
    # Phase still active
    # --------------------------------------------------

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

def get_phase_type(tls_id, phase):

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

        # --------------------------------------------------
        # Green phase
        # --------------------------------------------------

        if "G" in phase_state:

            return "green"

        # --------------------------------------------------
        # Yellow phase
        # --------------------------------------------------

        if "y" in phase_state:

            return "yellow"

        # --------------------------------------------------
        # Red / other phase
        # --------------------------------------------------

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

        # --------------------------------------------------
        # Find green/yellow signal positions
        # --------------------------------------------------

        active_positions = []

        for index, signal in enumerate(
            phase_state
        ):

            if signal in ("G", "g", "y"):

                active_positions.append(index)


        if not active_positions:

            return "unknown"


        # --------------------------------------------------
        # The generated EcoTwin network uses
        # alternating signal groups.
        #
        # We identify the two groups based on
        # the signal-state pattern.
        # --------------------------------------------------

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


        # Some generated SUMO intersections
        # have a more complex signal layout.
        return "mixed"

    except Exception:

        return "unknown"


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

    for vehicle_id in vehicle_ids:

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

        waiting_time = (
            traci.vehicle
            .getAccumulatedWaitingTime(
                vehicle_id
            )
        )

        vehicles.append({

            "id":
                vehicle_id,

            "x":
                round(x, 2),

            "y":
                round(y, 2),

            "speed":
                round(speed, 2),

            "waiting_time":
                round(
                    waiting_time,
                    2
                )

        })


    # ==================================================
    # TRAFFIC LIGHTS
    # ==================================================

    traffic_lights = []

    for tls_id in traffic_light_ids:

        # --------------------------------------------------
        # Current phase
        # --------------------------------------------------

        phase = (
            traci.trafficlight
            .getPhase(tls_id)
        )


        # --------------------------------------------------
        # Phase duration
        # --------------------------------------------------

        phase_duration = (
            traci.trafficlight
            .getPhaseDuration(tls_id)
        )


        # --------------------------------------------------
        # Phase elapsed time
        # --------------------------------------------------

        phase_elapsed_time = (
            get_phase_elapsed_time(

                tls_id,

                phase,

                simulation_time

            )
        )


        # --------------------------------------------------
        # Phase type
        # --------------------------------------------------

        phase_type = (
            get_phase_type(
                tls_id,
                phase
            )
        )


        # --------------------------------------------------
        # Phase direction
        # --------------------------------------------------

        phase_direction = (
            get_phase_direction(
                tls_id,
                phase
            )
        )


        # --------------------------------------------------
        # Controlled lanes
        # --------------------------------------------------

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


        # --------------------------------------------------
        # Metrics
        # --------------------------------------------------

        queue_length = 0

        total_waiting_time = 0

        total_speed = 0

        vehicle_count = 0

        total_co2 = 0

        nearby_vehicle_ids = set()


        # ==================================================
        # FIND VEHICLES NEAR INTERSECTION
        # ==================================================

        for lane_id in controlled_lanes:

            try:

                lane_vehicle_ids = (
                    traci.lane
                    .getLastStepVehicleIDs(
                        lane_id
                    )
                )

                for vehicle_id in (
                    lane_vehicle_ids
                ):

                    nearby_vehicle_ids.add(
                        vehicle_id
                    )

            except Exception:

                continue


        # ==================================================
        # CALCULATE METRICS
        # ==================================================

        for vehicle_id in (
            nearby_vehicle_ids
        ):

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

                total_waiting_time += (
                    waiting
                )

                total_co2 += co2


                if speed < 0.1:

                    queue_length += 1


            except Exception:

                continue


        # ==================================================
        # AVERAGES
        # ==================================================

        if vehicle_count > 0:

            average_speed = (
                total_speed
                / vehicle_count
            )

            average_waiting_time = (
                total_waiting_time
                / vehicle_count
            )

        else:

            average_speed = 0

            average_waiting_time = 0


        # ==================================================
        # TRAFFIC LIGHT RESPONSE
        # ==================================================

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
                    total_co2,
                    2
                )

        })


    # ==================================================
    # FINAL RESPONSE
    # ==================================================

    return {

        "simulation_time":
            simulation_time,

        "vehicle_count":
            len(vehicles),

        "traffic_light_count":
            len(traffic_lights),

        "vehicles":
            vehicles,

        "traffic_lights":
            traffic_lights

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
            sumo_started

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
        "SUMO simulation closed."
    )