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
        color: isNorthSouth
          ? "#16a34a"
          : "#2563eb",

        fillColor: isNorthSouth
          ? "#22c55e"
          : "#3b82f6",

        fillOpacity: 1,
        weight: 2,
      }}
    >

      <Tooltip
        direction="top"
        offset={[0, -8]}
        opacity={1}
        className="intersection-tooltip"
      >

        <div className="intersection-tooltip-content">

          <strong>
            {intersection.id}
          </strong>


          <div className="tooltip-section">

            <strong>
              Coordinates
            </strong>

            <br />

            X: {intersection.x} m

            <br />

            Y: {intersection.y} m

          </div>


          <div className="tooltip-section">

            <strong>
              Traffic Phase
            </strong>

            <br />

            {phaseName}

            <br />

            {phaseLabel}

          </div>


          <div className="tooltip-section">

            <strong>
              Simulation Data
            </strong>

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

        </div>

      </Tooltip>

    </CircleMarker>
  );
}

export default IntersectionMarker;