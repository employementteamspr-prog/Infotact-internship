import os
import traci


SUMO_CONFIG = os.path.join(
    os.path.dirname(__file__),
    "sumo",
    "simulation.sumocfg"
)


def main():
    print("Starting EcoTwin SUMO + TraCI test...")

    traci.start([
        "sumo",
        "-c",
        SUMO_CONFIG,
        "--step-length",
        "1"
    ])

    try:
        for step in range(10):
            traci.simulationStep()

            simulation_time = traci.simulation.getTime()
            vehicle_ids = traci.vehicle.getIDList()
            traffic_light_ids = traci.trafficlight.getIDList()

            print()
            print(f"Simulation time: {simulation_time}")
            print(f"Active vehicles: {len(vehicle_ids)}")
            print(f"Traffic lights: {len(traffic_light_ids)}")

            if vehicle_ids:
                vehicle_id = vehicle_ids[0]

                position = traci.vehicle.getPosition(
                    vehicle_id
                )

                speed = traci.vehicle.getSpeed(
                    vehicle_id
                )

                waiting_time = (
                    traci.vehicle.getAccumulatedWaitingTime(
                        vehicle_id
                    )
                )

                print(f"Vehicle ID: {vehicle_id}")
                print(f"Position: {position}")
                print(f"Speed: {speed:.2f} m/s")
                print(f"Waiting time: {waiting_time:.2f} s")

            if traffic_light_ids:
                tls_id = traffic_light_ids[0]

                phase = traci.trafficlight.getPhase(
                    tls_id
                )

                print(f"Traffic light: {tls_id}")
                print(f"Current phase: {phase}")

    finally:
        traci.close()

    print()
    print("TraCI test completed successfully.")


if __name__ == "__main__":
    main()