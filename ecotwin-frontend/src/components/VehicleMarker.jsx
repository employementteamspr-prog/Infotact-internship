import { CircleMarker, Tooltip } from "react-leaflet";

function VehicleMarker({ vehicle }) {
  return (
    <CircleMarker
      center={[
        vehicle.y,
        vehicle.x,
      ]}
      radius={7}
      pathOptions={{
        color: "#111827",
        fillColor: "#f59e0b",
        fillOpacity: 1,
        weight: 2,
      }}
    >
      <Tooltip
        direction="top"
        offset={[0, -8]}
        opacity={1}
        sticky={true}
      >
        <div
          style={{
            minWidth: "160px",
            lineHeight: "1.5",
          }}
        >
          <strong>{vehicle.id}</strong>

          <br />

          Position:{" "}
          {vehicle.x}, {vehicle.y} m

          <br />

          Speed:{" "}
          {vehicle.speed} m/s

          <br />

          Waiting:{" "}
          {vehicle.waiting_time} s

          <br />

          Status:{" "}
          {Number(vehicle.speed) < 0.1
            ? "Stopped"
            : "Moving"}
        </div>
      </Tooltip>
    </CircleMarker>
  );
}

export default VehicleMarker;
