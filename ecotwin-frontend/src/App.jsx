import CityMap from "./components/CityMap";
import MapLegend from "./components/MapLegend";
import useSimulation from "./hooks/useSimulation";

function formatSimulationTime(seconds) {
  const totalSeconds = Math.floor(Number(seconds) || 0);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  return [
    hours,
    minutes,
    remainingSeconds,
  ]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function App() {
  const {
    intersections,
    vehicles,
    simulationTime,
    connectionStatus,
    simulationDataAvailable,
  } = useSimulation();

  const isConnected =
    connectionStatus === "connected";

  return (
    <div className="app">

      <header className="topbar">

        <div className="brand">

          <div className="brand-icon">
            E
          </div>

          <div>
            <h1>EcoTwin</h1>

            <p>
              Eco-Friendly Traffic Optimization
            </p>
          </div>

        </div>

        <div className="live-status">

          <span
            className={`status-dot ${
              isConnected ? "connected" : ""
            }`}
          ></span>

          {isConnected
            ? "Simulation Connected"
            : "Map Ready"}

        </div>

      </header>


      <main className="dashboard">

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
              traffic intersections and future
              environmental data.
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


        <section className="stats-grid">

          {/* City Grid */}
          <div className="stat-card">

            <div className="stat-icon grid-icon">
              ▦
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


          {/* Live Vehicles */}
          <div className="stat-card">

            <div className="stat-icon signal-icon">
              ●
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
                {formatSimulationTime(simulationTime)}
              </strong>

              <small>
                HH : MM : SS
              </small>

            </div>

          </div>


          {/* Intersections */}
          <div className="stat-card">

            <div className="stat-icon status-icon">
              ●
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

        </section>


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
                  isConnected ? "connected" : ""
                }`}
              ></span>

              {isConnected
                ? "LIVE SIMULATION"
                : "SIMULATION MAP"}

            </div>

          </div>


          <div className="map-wrapper">

            <CityMap
              intersections={intersections}
              vehicles={vehicles}
            />

          </div>


          <MapLegend />

        </section>

      </main>

    </div>
  );
}

export default App;