import os
import ray
import sys
import numpy as np
import torch

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ray.rllib.algorithms.ppo import PPOConfig

from environment.traffic_env import TrafficEnv

CHECKPOINT_PATH = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "checkpoints"
    )
)

config = (
    PPOConfig()
    .environment(
        env=TrafficEnv
    )
    .framework("torch")
)

ray.init(ignore_reinit_error=True)

algo = config.build_algo()

algo.restore(CHECKPOINT_PATH)

env = TrafficEnv()

observation, info = env.reset()

total_reward = 0.0
steps_completed = 0

for step in range(100):

    obs_tensor = torch.from_numpy(
        np.asarray(observation, dtype=np.float32)
    ).unsqueeze(0)

    output = algo.get_module().forward_inference(
        {"obs": obs_tensor}
    )

    action = int(
        torch.argmax(
            output["action_dist_inputs"],
            dim=-1
        ).item()
    )

    observation, reward, terminated, truncated, info = env.step(action)

    total_reward += reward
    steps_completed += 1

    if terminated or truncated:
        break

print("Evaluation completed.")
print("Steps:", steps_completed)
print("Total reward:", total_reward)
print("Final info:", info)

env.close()
algo.stop()
ray.shutdown()