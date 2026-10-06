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


// ==================================================
// Mock Traffic Lights
// ==================================================

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

  // ==================================================
  // Intersection State
  // ==================================================

  const [
    intersections,
    setIntersections,
  ] = useState(
    initialIntersections
  );


  // ==================================================
  // Vehicle State
  // ==================================================

  const [
    vehicles,
    setVehicles,
  ] = useState([]);


  // ==================================================
  // Week 3 - Heatmap State
  // ==================================================

  const [
    heatmapData,
    setHeatmapData,
  ] = useState([]);


  // ==================================================
  // Simulation Time
  // ==================================================

  const [
    simulationTime,
    setSimulationTime,
  ] = useState(0);


  // ==================================================
  // Connection State
  // ==================================================

  const [
    connectionStatus,
    setConnectionStatus,
  ] = useState("offline");


  const [
    simulationDataAvailable,
    setSimulationDataAvailable,
  ] = useState(false);


  // ==================================================
  // Week 4 - Simulation Monitoring
  // ==================================================

  const [
    vehicleCount,
    setVehicleCount,
  ] = useState(0);


  const [
    lastUpdateTime,
    setLastUpdateTime,
  ] = useState(null);


  // ==================================================
  // RL State
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


  // ==================================================
  // Simulation Effect
  // ==================================================

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


        // ------------------------------------------
        // Mock Vehicles
        // ------------------------------------------

        const mockVehicles =
          createMockVehicles(
            mockTime
          );


        // ------------------------------------------
        // Mock Traffic Lights
        // ------------------------------------------

        const mockTrafficLights =
          createMockTrafficLights(
            mockTime
          );


        // ------------------------------------------
        // Vehicle State
        // ------------------------------------------

        setVehicles(
          mockVehicles
        );


        // ------------------------------------------
        // Week 4 - Vehicle Monitoring
        // ------------------------------------------

        setVehicleCount(
          mockVehicles.length
        );


        setLastUpdateTime(
          new Date()
        );


        // ------------------------------------------
        // Week 3 - Mock Heatmap
        // ------------------------------------------

        setHeatmapData(
          createHeatmapData(
            mockVehicles
          )
        );


        // ------------------------------------------
        // Intersection State
        // ------------------------------------------

        setIntersections(
          createIntersectionData(
            mockTrafficLights
          )
        );


        // ------------------------------------------
        // Simulation Time
        // ------------------------------------------

        setSimulationTime(
          mockTime
        );


        // ------------------------------------------
        // Mock RL Data
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

          // ==========================================
          // WebSocket Message Handler
          // ==========================================

          (data) => {

            


            // ------------------------------------------
            // Week 4 - Live Data Validation
            // ------------------------------------------

            if (
              !data ||
              typeof data !== "object"
            ) {

              console.warn(
                "Invalid simulation data received."
              );

              return;
            }


            // ------------------------------------------
            // Traffic Light Data
            // ------------------------------------------

            const trafficLights =
              Array.isArray(
                data.traffic_lights
              )
                ? data.traffic_lights
                : [];


            // ------------------------------------------
            // Vehicle Data
            // ------------------------------------------

            const liveVehicles =
              Array.isArray(
                data.vehicles
              )
                ? data.vehicles
                : [];


            // ------------------------------------------
            // Week 4 - Vehicle Count
            // ------------------------------------------

            setVehicleCount(
              liveVehicles.length
            );


            // ------------------------------------------
            // Intersection Data
            // ------------------------------------------

            const updatedIntersections =
              createIntersectionData(
                trafficLights
              );


            setIntersections(
              updatedIntersections
            );


            // ------------------------------------------
            // Live Vehicles
            // ------------------------------------------

            setVehicles(
              liveVehicles
            );


            // ------------------------------------------
            // Week 3 - Live Heatmap Data
            // ------------------------------------------

            const liveHeatmapData =
              createHeatmapData(
                liveVehicles
              );


            setHeatmapData(
              liveHeatmapData
            );


            // ------------------------------------------
            // Simulation Time
            // ------------------------------------------

            setSimulationTime(
              Number(
                data.simulation_time
              ) || 0
            );


            // ------------------------------------------
            // Real RL Data From FastAPI
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
            // Week 4 - Successful Update
            // ------------------------------------------

            setSimulationDataAvailable(
              true
            );

            setConnectionStatus(
              "connected"
            );

            setLastUpdateTime(
              new Date()
            );
          },


          // ==========================================
          // WebSocket Error Handler
          // ==========================================

          (error) => {

            console.error(
              "EcoTwin simulation connection error:",
              error
            );


            setConnectionStatus(
              "error"
            );
          },


          // ==========================================
          // WebSocket Close Handler
          // ==========================================

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


            // ------------------------------------------
            // Clear stale vehicle count
            // ------------------------------------------

            setVehicleCount(
              0
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


    // ==================================================
    // Start Connection
    // ==================================================

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


      if (mockTimer) {
        clearInterval(
          mockTimer
        );
      }


      disconnectSimulationSocket(
        socket
      );
    };

  }, []);


  // ==================================================
  // Return Simulation Data
  // ==================================================

  return {
    intersections,

    vehicles,

    // Week 3 heatmap data
    heatmapData,

    simulationTime,

    connectionStatus,

    simulationDataAvailable,

    // Week 4 monitoring data
    vehicleCount,

    lastUpdateTime,

    // RL information
    rl,
  };
}


export default useSimulation;