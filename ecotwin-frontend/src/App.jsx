import CityMap from "./components/CityMap";

function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>EcoTwin</h1>

        <p>
          Eco-Friendly Traffic Optimization Dashboard
        </p>
      </header>

      <main className="dashboard">
        <section className="dashboard-card">
          <h2>City Traffic Simulation</h2>

          <div className="stats">
            <div className="stat">
              <strong>Grid</strong>
              <span>5 × 5</span>
            </div>

            <div className="stat">
              <strong>Intersections</strong>
              <span>25</span>
            </div>

            <div className="stat">
              <strong>Cell Size</strong>
              <span>100 m</span>
            </div>
          </div>

          <CityMap />
        </section>
      </main>
    </div>
  );
}

export default App;