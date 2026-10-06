import asyncio

from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from API.rl_service import RLTrafficService


app = FastAPI(title="EcoTwin Traffic Data API")


# Persistent PPO + SUMO service
rl_service = RLTrafficService()


@app.get("/")
def root():
    return {
        "message": "EcoTwin Traffic Data API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "ok"
    }


@app.get("/traffic/start")
def start_traffic():
    return rl_service.start()


@app.get("/traffic")
def get_traffic():
    return rl_service.step()


@app.get("/traffic/stop")
def stop_traffic():
    rl_service.stop()

    return {
        "status": "stopped"
    }


@app.websocket("/ws/traffic")
async def traffic_websocket(websocket: WebSocket):
    await websocket.accept()

    try:
        rl_service.start()

        while True:
            data = rl_service.step()

            await websocket.send_json(data)

            await asyncio.sleep(0.1)

    except WebSocketDisconnect:
        print("WebSocket client disconnected.")

    except Exception as e:
        print(f"WebSocket error: {e}")

    finally:
        rl_service.stop()