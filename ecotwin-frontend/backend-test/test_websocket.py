import asyncio
import json
import websockets


async def test_websocket():

    url = "ws://localhost:8000/ws/simulation"

    print("Connecting to EcoTwin WebSocket...")

    async with websockets.connect(url) as websocket:

        print("WebSocket connected successfully.")

        for i in range(5):

            message = await websocket.recv()

            data = json.loads(message)

            print("\n--- Simulation Update ---")
            print("Simulation time:", data["simulation_time"])
            print("Vehicle count:", data["vehicle_count"])
            print("Traffic lights:", data["traffic_light_count"])

            if data["vehicles"]:
                vehicle = data["vehicles"][0]

                print("First vehicle:")
                print("  ID:", vehicle["id"])
                print("  Position:", vehicle["x"], vehicle["y"])
                print("  Speed:", vehicle["speed"], "m/s")

            if data["traffic_lights"]:
                traffic_light = data["traffic_lights"][0]

                print("First traffic light:")
                print("  ID:", traffic_light["id"])
                print(
                    "  Phase:",
                    traffic_light["current_phase"]
                )

    print("\nWebSocket test completed.")


asyncio.run(test_websocket())