import json
import random
import xml.etree.ElementTree as ET

# Load simulation configuration
with open("traffic/simulation_config.json", "r") as file:
    config = json.load(file)

# Settings
vehicles_per_hour = config["traffic_demand"]["vehicles_per_hour"]
simulation_duration = config["simulation"]["duration_seconds"]
random_seed = config["traffic_demand"]["random_seed"]

random.seed(random_seed)

vehicle_types = config["vehicles"]["types"]

# Routes from the SUMO network
routes = {
    "route_0000": "E0 E2 E4 E6",
    "route_0001": "E40 E42 E44 E46",
    "route_0002": "E48 E50 E52 E54",
    "route_0003": "E56 E58 E60 E62",
    "route_0004": "E64 E66 E68 E70",
    "route_0005": "E72 E74 E76 E78"
}

# Create XML root
root = ET.Element("routes")

# Vehicle types
vehicle_data = {
    "car": ("2.6", "4.5", "5", "2.5"),
    "bus": ("1.2", "4.0", "12", "2.5"),
    "truck": ("1.0", "4.0", "12", "2.5")
}

for vehicle_type, values in vehicle_data.items():
    accel, decel, length, min_gap = values

    ET.SubElement(
        root,
        "vType",
        id=vehicle_type,
        accel=accel,
        decel=decel,
        sigma="0.5",
        length=length,
        minGap=min_gap,
        maxSpeed="13.9"
    )

# Add routes
for route_id, edges in routes.items():
    ET.SubElement(
        root,
        "route",
        id=route_id,
        edges=edges
    )

# Traffic demand
flow_rates = {
    "car": 300,
    "bus": 150,
    "truck": 150
}

route_assignment = {
    "car": "route_0000",
    "bus": "route_0001",
    "truck": "route_0002"
}

for i, vehicle_type in enumerate(vehicle_types):
    ET.SubElement(
        root,
        "flow",
        id=f"flow_{i:04d}",
        type=vehicle_type,
        route=route_assignment[vehicle_type],
        begin="0",
        end=str(simulation_duration),
        vehsPerHour=str(flow_rates[vehicle_type])
    )

# Write XML file
tree = ET.ElementTree(root)
ET.indent(tree, space="    ")
tree.write("traffic.rou.xml", encoding="UTF-8", xml_declaration=True)

print("EcoTwin Traffic Demand Generator")
print(f"Vehicles per hour: {vehicles_per_hour}")
print(f"Simulation duration: {simulation_duration} seconds")
print(f"Random seed: {random_seed}")
print("Traffic route file generated successfully.")