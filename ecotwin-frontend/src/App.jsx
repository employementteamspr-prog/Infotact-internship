import CityMap from "./components/CityMap";
import MapLegend from "./components/MapLegend";

function App() {
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
          <span className="status-dot"></span>
          Map Ready
        </div>

      </header>


      {/* -----------------------------------------
          MAIN CONTENT
      ----------------------------------------- */}
      <main className="dashboard">

        {/* -----------------------------------------
            HERO SECTION
        ----------------------------------------- */}
        <section className="hero">

          <div>

            <span className="eyebrow">
              CITY SIMULATION
            </span>

            <h2>
              Intelligent Traffic &
              <span> Environmental Monitoring</span>
            </h2>

            <p>
              Interactive simulation view for traffic
              intersections and future environmental data.
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


        {/* -----------------------------------------
            STAT CARDS
        ----------------------------------------- */}
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


          {/* Intersections */}
          <div className="stat-card">

            <div className="stat-icon signal-icon">
              ●
            </div>

            <div>

              <span className="stat-label">
                INTERSECTIONS
              </span>

              <strong>
                25
              </strong>

              <small>
                Traffic signal points
              </small>

            </div>

          </div>


          {/* Cell Size */}
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


          {/* Map Status */}
          <div className="stat-card">

            <div className="stat-icon status-icon">
              ✓
            </div>

            <div>

              <span className="stat-label">
                STATUS
              </span>

              <strong>
                Ready
              </strong>

              <small>
                Map initialized
              </small>

            </div>

          </div>

        </section>


        {/* -----------------------------------------
            MAP SECTION
        ----------------------------------------- */}
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

              <span className="status-dot"></span>

              SIMULATION MAP

            </div>

          </div>


          {/* City Map */}
          <div className="map-wrapper">

            <CityMap />

          </div>


          {/* Map Legend */}
          <MapLegend />

        </section>


    

      </main>

    </div>
  );
}

export default App;