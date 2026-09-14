import {
  MapContainer,
  Polyline,
  Circle,
  useMap,
} from "react-leaflet";

import { CRS } from "leaflet";

import "leaflet/dist/leaflet.css";

import {
  gridConfig,
} from "../data/gridData";

import IntersectionMarker from "./IntersectionMarker";

// --------------------------------------------------
// Fit the complete city grid inside the map
// --------------------------------------------------

function FitCityBounds({
  cityWidth,
  cityHeight,
}) {
  const map = useMap();

  const bounds = [
    [-100, -100],
    [
      cityHeight + 100,
      cityWidth + 100,
    ],
  ];

  map.fitBounds(bounds, {
    padding: [30, 30],
  });

  return null;
}

// --------------------------------------------------
// Convert CO₂ value into environmental intensity
// --------------------------------------------------

function getEnvironmentalStyle(
  co2Emission
) {
  const value =
    Number(co2Emission) || 0;

  if (value <= 0) {
    return {
      radius: 0,
      opacity: 0,
    };
  }

  const intensity =
    Math.min(value / 100, 1);

  return {
    radius:
      25 + intensity * 45,

    opacity:
      0.12 + intensity * 0.28,
  };
}

// --------------------------------------------------
// Main City Map Component
// --------------------------------------------------

function CityMap({
  intersections: simulationIntersections = [],
}) {
  const intersections =
    simulationIntersections;

  const {
    rows,
    columns,
    cellSizeMeters,
  } = gridConfig;

  // ------------------------------------------------
  // Calculate total city dimensions
  // ------------------------------------------------

  const cityWidth =
    (columns - 1) *
    cellSizeMeters;

  const cityHeight =
    (rows - 1) *
    cellSizeMeters;

  // ------------------------------------------------
  // Extra space around city grid
  // ------------------------------------------------

  const mapPadding = 100;

  // ------------------------------------------------
  // Store all roads
  // ------------------------------------------------

  const roads = [];

  // ------------------------------------------------
  // Create horizontal roads
  // ------------------------------------------------

  for (
    let row = 0;
    row < rows;
    row++
  ) {
    const y =
      row * cellSizeMeters;

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

  for (
    let column = 0;
    column < columns;
    column++
  ) {
    const x =
      column * cellSizeMeters;

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

  // ------------------------------------------------
  // Render map
  // ------------------------------------------------

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
        [-mapPadding, -mapPadding],
        [
          cityHeight + mapPadding,
          cityWidth + mapPadding,
        ],
      ]}

      maxBoundsViscosity={1.0}

      style={{
        width: "100%",
        height: "620px",
        background: "#e8eef0",
      }}
    >

      {/* ------------------------------------------
          FIT COMPLETE CITY GRID
      ------------------------------------------ */}

      <FitCityBounds
        cityWidth={cityWidth}
        cityHeight={cityHeight}
      />

      {/* ------------------------------------------
          CITY ROAD NETWORK
      ------------------------------------------ */}

      {roads}

      {/* ------------------------------------------
          ENVIRONMENTAL / CO₂ LAYER
      ------------------------------------------ */}

      {intersections.map(
        (intersection) => {

          const environmentalStyle =
            getEnvironmentalStyle(
              intersection.co2_emission
            );

          if (
            environmentalStyle.radius === 0
          ) {
            return null;
          }

          return (
            <Circle
              key={`co2-${intersection.id}`}

              center={[
                intersection.y,
                intersection.x,
              ]}

              radius={
                environmentalStyle.radius
              }

              pathOptions={{
                color: "#dc6b32",
                fillColor: "#ef8a45",

                fillOpacity:
                  environmentalStyle.opacity,

                weight: 1,

                opacity: 0.35,
              }}
            />
          );
        }
      )}

      {/* ------------------------------------------
          TRAFFIC-LIGHT INTERSECTIONS
      ------------------------------------------ */}

      {intersections.map(
        (intersection) => (
          <IntersectionMarker
            key={intersection.id}
            intersection={intersection}
          />
        )
      )}

    </MapContainer>
  );
}

export default CityMap;