import os
import json
import traci

# Project paths
PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG_FILE = os.path.join(PROJECT_DIR, "config", "city.sumocfg")
OUTPUT_DIR = os.path.join(PROJECT_DIR, "output")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "traffic_data.json")


def main():
    sumo_binary = "sumo"

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    traci.start([
        sumo_binary,
        "-c", CONFIG_FILE,
        "--seed", "42"
    ])

    print("SUMO connected successfully!")

    # Get traffic lights
    traffic_lights = traci.trafficlight.getIDList()
    controlled_tls = "J1"

    print(f"Controlling traffic light: {controlled_tls}")

    data = []

    try:
        while traci.simulation.getMinExpectedNumber() > 0:

            traci.simulationStep()

            current_time = traci.simulation.getTime()

            # ---------------------------------
            # VEHICLE DATA
            # ---------------------------------
            vehicle_ids = traci.vehicle.getIDList()

            total_waiting_time = 0
            total_speed = 0
            total_co2 = 0
            queue_length = 0

            for vehicle_id in vehicle_ids:

                total_waiting_time += (
                    traci.vehicle.getAccumulatedWaitingTime(vehicle_id)
                )

                total_speed += traci.vehicle.getSpeed(vehicle_id)

                total_co2 += traci.vehicle.getCO2Emission(vehicle_id)

                if traci.vehicle.getSpeed(vehicle_id) < 0.1:
                    queue_length += 1

            if vehicle_ids:
                average_speed = total_speed / len(vehicle_ids)
            else:
                average_speed = 0

            # ---------------------------------
            # TRAFFIC LIGHT DATA
            # ---------------------------------
            phase = traci.trafficlight.getPhase(controlled_tls)

            phase_duration = traci.trafficlight.getPhaseDuration(
                controlled_tls
            )

            next_switch = traci.trafficlight.getNextSwitch(
                controlled_tls
            )

            phase_elapsed = current_time - (
                next_switch - phase_duration
            )

            # ---------------------------------
            # ACTION
            # ---------------------------------
            # Action 0 = keep current phase
            # Action 1 = switch to next phase

            action = 0

            if int(current_time) % 100 == 0 and current_time > 0:

                current_phase = traci.trafficlight.getPhase(
                    controlled_tls
                )

                # Get number of phases from the current traffic-light logic
                logics = traci.trafficlight.getAllProgramLogics(
                    controlled_tls
                )

                current_logic = logics[0]

                number_of_phases = len(current_logic.getPhases())

                next_phase = (
                    current_phase + 1
                ) % number_of_phases

                traci.trafficlight.setPhase(
                    controlled_tls,
                    next_phase
                )

                action = 1

                print(
                    f"Action 1: Switched {controlled_tls} "
                    f"from phase {current_phase} "
                    f"to phase {next_phase}"
                )

            # ---------------------------------
            # STORE DATA
            # ---------------------------------
            step_data = {
                "time": current_time,
                "vehicle_count": len(vehicle_ids),
                "average_speed": average_speed,
                "waiting_time": total_waiting_time,
                "co2_emission": total_co2,
                "queue_length": queue_length,
                "traffic_light": {
                    "id": controlled_tls,
                    "phase": phase,
                    "phase_elapsed": phase_elapsed,
                    "action": action
                }
            }

            data.append(step_data)

            # ---------------------------------
            # PRINT EVERY 100 SECONDS
            # ---------------------------------
            if int(current_time) % 100 == 0:

                print(
                    f"Time: {current_time:.0f}s | "
                    f"Vehicles: {len(vehicle_ids)} | "
                    f"Speed: {average_speed:.2f} m/s | "
                    f"Waiting: {total_waiting_time:.2f}s | "
                    f"Queue: {queue_length} | "
                    f"Phase: {phase} | "
                    f"Action: {action}"
                )

    finally:
        traci.close()

    # ---------------------------------
    # SAVE JSON
    # ---------------------------------
    with open(OUTPUT_FILE, "w") as file:
        json.dump(data, file, indent=2)

    print("SUMO simulation finished.")
    print(f"Data saved to: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()