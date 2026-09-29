// ==================================================
// EcoTwin - Simulation Integration Service
// ==================================================

// --------------------------------------------------
// Environment Configuration
// --------------------------------------------------

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8000";

const WEBSOCKET_URL =
  import.meta.env.VITE_WEBSOCKET_URL ||
  "ws://localhost:8001/ws/traffic";

const SIMULATION_MODE =
  import.meta.env.VITE_ECOTWIN_MODE === "mock"
    ? "mock"
    : "live";


// --------------------------------------------------
// Simulation Mode
// --------------------------------------------------

export function getSimulationMode() {
  return SIMULATION_MODE;
}


// --------------------------------------------------
// REST API
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


// --------------------------------------------------
// WebSocket Data Validation
// --------------------------------------------------

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


// --------------------------------------------------
// Backend -> EcoTwin Normalized Contract
// --------------------------------------------------

export function normalizeSimulationPayload(data) {

  // ------------------------------------------------
  // Vehicles
  // ------------------------------------------------

  const vehicles = Array.isArray(data?.vehicles)
    ? data.vehicles.map((vehicle) => ({
        id:
          vehicle.vehicle_id ||
          vehicle.id ||
          "unknown",

        // Supports both:
        // 1. x / y
        // 2. position.x / position.y
        x:
          Number(
            vehicle.x ??
            vehicle.position?.x
          ) || 0,

        y:
          Number(
            vehicle.y ??
            vehicle.position?.y
          ) || 0,

        speed:
          Number(vehicle.speed) || 0,

        type:
          vehicle.type || "car",

        // Supports both:
        // 1. co2
        // 2. co2_emission
        co2:
          Number(
            vehicle.co2 ??
            vehicle.co2_emission
          ) || 0,

        waiting_time:
          Number(
            vehicle.waiting_time
          ) || 0,
      }))
    : [];


  // ------------------------------------------------
  // Traffic Lights
  // ------------------------------------------------

  const trafficLights = Array.isArray(
    data?.traffic_lights
  )
    ? data.traffic_lights
    : [];


  // ------------------------------------------------
  // Signals
  // ------------------------------------------------

  const signals = trafficLights.map(
    (trafficLight) => {

      const phaseDuration =
        Number(
          trafficLight.phase_duration
        ) || 0;

      const phaseElapsed =
        Number(
          trafficLight.phase_elapsed_time
        ) || 0;

      return {
        id:
          trafficLight.id,

        phase:
          trafficLight.phase_type ||
          trafficLight.phase ||
          "unknown",

        current_phase:
          Number(
            trafficLight.current_phase
          ) || 0,

        phase_direction:
          trafficLight.phase_direction ||
          "unknown",

        remaining_seconds:
          Math.max(
            0,
            phaseDuration - phaseElapsed
          ),

        phase_duration:
          phaseDuration,

        phase_elapsed_time:
          phaseElapsed,

        queue_length:
          Number(
            trafficLight.queue_length
          ) || 0,

        waiting_time:
          Number(
            trafficLight.waiting_time
          ) || 0,

        average_speed:
          Number(
            trafficLight.average_speed
          ) || 0,

        co2_emission:
          Number(
            trafficLight.co2_emission
          ) || 0,
      };
    }
  );


  // ------------------------------------------------
  // Intersections
  // ------------------------------------------------

  const intersections = signals.map(
    (signal) => ({
      id:
        signal.id,

      queue_length:
        signal.queue_length,

      waiting_time:
        signal.waiting_time,

      co2:
        signal.co2_emission,

      average_speed:
        signal.average_speed,

      current_phase:
        signal.current_phase,

      phase_type:
        signal.phase,

      phase_direction:
        signal.phase_direction,
    })
  );


  // ------------------------------------------------
  // Metrics
  // ------------------------------------------------

  const backendMetrics =
    data?.metrics || {};

  const vehicleCount =
    Number(
      backendMetrics.vehicle_count
    ) || vehicles.length;

  const averageWaitingTime =
    Number(
      backendMetrics.avg_waiting_time
    ) ||
    (
      intersections.length > 0
        ? intersections.reduce(
            (total, intersection) =>
              total +
              intersection.waiting_time,
            0
          ) / intersections.length
        : 0
    );

  const totalQueue =
    Number(
      backendMetrics.queue_length
    ) ||
    intersections.reduce(
      (total, intersection) =>
        total +
        intersection.queue_length,
      0
    );

  const totalCO2 =
    Number(
      backendMetrics.total_co2
    ) ||
    intersections.reduce(
      (total, intersection) =>
        total +
        intersection.co2,
      0
    );


  // ------------------------------------------------
  // RL Data
  // ------------------------------------------------

  const backendRL =
    data?.rl || {};

  const rlReward =
    Number(
      backendRL.reward
    );

  const normalizedRL = {
    enabled:
      backendRL.enabled === true,

    algorithm:
      backendRL.algorithm ||
      "PPO",

    current_action:
      backendRL.current_action ??
      null,

    reward:
      Number.isFinite(rlReward)
        ? rlReward
        : Number(
            backendMetrics.rl_reward
          ) || 0,

    waiting_penalty:
      Number(
        backendRL.waiting_penalty
      ) || 0,

    co2_penalty:
      Number(
        backendRL.co2_penalty
      ) || 0,

    queue_penalty:
      Number(
        backendRL.queue_penalty
      ) || 0,

    status:
      backendRL.status ||
      "STANDBY",

    source:
      backendRL.source ||
      "environment",
  };


  // ------------------------------------------------
  // Final Normalized Contract
  // ------------------------------------------------

  return {
    timestamp:
      Number(
        data?.simulation_time
      ) || 0,

    simulation_status:
      "running",

    vehicles,

    signals,

    intersections,

    metrics: {
      vehicle_count:
        vehicleCount,

      avg_waiting_time:
        Number(
          averageWaitingTime.toFixed(2)
        ),

      queue_length:
        totalQueue,

      total_co2:
        Number(
          totalCO2.toFixed(2)
        ),

      // REAL RL reward from FastAPI/SUMO
      rl_reward:
        normalizedRL.reward,
    },

    // RL information
    rl:
      normalizedRL,

    // Keep the original backend data
    // for the current React UI.
    raw:
      data,
  };
}


// --------------------------------------------------
// REAL MODE
// SUMO -> TraCI -> FastAPI -> WebSocket -> React
// --------------------------------------------------

export function connectSimulationSocket(
  onMessage,
  onError,
  onClose
) {

  if (SIMULATION_MODE === "mock") {

    console.log(
      "EcoTwin simulation mode: MOCK"
    );

    return null;
  }


  console.log(
    "EcoTwin simulation mode: REAL"
  );

  console.log(
    "Connecting to:",
    WEBSOCKET_URL
  );


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


      const normalizedData =
        normalizeSimulationPayload(data);


      onMessage({
        ...data,

        normalized:
          normalizedData,
      });

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
// Disconnect
// --------------------------------------------------

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


// --------------------------------------------------
// Exports
// --------------------------------------------------

export {
  API_BASE_URL,
  WEBSOCKET_URL,
  SIMULATION_MODE,
};