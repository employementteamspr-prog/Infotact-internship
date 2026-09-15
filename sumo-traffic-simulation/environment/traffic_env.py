import os

import gymnasium as gym
import numpy as np
import traci
from gymnasium import spaces


class TrafficEnv(gym.Env):
    """
    SUMO-based traffic signal control environment.

    Actions:
        0 = Keep current traffic-light phase
        1 = Switch to the next traffic-light phase

    Observations:
        0 = Queue length
        1 = Total waiting time
        2 = Average speed
        3 = CO2 emission
        4 = Traffic-light phase
        5 = Phase elapsed time

    Reward:
        0.5 = Waiting time
        0.3 = CO2 emission
        0.2 = Queue length

    Episode:
        1 hour = 3600 seconds
    """

    def __init__(self):
        super().__init__()

        # ---------------------------------
        # SUMO configuration
        # ---------------------------------
        project_dir = os.path.dirname(
            os.path.dirname(os.path.abspath(__file__))
        )

        self.config_file = os.path.join(
            project_dir,
            "config",
            "city.sumocfg"
        )

        self.sumo_binary = "sumo"

        # J1 has multiple traffic-light phases.
        self.tls_id = "J1"

        # Simulation duration
        self.max_simulation_time = 3600

        # ---------------------------------
        # Action space
        # ---------------------------------
        # 0 = Keep current phase
        # 1 = Switch phase
        self.action_space = spaces.Discrete(2)

        # ---------------------------------
        # Observation space
        # ---------------------------------
        # [queue_length,
        #  waiting_time,
        #  average_speed,
        #  co2_emission,
        #  phase,
        #  phase_elapsed]
        self.observation_space = spaces.Box(
            low=0,
            high=np.inf,
            shape=(6,),
            dtype=np.float32
        )

        self.current_time = 0.0

        # ---------------------------------
        # Throughput
        # ---------------------------------
        self.throughput = 0

        # ---------------------------------
        # Reward weights
        # ---------------------------------
        self.waiting_weight = 0.5
        self.co2_weight = 0.3
        self.queue_weight = 0.2

    def reset(self, seed=None, options=None):
        """
        Start a new SUMO episode and return
        the initial traffic observation.
        """

        super().reset(seed=seed)

        # Close an existing SUMO connection
        if traci.isLoaded():
            traci.close()

        # Reset episode variables
        self.current_time = 0.0
        self.throughput = 0

        # Start SUMO
        traci.start([
            self.sumo_binary,
            "-c",
            self.config_file,
            "--seed",
            "42"
        ])

        # Advance one second so that the initial
        # observation represents an actual state.
        traci.simulationStep()

        self.current_time = traci.simulation.getTime()

        observation = self._get_observation()

        info = {
            "throughput": self.throughput
        }

        return observation, info

    def step(self, action):
        """
        Apply an action, advance SUMO by one second,
        collect observations and calculate reward.
        """

        # Make sure action is an integer
        action = int(action)

        # ---------------------------------
        # Apply traffic-light action
        # ---------------------------------
        if action == 1:

            current_phase = traci.trafficlight.getPhase(
                self.tls_id
            )

            logics = traci.trafficlight.getAllProgramLogics(
                self.tls_id
            )

            current_logic = logics[0]

            number_of_phases = len(
                current_logic.getPhases()
            )

            next_phase = (
                current_phase + 1
            ) % number_of_phases

            traci.trafficlight.setPhase(
                self.tls_id,
                next_phase
            )

        # ---------------------------------
        # Advance SUMO by one second
        # ---------------------------------
        traci.simulationStep()

        self.current_time = traci.simulation.getTime()

        # ---------------------------------
        # Update throughput
        # ---------------------------------
        arrived_vehicles = traci.simulation.getArrivedNumber()

        self.throughput += arrived_vehicles

        # ---------------------------------
        # Get new observation
        # ---------------------------------
        observation = self._get_observation()

        # ---------------------------------
        # Calculate reward
        # ---------------------------------
        reward = self._calculate_reward(
            observation
        )

        # ---------------------------------
        # Episode termination
        # ---------------------------------
        simulation_finished = (
            traci.simulation.getMinExpectedNumber() == 0
        )

        time_limit_reached = (
            self.current_time >= self.max_simulation_time
        )

        terminated = simulation_finished

        # Reaching one hour is treated as
        # the environment time limit.
        truncated = time_limit_reached

        # ---------------------------------
        # Information returned to RL agent
        # ---------------------------------
        info = {
            "waiting_time": float(observation[1]),
            "co2_emission": float(observation[3]),
            "queue_length": float(observation[0]),
            "average_speed": float(observation[2]),
            "phase": int(observation[4]),
            "phase_elapsed": float(observation[5]),
            "throughput": self.throughput
        }

        return (
            observation,
            reward,
            terminated,
            truncated,
            info
        )

    def _get_observation(self):
        """
        Collect traffic information from SUMO.
        """

        vehicle_ids = traci.vehicle.getIDList()

        total_waiting_time = 0.0
        total_speed = 0.0
        total_co2 = 0.0
        queue_length = 0

        # ---------------------------------
        # Vehicle-level information
        # ---------------------------------
        for vehicle_id in vehicle_ids:

            speed = traci.vehicle.getSpeed(
                vehicle_id
            )

            total_waiting_time += (
                traci.vehicle.getAccumulatedWaitingTime(
                    vehicle_id
                )
            )

            total_speed += speed

            total_co2 += (
                traci.vehicle.getCO2Emission(
                    vehicle_id
                )
            )

            # Vehicle is queued if speed
            # is below 0.1 m/s.
            if speed < 0.1:
                queue_length += 1

        # ---------------------------------
        # Average speed
        # ---------------------------------
        if vehicle_ids:
            average_speed = (
                total_speed / len(vehicle_ids)
            )
        else:
            average_speed = 0.0

        # ---------------------------------
        # Traffic-light information
        # ---------------------------------
        phase = traci.trafficlight.getPhase(
            self.tls_id
        )

        phase_duration = (
            traci.trafficlight.getPhaseDuration(
                self.tls_id
            )
        )

        next_switch = (
            traci.trafficlight.getNextSwitch(
                self.tls_id
            )
        )

        phase_elapsed = (
            self.current_time
            - (next_switch - phase_duration)
        )

        # ---------------------------------
        # Create observation
        # ---------------------------------
        observation = np.array(
            [
                queue_length,
                total_waiting_time,
                average_speed,
                total_co2,
                phase,
                phase_elapsed
            ],
            dtype=np.float32
        )

        return observation

    def _calculate_reward(self, observation):
        """
        Calculate the weighted traffic-control reward.

        Lower waiting time, CO2 emission and
        queue length produce a better reward.
        """

        queue_length = float(observation[0])
        waiting_time = float(observation[1])
        co2_emission = float(observation[3])

        # ---------------------------------
        # Normalize metrics
        # ---------------------------------
        normalized_waiting = min(
            waiting_time / 1000.0,
            1.0
        )

        normalized_co2 = min(
            co2_emission / 100000.0,
            1.0
        )

        normalized_queue = min(
            queue_length / 25.0,
            1.0
        )

        # ---------------------------------
        # Weighted negative cost
        # ---------------------------------
        reward = -(
            self.waiting_weight * normalized_waiting
            + self.co2_weight * normalized_co2
            + self.queue_weight * normalized_queue
        )

        return float(reward)

    def close(self):
        """
        Close the SUMO/TraCI connection.
        """

        if traci.isLoaded():
            traci.close()