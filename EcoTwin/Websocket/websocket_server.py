import asyncio

from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from API.sumo_data import (
    start_sumo,
    simulation_step,
    close_sumo,
)


app = FastAPI(title="EcoTwin WebSocket Server")


@app.websocket("/ws/traffic")
async def traffic_websocket(websocket: WebSocket):

    await websocket.accept()

    print("WebSocket client connected.")

    try:
        start_sumo()

        simulation_time = 0

        while True:

            data = simulation_step()

            simulation_time += 1

            # Convert SUMO vehicle data into the format
            # expected by the React frontend.
            vehicles = []

            for vehicle in data:

                position = vehicle.get("position", {})

                vehicles.append({
                    "vehicle_id": vehicle.get("vehicle_id"),
                    "x": float(position.get("x", 0)),
                    "y": float(position.get("y", 0)),
                    "speed": float(vehicle.get("speed", 0)),
                    "type": "car",
                    "co2": float(
                        vehicle.get("co2_emission", 0)
                    ),
                    "waiting_time": float(
                        vehicle.get("waiting_time", 0)
                    ),
                    "road_id": vehicle.get("road_id"),
                    "lane_id": vehicle.get("lane_id"),
                })

            # Send the complete message expected by React.
            await websocket.send_json({
                "simulation_time": simulation_time,

                "vehicles": vehicles,

                "traffic_lights": [],

                "rl": {
                    "enabled": False,
                    "algorithm": "PPO",
                    "current_action": None,
                    "reward": 0,
                    "waiting_penalty": 0,
                    "co2_penalty": 0,
                    "queue_penalty": 0,
                    "status": "STANDBY",
                    "source": "environment",
                },
            })

            await asyncio.sleep(0.1)

    except WebSocketDisconnect:

        print("WebSocket client disconnected.")

    except Exception as e:

        print(f"WebSocket error: {e}")

    finally:

        print("Closing SUMO connection.")

        try:
            close_sumo()

        except Exception as e:

            print(f"SUMO close error: {e}")

        print("WebSocket session ended.")