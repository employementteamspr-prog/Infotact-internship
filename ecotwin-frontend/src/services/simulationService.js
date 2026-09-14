// ==================================================
// EcoTwin - Simulation Integration Service
// ==================================================

/*
  This service is the bridge between the frontend
  and the future EcoTwin simulation backend.

  Future architecture:

  SUMO
    ↓
  Python / RL
    ↓
  FastAPI + WebSocket
    ↓
  simulationService.js
    ↓
  React Components
*/

// --------------------------------------------------
// BACKEND CONFIGURATION
// --------------------------------------------------

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8000";

const WEBSOCKET_URL =
  import.meta.env.VITE_WEBSOCKET_URL ||
  "ws://localhost:8000/ws/simulation";

// --------------------------------------------------
// GET CURRENT SIMULATION STATE
// --------------------------------------------------

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

    return await response.json();
  } catch (error) {
    console.error(
      "Unable to fetch simulation state:",
      error
    );

    return null;
  }
}

// --------------------------------------------------
// CREATE WEBSOCKET CONNECTION
// --------------------------------------------------

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

// --------------------------------------------------
// CLOSE WEBSOCKET CONNECTION
// --------------------------------------------------

export function disconnectSimulationSocket(
  socket
) {
  if (
    socket &&
    socket.readyState === WebSocket.OPEN
  ) {
    socket.close();
  }
}

// --------------------------------------------------
// EXPORT CONFIGURATION
// --------------------------------------------------

export {
  API_BASE_URL,
  WEBSOCKET_URL,
};