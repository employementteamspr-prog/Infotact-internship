import CityMap from "./components/CityMap";
import MapLegend from "./components/MapLegend";
import useSimulation from "./hooks/useSimulation";


// ==================================================
// FORMAT SIMULATION TIME
// ==================================================

function formatSimulationTime(seconds) {
  const totalSeconds = Math.floor(
    Number(seconds) || 0
  );

  const hours = Math.floor(
    totalSeconds / 3600
  );

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  const remainingSeconds =
    totalSeconds % 60;

  return [
    hours,
    minutes,
    remainingSeconds,
  ]
    .map((value) =>
      String(value).padStart(2, "0")
    )
    .join(":");
}


// ==================================================
// FORMAT LAST WEBSOCKET UPDATE
// ==================================================

function formatLastUpdateTime(date) {
  if (!date) {
    return "Waiting for data";
  }

  return new Date(date).toLocaleTimeString();
}


// ==================================================
// FORMAT CONNECTION STATUS
// ==================================================

function getConnectionLabel(status) {
  switch (status) {
    case "connected":
      return "Simulation Connected";

    case "connecting":
      return "Connecting to Simulation";

    case "error":
      return "Connection Error";

    case "offline":
      return "Simulation Offline";

    default:
      return "Simulation Offline";
  }
}


// ==================================================
// CALCULATE AVERAGE VEHICLE SPEED
// ==================================================

function calculateAverageVehicleSpeed(vehicles) {
  if (!vehicles.length) {
    return "0.00";
  }

  const totalSpeed =
    vehicles.reduce(
      (total, vehicle) =>
        total +
        (Number(vehicle.speed) || 0),
      0
    );

  return (
    totalSpeed / vehicles.length
  ).toFixed(2);
}


// ==================================================
// CALCULATE TOTAL QUEUE
// ==================================================

function calculateTotalQueue(intersections) {
  return intersections.reduce(
    (total, intersection) =>
      total +
      (Number(intersection.queue_length) || 0),
    0
  );
}


// ==================================================
// CALCULATE TOTAL CO2
// ==================================================

function calculateTotalCO2(intersections) {
  return intersections
    .reduce(
      (total, intersection) =>
        total +
        (Number(intersection.co2_emission) || 0),
      0
    )
    .toFixed(0);
}


// ==================================================
// MAIN APP
// ==================================================

