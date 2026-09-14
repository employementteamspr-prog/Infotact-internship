import { CircleMarker, Tooltip } from "react-leaflet";

function IntersectionMarker({ intersection }) {
  const isNorthSouth =
    intersection.current_phase === 0;

  const phaseName = isNorthSouth
    ? "green_ns"
    : "green_ew";

  const phaseLabel = isNorthSouth
    ? "North-South Green"
    : "East-West Green";

  return (
    <CircleMarker
      center={[
        intersection.y,
        intersection.x,
      ]}
      radius={10}
      pathOptions={{
        color: isNorthSouth ? "#16a34a" : "#2563eb",
        fillColor: isNorthSouth ? "#22c55e" : "#3b82f6",
        fillOpacity: 1,
        weight: 2,
      }}
    >
      <Tooltip>
        <div style={{ minWidth: "180px" }}>
          <strong>{intersection.id}</strong>

          <br />
          <br />

          <strong>Coordinates</strong>
          <br />
          X: {intersection.x} m
          <br />
          Y: {intersection.y} m

          <br />
          <br />

          <strong>Traffic Phase</strong>
          <br />
          {phaseName}
          <br />
          {phaseLabel}

          <br />
          <br />

          <strong>Simulation Data</strong>
          <br />
          Queue: {intersection.queue_length}
          <br />
          Waiting: {intersection.waiting_time} s
          <br />
          Speed: {intersection.average_speed} m/s
          <br />
          CO₂: {intersection.co2_emission}
          <br />
          Phase Time: {intersection.phase_elapsed_time} s
        </div>
      </Tooltip>
    </CircleMarker>
  );
}

export default IntersectionMarker;