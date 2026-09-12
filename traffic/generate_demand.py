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
