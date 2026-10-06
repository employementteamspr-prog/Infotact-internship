import os
import numpy as np
import torch
import ray

from ray.rllib.core.rl_module.rl_module import RLModule

from environment.traffic_env import TrafficEnv
from API.sumo_data import collect_vehicle_data


class RLTrafficService:
    """PPO-controlled SUMO traffic service."""

    def __init__(self):
        project_dir = os.path.dirname(
            os.path.dirname(os.path.abspath(__file__))
        )

        checkpoint_path = os.path.join(
            project_dir,
            "training",
            "checkpoints",
            "learner_group",
            "learner",
            "rl_module",
            "default_policy"
        )

        print("Loading PPO model...")

        ray.init(
            ignore_reinit_error=True,
            include_dashboard=False
        )

        self.module = RLModule.from_checkpoint(
            checkpoint_path
        )

        self.env = TrafficEnv()
        self.started = False
        self.total_reward = 0.0
        self.steps = 0

        print("PPO model loaded successfully.")

    def start(self):
        """Start the RL-controlled SUMO simulation."""

        if not self.started:
            observation, info = self.env.reset()

            self.observation = observation
            self.total_reward = 0.0
            self.steps = 0
            self.started = True

        return self._build_response(
            observation=self.observation,
            reward=0.0,
            info={}
        )

    def step(self):
        """Run one PPO-controlled SUMO simulation step."""

        if not self.started:
            self.start()

        obs_tensor = torch.from_numpy(
            np.asarray(
                self.observation,
                dtype=np.float32
            )
        ).unsqueeze(0)

        output = self.module.forward_inference(
            {"obs": obs_tensor}
        )

        if "actions" in output:
            action = int(
                output["actions"][0].item()
            )

        elif "action_dist_inputs" in output:
            action = int(
                torch.argmax(
                    output["action_dist_inputs"],
                    dim=-1
                ).item()
            )

        else:
            raise RuntimeError(
                "Could not find an action in PPO output."
            )

        (
            observation,
            reward,
            terminated,
            truncated,
            info
        ) = self.env.step(action)

        self.observation = observation
        self.total_reward += reward
        self.steps += 1

        response = self._build_response(
            observation=observation,
            reward=reward,
            info=info
        )

        response["action"] = action
        response["terminated"] = terminated
        response["truncated"] = truncated
        response["steps"] = self.steps
        response["total_reward"] = self.total_reward

        if terminated or truncated:
            self.started = False

        return response

    def _build_response(
        self,
        observation,
        reward,
        info
    ):
        """Build API/WebSocket response."""

        vehicles = collect_vehicle_data()

        return {
            "vehicles": vehicles,
            "metrics": {
                "queue_length": float(
                    observation[0]
                ),
                "waiting_time": float(
                    observation[1]
                ),
                "average_speed": float(
                    observation[2]
                ),
                "localized_co2": float(
                    observation[3]
                ),
                "phase": int(
                    observation[4]
                ),
                "phase_elapsed": float(
                    observation[5]
                ),
                "throughput": int(
                    info.get(
                        "throughput",
                        self.env.throughput
                    )
                )
            },
            "reward": float(reward)
        }

    def stop(self):
        """Stop SUMO and Ray."""

        if self.started:
            self.env.close()
            self.started = False

        try:
            ray.shutdown()
        except Exception:
            pass