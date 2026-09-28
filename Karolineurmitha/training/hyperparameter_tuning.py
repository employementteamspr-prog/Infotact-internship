import os
import sys
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import ray
from ray.rllib.algorithms.ppo import PPOConfig
from environment.traffic_env import TrafficEnv


PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RESULTS_DIR = os.path.join(PROJECT_DIR, "training", "results")

os.makedirs(RESULTS_DIR, exist_ok=True)


configs = [
    {
        "name": "baseline",
        "train_batch_size": 200,
        "minibatch_size": 50,
        "num_epochs": 2,
    },
    {
        "name": "tuned",
        "train_batch_size": 400,
        "minibatch_size": 100,
        "num_epochs": 4,
    },
]


ray.init(ignore_reinit_error=True)

results = []


for settings in configs:

    print("\n==============================")
    print("Testing:", settings["name"])
    print("==============================")

    config = (
        PPOConfig()
        .environment(env=TrafficEnv)
        .framework("torch")
        .env_runners(num_env_runners=0)
        .training(
            train_batch_size=settings["train_batch_size"],
            minibatch_size=settings["minibatch_size"],
            num_epochs=settings["num_epochs"],
        )
    )

    algo = config.build_algo()

    for iteration in range(3):
        result = algo.train()

        print(
            f"Iteration {iteration + 1} "
            f"| Timesteps: {result.get('num_env_steps_sampled_lifetime')}"
        )
        
    results.append({
    "name": settings["name"],
    "train_batch_size": settings["train_batch_size"],
    "minibatch_size": settings["minibatch_size"],
    "num_epochs": settings["num_epochs"],
    "timesteps": result.get("num_env_steps_sampled_lifetime"),
    "num_episodes": result.get("env_runners", {}).get("num_episodes"),
    "sampling_throughput": result.get("env_runners", {}).get(
        "num_env_steps_sampled_lifetime_throughput"
    ),
})

    algo.stop()


results_file = os.path.join(
    RESULTS_DIR,
    "hyperparameter_results.json"
)

with open(results_file, "w") as f:
    json.dump(results, f, indent=4)


ray.shutdown()

print("\nHyperparameter tuning completed.")
print("Results saved to:", results_file)