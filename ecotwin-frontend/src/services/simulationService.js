const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8000";

const WEBSOCKET_URL =
  import.meta.env.VITE_WEBSOCKET_URL ||
  "ws://localhost:8000/ws/simulation";


export async function getSimulationState() {
  try {
    const response = await fetch(
      `${API_BASE_URL}/simulation/state`
    );

    if (!response.ok) {
      throw new Error(
        `Simulation API error: ${response.status}`
      );
    }

    const data = await response.json();

    if (!data || typeof data !== "object") {
      throw new Error(
        "Simulation API returned invalid data."
      );
    }

    return data;
  } catch (error) {
    console.error(
      "Unable to fetch simulation state:",
      error
    );

    return null;
  }
}


function isValidSimulationData(data) {
  if (!data || typeof data !== "object") {
    return false;
  }

  if (
    "vehicles" in data &&
    !Array.isArray(data.vehicles)
  ) {
    return false;
  }

  if (
    "traffic_lights" in data &&
    !Array.isArray(data.traffic_lights)
  ) {
    return false;
  }

  if (
    "simulation_time" in data &&
    typeof data.simulation_time !== "number"
  ) {
    return false;
  }

  return true;
}


export function connectSimulationSocket(
  onMessage,
  onError,
  onClose
) {
  const socket =
    new WebSocket(WEBSOCKET_URL);

  socket.onopen = () => {
    console.log(
      "EcoTwin simulation WebSocket connected."
    );
  };

  socket.onmessage = (event) => {
    try {
      const data =
        JSON.parse(event.data);

      if (!isValidSimulationData(data)) {
        console.warn(
          "Ignoring invalid simulation data:",
          data
        );

        return;
      }

      onMessage(data);
    } catch (error) {
      console.error(
        "Invalid simulation WebSocket data:",
        error
      );
    }
  };

  socket.onerror = (error) => {
    console.error(
      "Simulation WebSocket error:",
      error
    );

    if (onError) {
      onError(error);
    }
  };

  socket.onclose = () => {
    console.log(
      "EcoTwin simulation WebSocket disconnected."
    );

    if (onClose) {
      onClose();
    }
  };

  return socket;
}


export function disconnectSimulationSocket(
  socket
) {
  if (
    socket &&
    (
      socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING
    )
  ) {
    socket.close();
  }
}


export {
  API_BASE_URL,
  WEBSOCKET_URL,
};
