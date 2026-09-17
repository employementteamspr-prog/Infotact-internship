from fastapi import FastAPI
from API.sumo_data import start_sumo, simulation_step, close_sumo

app = FastAPI(title="EcoTwin Traffic Data API")


@app.get("/")
def root():
    return {"message": "EcoTwin Traffic Data API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/traffic")
def get_traffic():
    start_sumo()

    try:
        data = simulation_step()
        return {
            "vehicles": data
        }
    finally:
        close_sumo()