function App() {

  const {
    intersections,
    vehicles,
    heatmapData,
    simulationTime,
    connectionStatus,
    simulationDataAvailable,
    lastUpdateTime,
    rl,
  } = useSimulation();


  // ================================================
  // CONNECTION STATUS
  // ================================================

  const isConnected =
    connectionStatus === "connected";


  const connectionLabel =
    getConnectionLabel(
      connectionStatus
    );


  // ================================================
  // WEBSOCKET STREAM HEALTH
  // ================================================

  const dataStreamHealthy =
    isConnected &&
    simulationDataAvailable &&
    lastUpdateTime !== null;


  // ================================================
  // DASHBOARD METRICS
  // ================================================

  const averageSpeed =
    calculateAverageVehicleSpeed(
      vehicles
    );


  const totalQueue =
    calculateTotalQueue(
      intersections
    );


  const totalCO2 =
    calculateTotalCO2(
      intersections
    );


  return (
    <div className="app">

      {/* ==========================================
          TOP HEADER
      ========================================== */}

      <header className="topbar">

        <div className="brand">

          <div className="brand-icon">
            E
          </div>

          <div>

            <h1>
              EcoTwin
            </h1>

            <p>
              Eco-Friendly Traffic Optimization
            </p>

          </div>

        </div>


        <div className="live-status">

          <span
            className={`status-dot ${
              isConnected
                ? "connected"
                : ""
            }`}
          ></span>

          {connectionLabel}

        </div>

      </header>


      {/* ==========================================
          MAIN DASHBOARD
      ========================================== */}

      <main className="dashboard">


        {/* ========================================
            HERO SECTION
        ======================================== */}

        <section className="hero">

          <div>

            <span className="eyebrow">
              CITY SIMULATION
            </span>

            <h2>
              Intelligent Traffic &
              <span>
                {" "}Environmental Monitoring
              </span>
            </h2>

            <p>
              Interactive simulation view for
              traffic intersections, vehicles,
              and environmental data.
            </p>

          </div>


          <div className="hero-badge">

            <strong>
              5 × 5
            </strong>

            <span>
              City Grid
            </span>

          </div>

        </section>


        {/* ========================================
            STATISTICS GRID
        ======================================== */}

        <section className="stats-grid">


          {/* City Grid */}

          <div className="stat-card">

            <div className="stat-icon grid-icon">
              ▪
            </div>

            <div>

              <span className="stat-label">
                CITY GRID
              </span>

              <strong>
                5 × 5
              </strong>

              <small>
                Simulation layout
              </small>

            </div>

          </div>


          {/* Active Vehicles */}

          <div className="stat-card">

            <div className="stat-icon signal-icon">
              —
            </div>

            <div>

              <span className="stat-label">
                ACTIVE VEHICLES
              </span>

              <strong>
                {vehicles.length}
              </strong>

              <small>
                Live simulation vehicles
              </small>

            </div>

          </div>


          {/* Simulation Time */}

          <div className="stat-card">

            <div className="stat-icon distance-icon">
              ◷
            </div>

            <div>

              <span className="stat-label">
                SIMULATION TIME
              </span>

              <strong>
                {formatSimulationTime(
                  simulationTime
                )}
              </strong>

              <small>
                HH : MM : SS
              </small>

            </div>

          </div>


          {/* Intersections */}

          <div className="stat-card">

            <div className="stat-icon status-icon">
              —
            </div>

            <div>

              <span className="stat-label">
                INTERSECTIONS
              </span>

              <strong>
                {intersections.length}
              </strong>

              <small>
                Live traffic signal points
              </small>

            </div>

          </div>


          {/* Average Speed */}

          <div className="stat-card">

            <div className="stat-icon distance-icon">
              ≪
            </div>

            <div>

              <span className="stat-label">
                AVG SPEED
              </span>

              <strong>
                {averageSpeed}
              </strong>

              <small>
                m/s across live vehicles
              </small>

            </div>

          </div>


          {/* Queue */}

          <div className="stat-card">

            <div className="stat-icon signal-icon">
              ≡
            </div>

            <div>

              <span className="stat-label">
                TOTAL QUEUE
              </span>

              <strong>
                {totalQueue}
              </strong>

              <small>
                Waiting vehicles
              </small>

            </div>

          </div>


          {/* CO2 */}

          <div className="stat-card">

            <div className="stat-icon status-icon">
              CO₂
            </div>

            <div>

              <span className="stat-label">
                CO₂ EMISSION
              </span>

              <strong>
                {totalCO2}
              </strong>

              <small>
                Current simulation value
              </small>

            </div>

          </div>


          {/* Connection */}

          <div className="stat-card">

            <div className="stat-icon status-icon">
              —
            </div>

            <div>

              <span className="stat-label">
                CONNECTION
              </span>

              <strong>
                {connectionStatus === "connected"
                  ? "LIVE"
                  : connectionStatus === "connecting"
                    ? "CONNECTING"
                    : connectionStatus === "error"
                      ? "ERROR"
                      : "OFFLINE"}
              </strong>

              <small>
                WebSocket connection state
              </small>

            </div>

          </div>


          {/* RL Reward */}

          <div className="stat-card">

            <div className="stat-label">
              RL Reward
            </div>

            <div className="stat-value">
              {Number(
                rl?.reward ?? 0
              ).toFixed(4)}
            </div>

            <div className="stat-subtext">
              {rl?.algorithm || "PPO"}
              {" "}•{" "}
              {rl?.status || "STANDBY"}
            </div>

          </div>

        </section>


        {/* ========================================
            WEBSOCKET DATA STREAM HEALTH
        ======================================== */}

        <section className="simulation-monitor">

          <div className="monitor-header">

            <div>

              <span className="eyebrow">
                DATA STREAM
              </span>

              <h3>
                WebSocket Stream Health
              </h3>

            </div>


            <div className="simulation-chip">

              <span
                className={`status-dot ${
                  dataStreamHealthy
                    ? "connected"
                    : ""
                }`}
              ></span>

              {dataStreamHealthy
                ? "STREAM HEALTHY"
                : connectionStatus === "connecting"
                  ? "CONNECTING"
                  : connectionStatus === "error"
                    ? "STREAM ERROR"
                    : "STREAM OFFLINE"}

            </div>

          </div>


          <div className="monitor-grid">


            {/* Last Update */}

            <div className="monitor-item">

              <span>
                LAST UPDATE
              </span>

              <strong>
                {formatLastUpdateTime(
                  lastUpdateTime
                )}
              </strong>

            </div>


            {/* Stream Status */}

            <div className="monitor-item">

              <span>
                STREAM STATUS
              </span>

              <strong>
                {dataStreamHealthy
                  ? "HEALTHY"
                  : connectionStatus === "connecting"
                    ? "CONNECTING"
                    : connectionStatus === "error"
                      ? "ERROR"
                      : "OFFLINE"}
              </strong>

            </div>


            {/* Data Source */}

            <div className="monitor-item">

              <span>
                DATA SOURCE
              </span>

              <strong>
                SUMO
              </strong>

            </div>


            {/* Transport */}

            <div className="monitor-item">

              <span>
                TRANSPORT
              </span>

              <strong>
                WebSocket
              </strong>

            </div>

          </div>

        </section>


        {/* ========================================
            SIMULATION MAP
        ======================================== */}

        <section className="simulation-card">

          <div className="section-heading">

            <div>

              <span className="eyebrow">
                SIMULATION VIEW
              </span>

              <h3>
                City Traffic Simulation
              </h3>

            </div>


            <div className="simulation-chip">

              <span
                className={`status-dot ${
                  isConnected
                    ? "connected"
                    : ""
                }`}
              ></span>

              {isConnected
                ? "LIVE SIMULATION"
                : "SIMULATION MAP"}

            </div>

          </div>


          <div className="map-wrapper">

            <CityMap
              intersections={
                intersections
              }

              vehicles={
                vehicles
              }

              heatmapData={
                heatmapData
              }
            />

          </div>


          <MapLegend />

        </section>

      </main>

    </div>
  );
}


export default App;