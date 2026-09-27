import os
import xml.etree.ElementTree as ET

import numpy as np
from traffic_env import TrafficEnv


def check(condition, message):
    if condition:
        print(f"[PASS] {message}")
    else:
        print(f"[FAIL] {message}")
        raise AssertionError(message)


def main():
    print("=" * 60)
    print("FINAL WEEK 2 RL ENVIRONMENT VALIDATION")
    print("=" * 60)

    # --------------------------------------------------
    # 1. Create environment
    # --------------------------------------------------
    env = TrafficEnv()

    check(
        env.action_space.n == 2,
        "Action space is Discrete(2)"
    )

    check(
        env.observation_space.shape == (6,),
        "Observation space contains 6 values"
    )

    # --------------------------------------------------
    # 2. Check reward weights
    # --------------------------------------------------
    check(
        env.waiting_weight == 0.5,
        "Waiting-time weight = 0.5"
    )

    check(
        env.co2_weight == 0.3,
        "CO2 weight = 0.3"
    )

    check(
        env.queue_weight == 0.2,
        "Queue-length weight = 0.2"
    )

    # --------------------------------------------------
    # 3. Check SUMO configuration
    # --------------------------------------------------
    check(
        os.path.exists(env.config_file),
        "SUMO configuration file exists"
    )

    tree = ET.parse(env.config_file)
    root = tree.getroot()

    timestep = root.find("./time/step-length")
    end_time = root.find("./time/end")
    seed = root.find("./random_number/seed")

    check(
        timestep is not None and timestep.get("value") == "1",
        "Simulation timestep = 1 second"
    )

    check(
        end_time is not None and end_time.get("value") == "3600",
        "Simulation duration = 3600 seconds"
    )

    check(
        seed is not None and seed.get("value") == "42",
        "Random seed = 42"
    )

    # --------------------------------------------------
    # 4. Reset environment
    # --------------------------------------------------
    print("\nStarting SUMO environment...")

    observation, info = env.reset()

    print("Initial observation:", observation)
    print("Initial info:", info)

    check(
        isinstance(observation, np.ndarray),
        "reset() returns a NumPy observation"
    )

    check(
        observation.shape == (6,),
        "Initial observation has exactly 6 values"
    )

    check(
        np.all(np.isfinite(observation)),
        "Initial observation contains valid finite values"
    )

    check(
        isinstance(info, dict),
        "reset() returns an info dictionary"
    )

    # --------------------------------------------------
    # 5. Test Action 0
    # --------------------------------------------------
    print("\nTesting Action 0: Keep current phase")

    observation_0, reward_0, terminated_0, truncated_0, info_0 = env.step(0)

    print("Observation:", observation_0)
    print("Reward:", reward_0)
    print("Info:", info_0)

    check(
        observation_0.shape == (6,),
        "Action 0 returns a 6-value observation"
    )

    check(
        np.isfinite(reward_0),
        "Action 0 returns a valid reward"
    )

    check(
        isinstance(info_0, dict),
        "Action 0 returns an info dictionary"
    )

    # --------------------------------------------------
    # 6. Test Action 1
    # --------------------------------------------------
    print("\nTesting Action 1: Switch traffic-light phase")

    phase_before = int(info_0["phase"])

    observation_1, reward_1, terminated_1, truncated_1, info_1 = env.step(1)

    print("Observation:", observation_1)
    print("Reward:", reward_1)
    print("Phase before action 1:", phase_before)
    print("Phase after action 1:", info_1["phase"])
    print("Localized CO2:", info_1["localized_co2"])
    print("Waiting penalty:", info_1["waiting_penalty"])
    print("CO2 penalty:", info_1["co2_penalty"])
    print("Queue penalty:", info_1["queue_penalty"])

    check(
        observation_1.shape == (6,),
        "Action 1 returns a 6-value observation"
    )

    check(
        np.isfinite(reward_1),
        "Action 1 returns a valid reward"
    )

    check(
        isinstance(info_1["localized_co2"], float),
        "Localized CO2 is returned"
    )

    check(
        info_1["localized_co2"] >= 0,
        "Localized CO2 is non-negative"
    )

    # J1 has multiple phases, so Action 1 should move
    # to the next phase.
    check(
        info_1["phase"] != phase_before,
        "Action 1 successfully changes the J1 phase"
    )

    # --------------------------------------------------
    # 7. Check reward components
    # --------------------------------------------------
    check(
        info_1["waiting_penalty"] >= 0,
        "Waiting-time penalty is non-negative"
    )

    check(
        info_1["co2_penalty"] >= 0,
        "CO2 penalty is non-negative"
    )

    check(
        info_1["queue_penalty"] >= 0,
        "Queue penalty is non-negative"
    )

    # --------------------------------------------------
    # 8. Check required metrics
    # --------------------------------------------------
    required_metrics = [
        "waiting_time",
        "localized_co2",
        "queue_length",
        "average_speed",
        "phase",
        "phase_elapsed",
        "throughput"
    ]

    for metric in required_metrics:
        check(
            metric in info_1,
            f"Metric '{metric}' is available"
        )

    # --------------------------------------------------
    # 9. Close environment
    # --------------------------------------------------
    env.close()

    print("\n[PASS] SUMO/TraCI environment closed successfully.")

    # --------------------------------------------------
    # Final result
    # --------------------------------------------------
    print("\n" + "=" * 60)
    print("ALL WEEK 2 MEMBER 1 VALIDATION CHECKS PASSED")
    print("=" * 60)
    print("TrafficEnv is ready for RL training.")


if __name__ == "__main__":
    main()