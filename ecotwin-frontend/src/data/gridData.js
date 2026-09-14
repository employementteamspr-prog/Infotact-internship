// ==================================================
// EcoTwin - City Grid & Simulation Configuration
// ==================================================

/*
  These values follow the EcoTwin project configuration.

  The frontend uses the same structure that the
  future SUMO / FastAPI / WebSocket integration
  will provide.
*/

// --------------------------------------------------
// CITY CONFIGURATION
// --------------------------------------------------

const GRID_ROWS = 5;
const GRID_COLUMNS = 5;
const CELL_SIZE_METERS = 100;

export const gridConfig = {
  rows: GRID_ROWS,
  columns: GRID_COLUMNS,

  cellSizeMeters: CELL_SIZE_METERS,

  intersectionCount:
    GRID_ROWS * GRID_COLUMNS,

  coordinateSystem: "x_y",
  distanceUnit: "meters",
};


// --------------------------------------------------
// SIMULATION CONFIGURATION
// --------------------------------------------------

export const simulationConfig = {
  timestepSeconds: 1,
  durationSeconds: 3600,
  seed: 42,
};


// --------------------------------------------------
// VEHICLE CONFIGURATION
// --------------------------------------------------

export const vehicleConfig = {
  types: [
    "car",
    "bus",
    "truck",
  ],

  maxSpeedMps: 13.9,

  vehicleIdFormat: "veh_{id:04d}",
};


// --------------------------------------------------
// ROAD CONFIGURATION
// --------------------------------------------------

export const roadConfig = {
  roadIdFormat: "road_{id:04d}",

  lanesPerDirection: 1,

  speedLimitMps: 13.9,
};


// --------------------------------------------------
// TRAFFIC LIGHT CONFIGURATION
// --------------------------------------------------

export const trafficLightConfig = {

  idFormat: "tls_{id:04d}",

  phases: {
    green_ns: 0,
    green_ew: 1,
  },

  minGreenSeconds: 10,

  maxGreenSeconds: 60,

  yellowSeconds: 3,
};


// --------------------------------------------------
// OBSERVATION CONFIGURATION
// --------------------------------------------------

export const observationVariables = [
  "queue_length",
  "waiting_time",
  "average_speed",
  "co2_emission",
  "current_phase",
  "phase_elapsed_time",
];


// --------------------------------------------------
// ACTION CONFIGURATION
// --------------------------------------------------

export const actionConfig = {
  type: "discrete",

  values: [
    "keep_phase",
    "switch_phase",
  ],
};


// --------------------------------------------------
// INTERSECTION DATA
// --------------------------------------------------

export const intersections = [];

for (
  let row = 0;
  row < GRID_ROWS;
  row++
) {

  for (
    let column = 0;
    column < GRID_COLUMNS;
    column++
  ) {

    const index =
      row * GRID_COLUMNS + column;

    intersections.push({

      // --------------------------------------------
      // Traffic-light identity
      // --------------------------------------------

      id:
        `tls_${String(index).padStart(4, "0")}`,

      row,

      column,


      // --------------------------------------------
      // Simulation coordinates
      // --------------------------------------------

      x:
        column * CELL_SIZE_METERS,

      y:
        row * CELL_SIZE_METERS,


      // --------------------------------------------
      // Traffic-light state
      // --------------------------------------------

      current_phase:
        index % 2,

      phase_elapsed_time: 0,


      // --------------------------------------------
      // Simulation observations
      //
      // These are currently initial values.
      // Later they will be replaced by live
      // SUMO / FastAPI / WebSocket data.
      // --------------------------------------------

      queue_length: 0,

      waiting_time: 0,

      average_speed: 0,

      co2_emission: 0,

    });
  }
}