// ==================================================
// EcoTwin - Mock Live Simulation Hook
// ==================================================

import {
  useEffect,
  useState,
} from "react";

import {
  intersections as initialIntersections,
} from "../data/gridData";

// --------------------------------------------------
// Generate initial mock values
// --------------------------------------------------

function createMockIntersections() {
  return initialIntersections.map((intersection) => {

    const queueLength =
      Math.floor(Math.random() * 31) + 5;

    const waitingTime =
      Math.floor(Math.random() * 41) + 5;

    const averageSpeed =
      Number(
        (5 + Math.random() * 8).toFixed(2)
      );

    const co2Emission =
      Math.floor(
        queueLength * 2 +
        waitingTime +
        Math.random() * 30
      );

    return {
      ...intersection,

      queue_length:
        queueLength,

      waiting_time:
        waitingTime,

      average_speed:
        averageSpeed,

      co2_emission:
        co2Emission,

      current_phase:
        Math.random() > 0.5
          ? 0
          : 1,

      phase_elapsed_time:
        Math.floor(
          Math.random() * 20
        ),
    };
  });
}


// --------------------------------------------------
// Update mock simulation
// --------------------------------------------------

function updateSimulation(
  previousIntersections
) {
  return previousIntersections.map(
    (intersection) => {

      // --------------------------------------------
      // Queue
      // --------------------------------------------

      const queueChange =
        Math.floor(
          Math.random() * 11
        ) - 5;

      const queueLength = Math.max(
        0,
        Math.min(
          50,
          intersection.queue_length +
            queueChange
        )
      );


      // --------------------------------------------
      // Waiting time
      // --------------------------------------------

      const waitingChange =
        Math.floor(
          Math.random() * 9
        ) - 4;

      const waitingTime = Math.max(
        0,
        intersection.waiting_time +
          waitingChange
      );


      // --------------------------------------------
      // Average speed
      // --------------------------------------------

      const speedChange =
        Math.random() * 2 - 1;

      const averageSpeed = Math.max(
        2,
        Math.min(
          13.9,
          intersection.average_speed +
            speedChange
        )
      );


      // --------------------------------------------
      // CO₂
      // --------------------------------------------

      const co2Emission = Math.max(
        0,
        Math.round(
          queueLength * 2 +
          waitingTime +
          Math.random() * 25
        )
      );


      // --------------------------------------------
      // Traffic light phase
      // --------------------------------------------

      let currentPhase =
        intersection.current_phase;

      let phaseElapsedTime =
        intersection.phase_elapsed_time + 1;


      /*
        Switch traffic light phase after
        approximately 10–20 seconds.
      */

      if (
        phaseElapsedTime >= 10 &&
        Math.random() < 0.25
      ) {
        currentPhase =
          currentPhase === 0
            ? 1
            : 0;

        phaseElapsedTime = 0;
      }


      return {
        ...intersection,

        queue_length:
          queueLength,

        waiting_time:
          waitingTime,

        average_speed:
          Number(
            averageSpeed.toFixed(2)
          ),

        co2_emission:
          co2Emission,

        current_phase:
          currentPhase,

        phase_elapsed_time:
          phaseElapsedTime,
      };
    }
  );
}


// --------------------------------------------------
// Simulation Hook
// --------------------------------------------------

function useSimulation() {

  const [
    intersections,
    setIntersections,
  ] = useState(
    createMockIntersections()
  );


  const [
    connectionStatus,
    setConnectionStatus,
  ] = useState("offline");


  const [
    simulationDataAvailable,
    setSimulationDataAvailable,
  ] = useState(false);


  // ------------------------------------------------
  // Start mock simulation
  // ------------------------------------------------

  useEffect(() => {

    console.log(
      "EcoTwin mock simulation started."
    );

    setConnectionStatus(
      "connected"
    );

    setSimulationDataAvailable(
      true
    );


    // ----------------------------------------------
    // Update every second
    // ----------------------------------------------

    const interval =
      setInterval(() => {

        setIntersections(
          (previousData) =>
            updateSimulation(
              previousData
            )
        );

      }, 1000);


    // ----------------------------------------------
    // Cleanup
    // ----------------------------------------------

    return () => {

      clearInterval(
        interval
      );

    };

  }, []);


  return {
    intersections,

    connectionStatus,

    simulationDataAvailable,
  };
}


export default useSimulation;