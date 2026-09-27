from traffic_env import TrafficEnv


def main():
    print("Creating TrafficEnv...")

    env = TrafficEnv()

    print("Action space:", env.action_space)
    print("Observation space:", env.observation_space)

    print("\nStarting environment...")
    observation, info = env.reset()

    print("Initial observation:", observation)
    print("Initial info:", info)

    print("\nTesting Action 0: Keep current phase")
    observation, reward, terminated, truncated, info = env.step(0)

    print("Observation:", observation)
    print("Reward:", reward)
    print("Info:", info)

    print("\nTesting Action 1: Switch phase")
    observation, reward, terminated, truncated, info = env.step(1)

    print("Observation:", observation)
    print("Reward:", reward)
    print("Info:", info)

    print("\nLocalized CO2:", info["localized_co2"])
    print("Waiting penalty:", info["waiting_penalty"])
    print("CO2 penalty:", info["co2_penalty"])
    print("Queue penalty:", info["queue_penalty"])

    env.close()

    print("\nWeek 2 RL environment test successful!")


if __name__ == "__main__":
    main()