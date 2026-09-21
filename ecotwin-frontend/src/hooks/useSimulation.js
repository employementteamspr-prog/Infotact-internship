import { useEffect, useState } from "react";

import {
  intersections as initialIntersections,
} from "../data/gridData";

import {
  connectSimulationSocket,
  disconnectSimulationSocket,
} from "../services/simulationService";


function createIntersectionData(
  trafficLights
) {
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
          trafficLight.current_phase ??
          0,

        phase_type:
          trafficLight.phase_type ??
          "unknown",

        phase_direction:
          trafficLight.phase_direction ??
          "unknown",

        phase_duration:
          trafficLight.phase_duration ??
          0,

        phase_elapsed_time:
          trafficLight.phase_elapsed_time ??
          0,

        queue_length:
          trafficLight.queue_length ??
          0,

        waiting_time:
          trafficLight.waiting_time ??
          0,

        average_speed:
          trafficLight.average_speed ??
          0,

        co2_emission:
          trafficLight.co2_emission ??
          0,
      };
    }
  );
}


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

  useEffect(() => {
    let socket = null;
    let reconnectTimer = null;
    let isCleaningUp = false;

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

            const trafficLights =
              Array.isArray(
                data.traffic_lights
              )
                ? data.traffic_lights
                : [];

            const liveVehicles =
              Array.isArray(
                data.vehicles
              )
                ? data.vehicles
                : [];

            const updatedIntersections =
              createIntersectionData(
                trafficLights
              );

            setIntersections(
              updatedIntersections
            );

            setVehicles(
              liveVehicles
            );

            setSimulationTime(
              Number(
                data.simulation_time
              ) || 0
            );

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

  return {
    intersections,
    vehicles,
    simulationTime,
    connectionStatus,
    simulationDataAvailable,
  };
}


export default useSimulation;