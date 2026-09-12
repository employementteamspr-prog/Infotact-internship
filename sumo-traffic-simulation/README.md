# SUMO Traffic Simulation

## Simulation Configuration

- City grid: 5 × 5
- Intersections: 25
- Cell/road length: 100 m
- Lanes: 1 lane per direction
- Speed limit: 13.9 m/s
- Simulation timestep: 1 second
- Simulation duration: 3600 seconds (1 hour)
- Random seed: 42
- Traffic demand: 600 vehicles/hour

## Vehicle Types

- Car: 420 vehicles/hour
- Bus: 90 vehicles/hour
- Truck: 90 vehicles/hour

All vehicle types have a maximum speed of 13.9 m/s.

## Traffic Lights

SUMO-generated static traffic-light programs are currently used.

The generated program uses:
- Green: 42 seconds
- Yellow: 3 seconds
- Two-direction signal phases

The traffic-light control will later be replaced/controlled through TraCI by the RL environment.

## Project Structure

```text
sumo-traffic-simulation/
├── config/
│   └── city.sumocfg
├── network/
│   ├── city.nod.xml
│   ├── city.edg.xml
│   └── city.net.xml
├── routes/
│   └── traffic.rou.xml
├── scripts/
│   └── run_sumo.py
├── output/
└── README.md