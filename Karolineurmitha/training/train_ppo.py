import os
import sys
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import ray
from ray.rllib.algorithms.ppo import PPOConfig
from environment.traffic_env import TrafficEnv


# Paths
PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHECKPOINT_DIR = os.path.join(PROJECT_DIR, "training", "checkpoints")
RESULTS_DIR = os.path.join(PROJECT_DIR, "training", "results")

os.makedirs(CHECKPOINT_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)


# Start Ray
ray.init(ignore_reinit_error=True)


# PPO configuration
config = (
    PPOConfig()
    .environment(env=TrafficEnv)
    .framework("torch")
    .env_runners(num_env_runners=0)
    .training(
        train_batch_size=200,
        minibatch_size=50,
        num_epochs=2,
    )
)


# Build PPO algorithm
algo = config.build_algo()

results = []


# Training
for i in range(10):
    result = algo.train()

    iteration = i + 1

    print(f"\nIteration {iteration}")
    print("Training completed.")

    # Save basic result information
    result_data = {
        "iteration": iteration,
        "timesteps_total": result.get("num_env_steps_sampled_lifetime"),
    }

    results.append(result_data)

    # Save checkpoint every 5 iterations
    if iteration % 5 == 0:
        checkpoint = algo.save(CHECKPOINT_DIR)
        print("Checkpoint saved:", checkpoint)


# Save training results
results_file = os.path.join(RESULTS_DIR, "ppo_results.json")

with open(results_file, "w") as f:
    json.dump(results, f, indent=4)

print("\nTraining results saved to:", results_file)

algo.stop()
ray.shutdown()

print("PPO training completed successfully.")