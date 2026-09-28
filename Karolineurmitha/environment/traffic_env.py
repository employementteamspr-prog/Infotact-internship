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
        3 = Localized CO2 emission
        4 = Traffic-light phase
        5 = Phase elapsed time

    Reward:
        0.5 = Waiting time
        0.3 = Localized CO2 emission
        0.2 = Queue length

    Episode:
        1 hour = 3600 seconds
    """

    def __init__(self, config=None):
        super().__init__()

        # ---------------------------------
        # SUMO configuration
        # ---------------------------------
        project_dir = os.path.dirname(
            os.path.dirname(os.path.abspath(__file__))
        )

        self.config_file = os.path.join(
            project_dir,
            "sumo",
            "simulation.sumocfg"
        )

        self.sumo_binary = "sumo"
        self.tls_id = "n12"
        self.max_simulation_time = 3600

        self.co2_radius = 100.0
        self.tls_position = (200.0, 200.0)
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
        #  localized_co2,
        #  phase,
        #  phase_elapsed]
        self.observation_space = spaces.Box(
            low=0,
            high=np.inf,
            shape=(6,),
            dtype=np.float32
        )

        self.current_time = 0.0
        self.throughput = 0

        # ---------------------------------
        # Reward weights
        # ---------------------------------
        self.waiting_weight = 0.5
        self.co2_weight = 0.3
        self.queue_weight = 0.2

    def reset(self, seed=None, options=None):
        """
        Start a new SUMO episode.
        """

        super().reset(seed=seed)

        if traci.isLoaded():
            traci.close()

        self.current_time = 0.0
        self.throughput = 0

        traci.start([
            self.sumo_binary,
            "-c",
            self.config_file,
            "--seed",
            "42"
        ])

        # Advance one simulation step
        traci.simulationStep()

        self.current_time = traci.simulation.getTime()

        observation = self._get_observation()

        info = {
            "throughput": self.throughput,
            "localized_co2": float(observation[3])
        }

        return observation, info

    def step(self, action):
        """
        Apply an action, advance SUMO,
        collect observations and calculate reward.
        """

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
        # Advance SUMO
        # ---------------------------------
        traci.simulationStep()

        self.current_time = traci.simulation.getTime()

        # ---------------------------------
        # Update throughput
        # ---------------------------------
        self.throughput += traci.simulation.getArrivedNumber()

        # ---------------------------------
        # Get observation
        # ---------------------------------
        observation = self._get_observation()

        # ---------------------------------
        # Calculate reward
        # ---------------------------------
        reward, reward_components = self._calculate_reward(
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
        truncated = time_limit_reached

        # ---------------------------------
        # Information for evaluation
        # ---------------------------------
        info = {
            "waiting_time": float(observation[1]),
            "localized_co2": float(observation[3]),
            "queue_length": float(observation[0]),
            "average_speed": float(observation[2]),
            "phase": int(observation[4]),
            "phase_elapsed": float(observation[5]),
            "throughput": self.throughput,
            "waiting_penalty": reward_components["waiting_penalty"],
            "co2_penalty": reward_components["co2_penalty"],
            "queue_penalty": reward_components["queue_penalty"]
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
        queue_length = 0

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

            if speed < 0.1:
                queue_length += 1

        if vehicle_ids:
            average_speed = (
                total_speed / len(vehicle_ids)
            )
        else:
            average_speed = 0.0

        # ---------------------------------
        # Localized CO2
        # ---------------------------------
        localized_co2 = self._get_localized_co2()

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

        observation = np.array(
            [
                queue_length,
                total_waiting_time,
                average_speed,
                localized_co2,
                phase,
                phase_elapsed
            ],
            dtype=np.float32
        )

        return observation

    def _get_localized_co2(self):
        """
        Calculate CO2 emissions from vehicles
        within the specified radius of J1.
        """

        local_co2 = 0.0

        tls_x, tls_y = self.tls_position

        for vehicle_id in traci.vehicle.getIDList():

            x, y = traci.vehicle.getPosition(
                vehicle_id
            )

            distance = np.sqrt(
                (x - tls_x) ** 2
                + (y - tls_y) ** 2
            )

            if distance <= self.co2_radius:

                local_co2 += (
                    traci.vehicle.getCO2Emission(
                        vehicle_id
                    )
                )

        return local_co2

    def _calculate_reward(self, observation):
        """
        Calculate the Week 2 reward.

        The reward penalizes:
            - waiting time
            - localized CO2 buildup
            - queue length
        """

        queue_length = float(observation[0])
        waiting_time = float(observation[1])
        localized_co2 = float(observation[3])

        # ---------------------------------
        # Normalize metrics
        # ---------------------------------
        normalized_waiting = min(
            waiting_time / 1000.0,
            1.0
        )

        normalized_co2 = min(
            localized_co2 / 50000.0,
            1.0
        )

        normalized_queue = min(
            queue_length / 25.0,
            1.0
        )

        # ---------------------------------
        # Individual penalties
        # ---------------------------------
        waiting_penalty = (
            self.waiting_weight
            * normalized_waiting
        )

        co2_penalty = (
            self.co2_weight
            * normalized_co2
        )

        queue_penalty = (
            self.queue_weight
            * normalized_queue
        )

        # ---------------------------------
        # Final reward
        # ---------------------------------
        reward = -(
            waiting_penalty
            + co2_penalty
            + queue_penalty
        )

        reward_components = {
            "waiting_penalty": float(waiting_penalty),
            "co2_penalty": float(co2_penalty),
            "queue_penalty": float(queue_penalty)
        }

        return float(reward), reward_components

    def close(self):
        """
        Close the SUMO/TraCI connection.
        """

        if traci.isLoaded():
            traci.close()