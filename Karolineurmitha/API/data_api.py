from fastapi import FastAPI

app = FastAPI(title="EcoTwin Traffic Data API")


@app.get("/")
def root():
    return {"message": "EcoTwin Traffic Data API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}