import json

from fastapi import FastAPI, WebSocket
from API.sumo_data import start_sumo, simulation_step, close_sumo

app = FastAPI(title="EcoTwin WebSocket Server")


@app.websocket("/ws/traffic")
async def traffic_websocket(websocket: WebSocket):
    await websocket.accept()

    start_sumo()

    try:
        for _ in range(100):
            data = simulation_step()

            await websocket.send_text(json.dumps({
                "vehicles": data
            }))

    except Exception as e:
        print(f"WebSocket error: {e}")

    finally:
        close_sumo()
        await websocket.close()