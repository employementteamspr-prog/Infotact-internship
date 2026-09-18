import json
import random
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
CONFIG_FILE = BASE_DIR / "simulation_config.json"
OUTPUT_FILE = BASE_DIR / "traffic.rou.xml"


def load_config():
    with open(CONFIG_FILE, "r", encoding="utf-8") as file:
        return json.load(file)


def generate_demand(config):
    random.seed(config["simulation"]["random_seed"])

    vehicles_per_hour = config["traffic_demand"]["vehicles_per_hour"]
    duration = config["simulation"]["duration"]

    vehicle_count = int(vehicles_per_hour * duration / 3600)

    vehicle_types = config["vehicles"]["types"]

    routes = {
        "east": "e0 e1 e2 e3",
        "west": "e23 e22 e21 e20",
        "south": "e40 e41 e42 e43",
        "north": "e63 e62 e61 e60"
    }

    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        "<routes>",
        "",
        '<vType id="car" accel="2.6" decel="4.5" '
        'sigma="0.5" length="5" minGap="2.5" maxSpeed="13.9"/>',
        '<vType id="bus" accel="1.2" decel="4.0" '
        'sigma="0.5" length="12" minGap="3" maxSpeed="13.9"/>',
        '<vType id="truck" accel="1.0" decel="3.5" '
        'sigma="0.5" length="12" minGap="3" maxSpeed="13.9"/>',
        ""
    ]

    for route_name, edges in routes.items():
        lines.append(
            f'<route id="{route_name}_route" edges="{edges}"/>'
        )

    lines.append("")

    route_names = list(routes.keys())

    for vehicle_id in range(vehicle_count):
        vehicle_type = random.choice(vehicle_types)
        route_name = random.choice(route_names)
        depart_time = vehicle_id * duration / vehicle_count

        lines.append(
            f'<vehicle id="veh_{vehicle_id:04d}" '
            f'type="{vehicle_type}" '
            f'route="{route_name}_route" '
            f'depart="{depart_time:.2f}"/>'
        )

    lines.append("</routes>")

    with open(OUTPUT_FILE, "w", encoding="utf-8") as file:
        file.write("\n".join(lines))

    print(f"Generated {vehicle_count} vehicles.")
    print(f"Output file: {OUTPUT_FILE}")


if __name__ == "__main__":
    config = load_config()
    generate_demand(config)