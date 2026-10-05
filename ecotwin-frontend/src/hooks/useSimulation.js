import { useEffect, useState } from "react";

import {
  intersections as initialIntersections,
} from "../data/gridData";

import {
  connectSimulationSocket,
  disconnectSimulationSocket,
  getSimulationMode,
} from "../services/simulationService";


// ==================================================
// Mock Simulation
// ==================================================

function createMockVehicles(time) {
  const vehicleCount = 5;

  return Array.from(
    { length: vehicleCount },
    (_, index) => {
      const x =
        40 +
        ((time * (5 + index) + index * 70) % 320);

      const y =
        index % 2 === 0
          ? 0
          : 100 + index * 50;

      const speed =
        4 + ((index + time) % 10);

      return {
        vehicle_id: `mock_${String(index).padStart(4, "0")}`,
        x: Number(x.toFixed(2)),
        y: Number(y.toFixed(2)),
        speed: Number(speed.toFixed(2)),
        type: "car",
        co2: Number((speed * 120).toFixed(2)),
      };
    }
  );
}


function createMockTrafficLights(time) {
  return initialIntersections.map(
    (intersection, index) => ({
      id: `J${index}`,

      current_phase:
        Math.floor(time / 30) % 2,

      phase_type:
        Math.floor(time / 30) % 2 === 0
          ? "green_ns"
          : "green_ew",

      phase_direction:
        Math.floor(time / 30) % 2 === 0
          ? "north-south"
          : "east-west",

      phase_duration: 30,

      phase_elapsed_time:
        time % 30,

      queue_length:
        index % 4,

      waiting_time:
        (index % 5) * 2,

      average_speed:
        6 + (index % 5),

      co2_emission:
        20 + (index % 6) * 10,
    })
  );
}


// ==================================================
// Heatmap Data
// ==================================================

function createHeatmapData(vehicles) {
  if (!Array.isArray(vehicles)) {
    return [];
  }

  return vehicles
    .filter(
      (vehicle) =>
        vehicle &&
        Number.isFinite(Number(vehicle.x)) &&
        Number.isFinite(Number(vehicle.y)) &&
        Number.isFinite(Number(vehicle.co2))
    )
    .map((vehicle) => ({
      vehicle_id:
        vehicle.vehicle_id ??
        vehicle.id ??
        "unknown",

      x: Number(vehicle.x),

      y: Number(vehicle.y),

      co2: Number(vehicle.co2),
    }));
}


// ==================================================
// Intersection Mapping
// ==================================================

function createIntersectionData(trafficLights) {
  const trafficLightMap = new Map();

  trafficLights.forEach(
    (trafficLight) => {
      trafficLightMap.set(
        trafficLight.id,
        trafficLight
      );
    }
  );

  return initialIntersections.map(
    (intersection) => {

      const index = Number(
        intersection.id.replace(
          "tls_",
          ""
        )
      );

      const sumoId = `J${index}`;

      const trafficLight =
        trafficLightMap.get(
          sumoId
        );

      if (!trafficLight) {
        return intersection;
      }

      return {
        ...intersection,

        current_phase:
          trafficLight.current_phase ?? 0,

        phase_type:
          trafficLight.phase_type ??
          "unknown",

        phase_direction:
          trafficLight.phase_direction ??
          "unknown",

        phase_duration:
          trafficLight.phase_duration ?? 0,

        phase_elapsed_time:
          trafficLight.phase_elapsed_time ?? 0,

        queue_length:
          trafficLight.queue_length ?? 0,

        waiting_time:
          trafficLight.waiting_time ?? 0,

        average_speed:
          trafficLight.average_speed ?? 0,

        co2_emission:
          trafficLight.co2_emission ?? 0,
      };
    }
  );
}


// ==================================================
// Hook
// ==================================================

