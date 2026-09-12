import os
import sys
import traci


# Project paths
PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG_FILE = os.path.join(PROJECT_DIR, "config", "city.sumocfg")


def main():
    sumo_binary = "sumo"

    traci.start([
        sumo_binary,
        "-c", CONFIG_FILE,
        "--seed", "42"
    ])

    print("SUMO connected successfully!")

    try:
        while traci.simulation.getMinExpectedNumber() > 0:
            traci.simulationStep()

            current_time = traci.simulation.getTime()

            if int(current_time) % 100 == 0:
                vehicles = traci.vehicle.getIDCount()
                print(f"Time: {current_time:.0f}s | Vehicles: {vehicles}")

    finally:
        traci.close()
        print("SUMO simulation finished.")


if __name__ == "__main__":
    main()