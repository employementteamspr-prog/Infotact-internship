import os
import traci


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SUMO_CONFIG = os.path.join(BASE_DIR, "sumo", "simulation.sumocfg")


def start_sumo():
    """Start the SUMO simulation."""
    if traci.isLoaded():
        return

    traci.start([
        "sumo",
        "-c",
        SUMO_CONFIG
    ])


def collect_vehicle_data():
    """Collect raw vehicle and emission data from the current SUMO step."""
    vehicles = []

    for vehicle_id in traci.vehicle.getIDList():
        vehicles.append({
            "vehicle_id": vehicle_id,
            "position": {
                "x": traci.vehicle.getPosition(vehicle_id)[0],
                "y": traci.vehicle.getPosition(vehicle_id)[1]
            },
            "road_id": traci.vehicle.getRoadID(vehicle_id),
            "lane_id": traci.vehicle.getLaneID(vehicle_id),
            "speed": traci.vehicle.getSpeed(vehicle_id),
            "waiting_time": traci.vehicle.getWaitingTime(vehicle_id),
            "co2_emission": traci.vehicle.getCO2Emission(vehicle_id)
        })

    return vehicles


def simulation_step():
    """Advance SUMO by one step and return vehicle data."""
    traci.simulationStep()
    return collect_vehicle_data()


def close_sumo():
    """Close the SUMO connection."""
    if traci.isLoaded():
        traci.close()