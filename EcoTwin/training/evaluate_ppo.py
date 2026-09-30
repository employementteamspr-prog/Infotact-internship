import os
import sys
import numpy as np
import torch
import ray

sys.path.insert(
    0,
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)

from ray.rllib.core.rl_module.rl_module import RLModule
from environment.traffic_env import TrafficEnv


# Paths
PROJECT_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

CHECKPOINT_PATH = os.path.join(
    PROJECT_DIR,
    "training",
    "checkpoints",
    "learner_group",
    "learner",
    "rl_module",
    "default_policy"
)


# Start Ray
ray.init(ignore_reinit_error=True)


# Load the trained PPO RLModule directly
module = RLModule.from_checkpoint(CHECKPOINT_PATH)

print("PPO model loaded successfully.")


# Create SUMO environment
env = TrafficEnv()

observation, info = env.reset()

total_reward = 0.0
steps_completed = 0


# Evaluation
for step in range(100):

    obs_tensor = torch.from_numpy(
        np.asarray(observation, dtype=np.float32)
    ).unsqueeze(0)

    output = module.forward_inference(
        {"obs": obs_tensor}
    )

    # Get the action from the RLModule output
    if "actions" in output:
        action = int(output["actions"][0].item())
    elif "action_dist_inputs" in output:
        action = int(
            torch.argmax(
                output["action_dist_inputs"],
                dim=-1
            ).item()
        )
    else:
        print("Available PPO output keys:", list(output.keys()))
        raise RuntimeError("Could not find an action in PPO output.")

    observation, reward, terminated, truncated, info = env.step(action)

    total_reward += reward
    steps_completed += 1

    if terminated or truncated:
        break


print("\nPPO Evaluation completed.")
print("Steps:", steps_completed)
print("Total reward:", total_reward)
print("Final info:", info)


env.close()
ray.shutdown()