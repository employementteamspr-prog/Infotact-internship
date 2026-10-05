import json
import random
from pathlib import Path


# ============================================================
# EcoTwin - Traffic Demand Generator
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

CONFIG_FILE = BASE_DIR / "simulation_config.json"
OUTPUT_FILE = BASE_DIR / "traffic.rou.xml"


# ------------------------------------------------------------
# Load configuration
# ------------------------------------------------------------

def load_config():
    with open(CONFIG_FILE, "r", encoding="utf-8") as file:
        return json.load(file)


# ------------------------------------------------------------
# Generate traffic demand
# ------------------------------------------------------------

def generate_demand(config):

    simulation = config["simulation"]
    traffic_demand = config["traffic_demand"]
    vehicles_config = config["vehicles"]

    duration = simulation["duration_seconds"]
    vehicles_per_hour = traffic_demand["vehicles_per_hour"]
    random_seed = traffic_demand["random_seed"]

    vehicle_types = vehicles_config["types"]

    # Make generation reproducible
    random.seed(random_seed)

    # Calculate total vehicles
    vehicle_count = int(
        vehicles_per_hour * duration / 3600
    )

    print("========================================")
    print("EcoTwin Traffic Demand Generator")
    print("========================================")
    print(f"Vehicles per hour : {vehicles_per_hour}")
    print(f"Simulation duration : {duration} seconds")
    print(f"Random seed : {random_seed}")
    print(f"Vehicle types : {vehicle_types}")
    print(f"Total vehicles : {vehicle_count}")
    print()


    # --------------------------------------------------------
    # Routes for the existing EcoTwin J0-J24 network
    # --------------------------------------------------------

    routes = {
        "east": "E0 E2 E4 E6",
        "west": "E7 E5 E3 E1",
        "south": "E40 E42 E44 E46",
        "north": "E47 E45 E43 E41",
    }


    # --------------------------------------------------------
    # Start XML
    # --------------------------------------------------------

    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        "<routes>",
        "",
        # Vehicle types
        (
            '<vType id="car" '
            'accel="2.6" decel="4.5" sigma="0.5" '
            'length="5" minGap="2.5" maxSpeed="13.9"/>'
        ),
        (
            '<vType id="bus" '
            'accel="1.2" decel="4.0" sigma="0.5" '
            'length="12" minGap="2.5" maxSpeed="13.9"/>'
        ),
        (
            '<vType id="truck" '
            'accel="1.0" decel="4.0" sigma="0.5" '
            'length="12" minGap="2.5" maxSpeed="13.9"/>'
        ),
        "",
    ]


    # --------------------------------------------------------
    # Add route definitions
    # --------------------------------------------------------

    for route_name, edges in routes.items():

        lines.append(
            f'<route id="{route_name}_route" '
            f'edges="{edges}"/>'
        )

    lines.append("")


    # --------------------------------------------------------
    # Generate vehicles
    # --------------------------------------------------------

    route_names = list(routes.keys())

    for vehicle_id in range(vehicle_count):

        # Random vehicle type
        vehicle_type = random.choice(vehicle_types)

        # Random direction
        route_name = random.choice(route_names)

        # Evenly distribute vehicles across simulation
        if vehicle_count > 1:
            depart_time = (
                vehicle_id * duration / vehicle_count
            )
        else:
            depart_time = 0

        lines.append(
            f'<vehicle '
            f'id="veh_{vehicle_id:04d}" '
            f'type="{vehicle_type}" '
            f'route="{route_name}_route" '
            f'depart="{depart_time:.2f}"/>'
        )


    # --------------------------------------------------------
    # Finish XML
    # --------------------------------------------------------

    lines.append("")
    lines.append("</routes>")


    # --------------------------------------------------------
    # Write traffic.rou.xml
    # --------------------------------------------------------

    with open(
        OUTPUT_FILE,
        "w",
        encoding="utf-8"
    ) as file:

        file.write("\n".join(lines))


    print("Traffic demand generated successfully.")
    print(f"Output file : {OUTPUT_FILE}")
    print(f"Vehicles generated : {vehicle_count}")
    print(f"Routes available : {len(routes)}")


# ------------------------------------------------------------
# Main
# ------------------------------------------------------------

if __name__ == "__main__":

    config = load_config()

    generate_demand(config)