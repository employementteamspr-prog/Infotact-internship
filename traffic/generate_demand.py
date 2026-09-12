import json
import random

# Load simulation configuration
with open("simulation_config.json", "r") as file:
    config = json.load(file)

# Traffic demand settings
vehicles_per_hour = config["traffic_demand"]["vehicles_per_hour"]
simulation_duration = config["simulation"]["duration_seconds"]
random_seed = config["traffic_demand"]["random_seed"]

random.seed(random_seed)

# Vehicle types
vehicle_types = config["vehicles"]["types"]

# Calculate number of vehicles for the simulation period
number_of_vehicles = int(
    vehicles_per_hour * simulation_duration / 3600
)

print("EcoTwin Traffic Demand Generator")
print(f"Vehicles per hour: {vehicles_per_hour}")
print(f"Simulation duration: {simulation_duration} seconds")
print(f"Random seed: {random_seed}")
print(f"Vehicle types: {vehicle_types}")
print(f"Number of vehicles: {number_of_vehicles}")
# Generate vehicle demand
vehicles = []

for vehicle_id in range(number_of_vehicles):
    vehicle_type = random.choice(vehicle_types)
    departure_time = random.randint(0, simulation_duration - 1)

    vehicles.append({
        "id": f"veh_{vehicle_id:04d}",
        "type": vehicle_type,
        "depart": departure_time
    })

print(f"Generated {len(vehicles)} vehicles.")

# Route IDs
routes = [
    "route_0000",
    "route_0001"
]

# Assign a route to each vehicle
for vehicle in vehicles:
    vehicle["route"] = random.choice(routes)

print("Routes assigned to all vehicles.")
