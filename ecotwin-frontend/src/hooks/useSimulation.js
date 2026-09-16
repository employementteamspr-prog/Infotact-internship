import { useEffect, useState } from "react";

import { intersections as initialIntersections } from "../data/gridData";

import {
  connectSimulationSocket,
  disconnectSimulationSocket,
} from "../services/simulationService";


function createIntersectionData(trafficLights) {

  const trafficLightMap = new Map();

  trafficLights.forEach((trafficLight) => {
    trafficLightMap.set(
      trafficLight.id,
      trafficLight
    );
  });

  return initialIntersections.map((intersection) => {

    const index = Number(
      intersection.id.replace("tls_", "")
    );

    const sumoId = `J${index}`;

    const trafficLight =
      trafficLightMap.get(sumoId);

    if (!trafficLight) {
      return intersection;
    }

    return {
      ...intersection,

      current_phase:
        trafficLight.current_phase,

      phase_elapsed_time:
        trafficLight.phase_duration,

      queue_length:
        trafficLight.queue_length ?? 0,

      waiting_time:
        trafficLight.waiting_time ?? 0,

      average_speed:
        trafficLight.average_speed ?? 0,

      co2_emission:
        trafficLight.co2_emission ?? 0,
    };
  });
}


function useSimulation() {

  const [intersections, setIntersections] =
    useState(initialIntersections);

  const [vehicles, setVehicles] =
    useState([]);

  const [simulationTime, setSimulationTime] =
    useState(0);

  const [connectionStatus, setConnectionStatus] =
    useState("offline");

  const [
    simulationDataAvailable,
    setSimulationDataAvailable
  ] = useState(false);


  useEffect(() => {

    console.log(
      "Connecting to EcoTwin live simulation..."
    );

    setConnectionStatus("connecting");


    const handleMessage = (data) => {

      console.log(
        "Live simulation update:",
        data
      );


      const trafficLights =
        data.traffic_lights || [];


      const liveVehicles =
        data.vehicles || [];


      const updatedIntersections =
        createIntersectionData(
          trafficLights
        );


      setIntersections(
        updatedIntersections
      );


      // Replace the complete vehicle snapshot.
      // Vehicles that leave SUMO are automatically removed.
      setVehicles(liveVehicles);


      setSimulationTime(
        data.simulation_time || 0
      );


      setSimulationDataAvailable(true);

      setConnectionStatus("connected");
    };


    const handleError = (error) => {

      console.error(
        "EcoTwin simulation connection error:",
        error
      );

      setConnectionStatus("error");
    };


    const handleClose = () => {

      console.log(
        "EcoTwin simulation connection closed."
      );

      setConnectionStatus("offline");
    };


    const socket =
      connectSimulationSocket(
        handleMessage,
        handleError,
        handleClose
      );


    return () => {

      console.log(
        "Cleaning up EcoTwin WebSocket..."
      );

      disconnectSimulationSocket(socket);
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