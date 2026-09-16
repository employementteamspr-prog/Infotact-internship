import {
  MapContainer,
  Polyline,
  Circle,
  Pane,
  useMap,
} from "react-leaflet";

import { CRS } from "leaflet";

import "leaflet/dist/leaflet.css";

import {
  gridConfig,
} from "../data/gridData";

import IntersectionMarker from "./IntersectionMarker";
import VehicleMarker from "./VehicleMarker";

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

function CityMap({
  intersections: simulationIntersections = [],
  vehicles = [],
}) {
  const intersections =
    simulationIntersections;

  const {
    rows,
    columns,
    cellSizeMeters,
  } = gridConfig;

  const cityWidth =
    (columns - 1) *
    cellSizeMeters;

  const cityHeight =
    (rows - 1) *
    cellSizeMeters;

  const mapPadding = 100;
  const roads = [];
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

      <FitCityBounds
        cityWidth={cityWidth}
        cityHeight={cityHeight}
      />

      {roads}
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

      {/* Traffic signal layer */}
<Pane
  name="intersections"
  style={{
    zIndex: 650,
  }}
>
  {intersections.map((intersection) => (
    <IntersectionMarker
      key={intersection.id}
      intersection={intersection}
    />
  ))}
</Pane>

{/* Vehicle layer */}
<Pane
  name="vehicles"
  style={{
    zIndex: 600,
  }}
>
  {vehicles.map((vehicle) => (
    <VehicleMarker
      key={vehicle.id}
      vehicle={vehicle}
    />
  ))}
</Pane>

    </MapContainer>
  );
}

export default CityMap;