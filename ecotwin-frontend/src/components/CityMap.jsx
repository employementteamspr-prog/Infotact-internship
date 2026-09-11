import {
  MapContainer,
  Polyline,
  CircleMarker,
  Tooltip,
} from "react-leaflet";

import {
  CRS,
} from "leaflet";

import "leaflet/dist/leaflet.css";

import {
  intersections,
  gridConfig,
} from "../data/gridData";

function CityMap() {
  const {
    rows,
    columns,
    cellSizeMeters,
  } = gridConfig;

  const cityWidth =
    (columns - 1) * cellSizeMeters;

  const cityHeight =
    (rows - 1) * cellSizeMeters;

  const roads = [];

  // --------------------------------
  // Horizontal roads
  // --------------------------------

  for (let row = 0; row < rows; row++) {
    const y = row * cellSizeMeters;

    roads.push(
      <Polyline
        key={`horizontal-${row}`}
        positions={[
          [y, 0],
          [y, cityWidth],
        ]}
        pathOptions={{
          weight: 8,
        }}
      />
    );
  }

  // --------------------------------
  // Vertical roads
  // --------------------------------

  for (let column = 0; column < columns; column++) {
    const x = column * cellSizeMeters;

    roads.push(
      <Polyline
        key={`vertical-${column}`}
        positions={[
          [0, x],
          [cityHeight, x],
        ]}
        pathOptions={{
          weight: 8,
        }}
      />
    );
  }

  return (
    <MapContainer
      crs={CRS.Simple}
      center={[
        cityHeight / 2,
        cityWidth / 2,
      ]}
      zoom={1}
      minZoom={0}
      maxZoom={3}
      maxBounds={[
        [-50, -50],
        [cityHeight + 50, cityWidth + 50],
      ]}
      style={{
        width: "100%",
        height: "600px",
        background: "#e8edf0",
      }}
    >

      {/* =========================
          CITY ROAD GRID
      ========================= */}

      {roads}

      {/* =========================
          25 INTERSECTIONS
      ========================= */}

      {intersections.map((intersection) => (
        <CircleMarker
          key={intersection.id}
          center={[
            intersection.y,
            intersection.x,
          ]}
          radius={9}
          pathOptions={{
            weight: 2,
          }}
        >
          <Tooltip>
            <div>
              <strong>
                {intersection.id}
              </strong>

              <br />

              X: {intersection.x} m

              <br />

              Y: {intersection.y} m

              <br />

              Phase: {
                intersection.current_phase
              }
            </div>
          </Tooltip>
        </CircleMarker>
      ))}

    </MapContainer>
  );
}

export default CityMap;