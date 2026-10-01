import sys
import os

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_DIR)

import ray
import torch

from ray.rllib.algorithms.dqn import DQNConfig
from environment.traffic_env import TrafficEnv


PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHECKPOINT_PATH = os.path.join(
    PROJECT_DIR,
    "training",
    "checkpoints"
)


ray.init(ignore_reinit_error=True)


config = (
    DQNConfig()
    .environment(
        env=TrafficEnv,
        env_config={}
    )
    .framework("torch")
    .env_runners(num_env_runners=0)
    .resources(num_gpus=0)
)


algo = config.build_algo()

# Restore the trained DQN checkpoint
algo.restore(CHECKPOINT_PATH)

print("DQN checkpoint restored successfully.")


env = TrafficEnv()

obs, info = env.reset()

total_reward = 0.0
steps = 0

keep_actions = 0
switch_actions = 0
phase_changes = 0

previous_phase = info.get("phase", None)


for _ in range(1000):

    obs_tensor = torch.tensor(
        obs,
        dtype=torch.float32
    ).unsqueeze(0)

    output = algo.get_module().forward_inference(
        {"obs": obs_tensor}
    )

    action = output["actions"].item()
    if action == 0:
        keep_actions += 1
    else:
        switch_actions += 1

    obs, reward, terminated, truncated, info = env.step(action)

    total_reward += reward
    steps += 1

    current_phase = info.get("phase", None)

    if (
        previous_phase is not None
        and current_phase != previous_phase
    ):
        phase_changes += 1

    previous_phase = current_phase

    if terminated or truncated:
        break


print("\nDQN Evaluation completed.")
print("Steps:", steps)
print("Total reward:", total_reward)
print("Keep actions:", keep_actions)
print("Switch actions:", switch_actions)
print("Phase changes:", phase_changes)
print("Final info:", info)

env.close()
algo.stop()
ray.shutdown()