function useSimulation() {

  const [
    intersections,
    setIntersections,
  ] = useState(
    initialIntersections
  );


  const [
    vehicles,
    setVehicles,
  ] = useState([]);


  // ==================================================
  // WEEK 3 - HEATMAP DATA
  // ==================================================

  const [
    heatmapData,
    setHeatmapData,
  ] = useState([]);


  const [
    simulationTime,
    setSimulationTime,
  ] = useState(0);


  const [
    connectionStatus,
    setConnectionStatus,
  ] = useState("offline");


  const [
    simulationDataAvailable,
    setSimulationDataAvailable,
  ] = useState(false);


  // ==================================================
  // RL STATE
  // ==================================================

  const [
    rl,
    setRl,
  ] = useState({
    enabled: false,
    algorithm: "PPO",
    current_action: null,
    reward: 0,
    waiting_penalty: 0,
    co2_penalty: 0,
    queue_penalty: 0,
    status: "STANDBY",
    source: "environment",
  });


  useEffect(() => {

    const mode =
      getSimulationMode();

    let socket = null;
    let reconnectTimer = null;
    let mockTimer = null;
    let isCleaningUp = false;


    // ==================================================
    // MOCK MODE
    // ==================================================

    if (mode === "mock") {

      console.log(
        "EcoTwin running in MOCK mode."
      );

      setConnectionStatus(
        "connected"
      );

      setSimulationDataAvailable(
        true
      );

      let mockTime = 0;


      const updateMockSimulation = () => {

        if (isCleaningUp) {
          return;
        }


        const mockVehicles =
          createMockVehicles(
            mockTime
          );


        const mockTrafficLights =
          createMockTrafficLights(
            mockTime
          );


        setVehicles(
          mockVehicles
        );


        // ------------------------------------------
        // WEEK 3 - MOCK HEATMAP DATA
        // ------------------------------------------

        setHeatmapData(
          createHeatmapData(
            mockVehicles
          )
        );


        setIntersections(
          createIntersectionData(
            mockTrafficLights
          )
        );


        setSimulationTime(
          mockTime
        );


        // ------------------------------------------
        // Mock RL data
        // ------------------------------------------

        setRl({
          enabled: false,
          algorithm: "PPO",
          current_action: null,
          reward: 0,
          waiting_penalty: 0,
          co2_penalty: 0,
          queue_penalty: 0,
          status: "STANDBY",
          source: "mock",
        });


        mockTime += 1;
      };


      updateMockSimulation();


      mockTimer =
        setInterval(
          updateMockSimulation,
          1000
        );


      return () => {

        isCleaningUp = true;

        if (mockTimer) {
          clearInterval(
            mockTimer
          );
        }
      };
    }


    // ==================================================
    // REAL MODE
    // SUMO -> FastAPI -> WebSocket
    // ==================================================

    const connect = () => {

      if (isCleaningUp) {
        return;
      }


      console.log(
        "Connecting to EcoTwin live simulation..."
      );


      setConnectionStatus(
        "connecting"
      );


      socket =
        connectSimulationSocket(

          (data) => {

            console.log(
              "Live simulation update:",
              data
            );


            // ------------------------------------------
            // TRAFFIC LIGHT DATA
            // ------------------------------------------

            const trafficLights =
              Array.isArray(
                data.traffic_lights
              )
                ? data.traffic_lights
                : [];


            // ------------------------------------------
            // VEHICLE DATA
            // ------------------------------------------

            const liveVehicles =
              Array.isArray(
                data.vehicles
              )
                ? data.vehicles
                : [];


            // ------------------------------------------
            // INTERSECTION DATA
            // ------------------------------------------

            const updatedIntersections =
              createIntersectionData(
                trafficLights
              );


            setIntersections(
              updatedIntersections
            );


            // ------------------------------------------
            // LIVE VEHICLES
            // ------------------------------------------

            setVehicles(
              liveVehicles
            );


            // ------------------------------------------
            // WEEK 3 - LIVE HEATMAP DATA
            //
            // Uses the CURRENT WebSocket vehicle
            // data, so old vehicle positions are
            // automatically removed on every update.
            // ------------------------------------------

            const liveHeatmapData =
              createHeatmapData(
                liveVehicles
              );


            setHeatmapData(
              liveHeatmapData
            );


            // ------------------------------------------
            // SIMULATION TIME
            // ------------------------------------------

            setSimulationTime(
              Number(
                data.simulation_time
              ) || 0
            );


            // ------------------------------------------
            // REAL RL DATA FROM FASTAPI
            // ------------------------------------------

            if (
              data.normalized?.rl
            ) {

              setRl(
                data.normalized.rl
              );

            } else if (
              data.rl
            ) {

              setRl(
                data.rl
              );
            }


            // ------------------------------------------
            // CONNECTION STATUS
            // ------------------------------------------

            setSimulationDataAvailable(
              true
            );

            setConnectionStatus(
              "connected"
            );
          },


          (error) => {

            console.error(
              "EcoTwin simulation connection error:",
              error
            );


            setConnectionStatus(
              "error"
            );
          },


          () => {

            console.log(
              "EcoTwin simulation connection closed."
            );


            if (isCleaningUp) {
              return;
            }


            setConnectionStatus(
              "offline"
            );


            console.log(
              "Retrying EcoTwin WebSocket connection in 3 seconds..."
            );


            reconnectTimer =
              setTimeout(
                () => {
                  connect();
                },
                3000
              );
          }
        );
    };


    connect();


    // ==================================================
    // Cleanup
    // ==================================================

    return () => {

      console.log(
        "Cleaning up EcoTwin WebSocket..."
      );


      isCleaningUp = true;


      if (reconnectTimer) {
        clearTimeout(
          reconnectTimer
        );
      }


      disconnectSimulationSocket(
        socket
      );
    };

  }, []);


  // ==================================================
  // RETURN SIMULATION DATA
  // ==================================================

  return {
    intersections,

    vehicles,

    // Week 3 heatmap data
    heatmapData,

    simulationTime,

    connectionStatus,

    simulationDataAvailable,

    // RL information
    rl,
  };
}


export default useSimulation;