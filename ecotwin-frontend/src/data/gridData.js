const GRID_ROWS = 5;
const GRID_COLUMNS = 5;
const CELL_SIZE_METERS = 100;

export const gridConfig = {
  rows: GRID_ROWS,
  columns: GRID_COLUMNS,
  cellSizeMeters: CELL_SIZE_METERS,
  intersectionCount:
    GRID_ROWS * GRID_COLUMNS,
};

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
      id: `tls_${String(index).padStart(4, "0")}`,

      row,
      column,

      // Simulation coordinates in meters
      x: column * CELL_SIZE_METERS,
      y: row * CELL_SIZE_METERS,

      // Traffic-light information
      current_phase: 0,
      phase_elapsed_time: 0,

      // Simulation observations
      queue_length: 0,
      waiting_time: 0,
      average_speed: 0,
      co2_emission: 0,
    });
  }
}