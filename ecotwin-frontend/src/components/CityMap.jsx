import {
  MapContainer,
  Polyline,
  useMap,
} from "react-leaflet";

import { CRS } from "leaflet";

import "leaflet/dist/leaflet.css";

import {
  intersections,
  gridConfig,
} from "../data/gridData";

import IntersectionMarker from "./IntersectionMarker";

// --------------------------------------------------
// Fit the complete city grid inside the map
// --------------------------------------------------
function FitCityBounds({ cityWidth, cityHeight }) {
  const map = useMap();

  const bounds = [
    [-50, -50],
    [cityHeight + 50, cityWidth + 50],
  ];

  map.fitBounds(bounds);

  return null;
}

// --------------------------------------------------
// Main City Map Component
// --------------------------------------------------
function CityMap() {
  const {
    rows,
    columns,
    cellSizeMeters,
  } = gridConfig;

  // Total simulation area
  const cityWidth =
    (columns - 1) * cellSizeMeters;

  const cityHeight =
    (rows - 1) * cellSizeMeters;

  // Store all roads
  const roads = [];

  // ------------------------------------------------
  // Create horizontal roads
  // ------------------------------------------------
  for (let row = 0; row < rows; row++) {
    const y = row * cellSizeMeters;

    roads.push(
      <Polyline
        key={`horizontal-road-${row}`}
        positions={[
          [y, 0],
          [y, cityWidth],
        ]}
        pathOptions={{
          weight: 7,
          color: "#344a44",
          opacity: 0.9,
          lineCap: "round",
          lineJoin: "round",
        }}
      />
    );
  }

  // ------------------------------------------------
  // Create vertical roads
  // ------------------------------------------------
  for (let column = 0; column < columns; column++) {
    const x = column * cellSizeMeters;

    roads.push(
      <Polyline
        key={`vertical-road-${column}`}
        positions={[
          [0, x],
          [cityHeight, x],
        ]}
        pathOptions={{
          weight: 7,
          color: "#344a44",
          opacity: 0.9,
          lineCap: "round",
          lineJoin: "round",
        }}
      />
    );
  }

  return (
    <MapContainer
      // EcoTwin uses simulation x/y coordinates
      // rather than geographical coordinates.
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

      maxBoundsViscosity={1.0}

      style={{
        width: "100%",
        height: "620px",
        background: "#e8eef0",
      }}
    >

      {/* ------------------------------------------
          Fit complete city grid
      ------------------------------------------ */}
      <FitCityBounds
        cityWidth={cityWidth}
        cityHeight={cityHeight}
      />

      {/* ------------------------------------------
          City road network
      ------------------------------------------ */}
      {roads}

      {/* ------------------------------------------
          25 traffic-light intersections
      ------------------------------------------ */}
      {intersections.map((intersection) => (
        <IntersectionMarker
          key={intersection.id}
          intersection={intersection}
        />
      ))}

    </MapContainer>
  );
}

export default CityMap;