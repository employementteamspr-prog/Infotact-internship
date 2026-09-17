import traci


SUMO_CONFIG = "SUMO/simulation.sumocfg"


def start_sumo():
    """Start the SUMO simulation."""
    traci.start(["sumo", "-c", SUMO_CONFIG])


def collect_vehicle_data():
    """Collect vehicle and emission data from the current SUMO step."""
    vehicles = []

    for vehicle_id in traci.vehicle.getIDList():
        vehicles.append({
            "vehicle_id": vehicle_id,
            "position": traci.vehicle.getPosition(vehicle_id),
            "road_id": traci.vehicle.getRoadID(vehicle_id),
            "lane_id": traci.vehicle.getLaneID(vehicle_id),
            "speed": traci.vehicle.getSpeed(vehicle_id),
            "waiting_time": traci.vehicle.getWaitingTime(vehicle_id),
            "co2_emission": traci.vehicle.getCO2Emission(vehicle_id)
        })

    return vehicles


def simulation_step():
    """Advance SUMO by one simulation step and collect data."""
    traci.simulationStep()
    return collect_vehicle_data()


def close_sumo():
    """Close the SUMO connection."""
    traci.close()