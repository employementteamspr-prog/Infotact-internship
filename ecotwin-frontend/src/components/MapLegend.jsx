function MapLegend() {
  return (
    <div className="map-legend">

      <div className="legend-header">
        <div>
          <h3>Map Legend</h3>

          <p>
            Traffic and environmental simulation indicators
          </p>
        </div>
      </div>


      <div className="legend-items">

        {/* ------------------------------------------
            NORTH-SOUTH PHASE
        ------------------------------------------ */}
        <div className="legend-item">

          <span className="legend-signal ns"></span>

          <div>
            <strong>
              North-South Green
            </strong>

            <span>
              green_ns
            </span>
          </div>

        </div>


        {/* ------------------------------------------
            EAST-WEST PHASE
        ------------------------------------------ */}
        <div className="legend-item">

          <span className="legend-signal ew"></span>

          <div>
            <strong>
              East-West Green
            </strong>

            <span>
              green_ew
            </span>
          </div>

        </div>


        {/* ------------------------------------------
            ROAD NETWORK
        ------------------------------------------ */}
        <div className="legend-item">

          <span className="legend-road"></span>

          <div>
            <strong>
              Road Network
            </strong>

            <span>
              100 m simulation grid
            </span>
          </div>

        </div>


        {/* ------------------------------------------
            CO₂ / ENVIRONMENTAL LAYER
        ------------------------------------------ */}
        <div className="legend-item">

          <span className="legend-environment"></span>

          <div>
            <strong>
              CO₂ / Environmental Zone
            </strong>

            <span>
              Emission intensity
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}

export default MapLegend;