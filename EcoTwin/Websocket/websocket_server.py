import asyncio

from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from API.sumo_data import start_sumo, simulation_step, close_sumo


app = FastAPI(title="EcoTwin WebSocket Server")


@app.websocket("/ws/traffic")
async def traffic_websocket(websocket: WebSocket):
    await websocket.accept()

    try:
        start_sumo()

        while True:
            data = simulation_step()

            await websocket.send_json({
                "vehicles": data
            })

            await asyncio.sleep(0.1)

    except WebSocketDisconnect:
        print("WebSocket client disconnected.")

    except Exception as e:
        print(f"WebSocket error: {e}")

    finally:
        close_sumo()