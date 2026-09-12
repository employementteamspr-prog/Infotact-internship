import {
  CircleMarker,
  Tooltip,
} from "react-leaflet";

function IntersectionMarker({ intersection }) {
  const phaseName =
    intersection.current_phase === 0
      ? "green_ns"
      : "green_ew";

  return (
    <CircleMarker
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
          <strong>{intersection.id}</strong>

          <br />

          Coordinate:
          ({intersection.x}, {intersection.y}) m

          <br />

          Current Phase:
          {phaseName}

          <br />

          Queue Length:
          {intersection.queue_length}

          <br />

          Waiting Time:
          {intersection.waiting_time} s

          <br />

          Average Speed:
          {intersection.average_speed} m/s

          <br />

          CO₂ Emission:
          {intersection.co2_emission}

          <br />

          Phase Elapsed:
          {intersection.phase_elapsed_time} s
        </div>
      </Tooltip>
    </CircleMarker>
  );
}

export default IntersectionMarker;