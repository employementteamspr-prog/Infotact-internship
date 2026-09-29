import os
import ray
import torch

from ray.rllib.algorithms.dqn import DQNConfig
from environment.traffic_env import TrafficEnv


ray.init(ignore_reinit_error=True)


config = (
    DQNConfig()
    .environment(
        env=TrafficEnv,
        env_config={}
    )
    .framework("torch")
    .resources(num_gpus=0)
)


algo = config.build()


checkpoint_path = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "checkpoints")
)


algo.restore(checkpoint_path)


env = TrafficEnv()

obs, info = env.reset()

total_reward = 0.0
steps = 0


for _ in range(100):
    obs_tensor = torch.tensor(
        obs,
        dtype=torch.float32
    ).unsqueeze(0)

    output = algo.get_module().forward_inference(
        {"obs": obs_tensor}
    )

    action = output["actions"].item()

    obs, reward, terminated, truncated, info = env.step(action)

    total_reward += reward
    steps += 1

    if terminated or truncated:
        break


print("DQN Evaluation completed.")
print("Steps:", steps)
print("Total reward:", total_reward)
print("Final info:", info)

env.close()
algo.stop()
ray.shutdown()