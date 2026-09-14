import CityMap from "./components/CityMap";
import MapLegend from "./components/MapLegend";
import useSimulation from "./hooks/useSimulation";

function App() {
  const {
    intersections,
    connectionStatus,
    simulationDataAvailable,
  } = useSimulation();

  const isConnected =
    connectionStatus === "connected";

  return (
    <div className="app">

      {/* -----------------------------------------
          TOP HEADER
      ----------------------------------------- */}

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
              isConnected
                ? "connected"
                : ""
            }`}
          ></span>

          {isConnected
            ? "Simulation Connected"
            : "Map Ready"}

        </div>

      </header>


      {/* -----------------------------------------
          MAIN DASHBOARD
      ----------------------------------------- */}

      <main className="dashboard">

        {/* ---------------------------------------
            HERO SECTION
        --------------------------------------- */}

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


        {/* ---------------------------------------
            STATISTICS
        --------------------------------------- */}

        <section className="stats-grid">

          {/* CITY GRID */}

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


          {/* INTERSECTIONS */}

          <div className="stat-card">

            <div className="stat-icon signal-icon">
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
                Traffic signal points
              </small>

            </div>

          </div>


          {/* CELL SIZE */}

          <div className="stat-card">

            <div className="stat-icon distance-icon">
              ↔
            </div>

            <div>

              <span className="stat-label">
                CELL SIZE
              </span>

              <strong>
                100 m
              </strong>

              <small>
                Simulation distance
              </small>

            </div>

          </div>


          {/* STATUS */}

          <div className="stat-card">

            <div className="stat-icon status-icon">
              ✓
            </div>

            <div>

              <span className="stat-label">
                STATUS
              </span>

              <strong>
                {isConnected
                  ? "Live"
                  : "Ready"}
              </strong>

              <small>
                {simulationDataAvailable
                  ? "Live data received"
                  : "Waiting for simulation"}
              </small>

            </div>

          </div>

        </section>


        {/* ---------------------------------------
            SIMULATION MAP
        --------------------------------------- */}

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


          {/* -------------------------------------
              CITY MAP

              IMPORTANT:
              The intersection data from
              useSimulation() is passed into
              CityMap through this prop.
          ------------------------------------- */}

          <div className="map-wrapper">

            <CityMap
              intersections={intersections}
            />

          </div>


          {/* -------------------------------------
              MAP LEGEND
          ------------------------------------- */}

          <MapLegend />

        </section>

      </main>

    </div>
  );
}

export default App;