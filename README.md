# Project: EcoTwin — Reinforcement Learning for Urban Carbon Dispersal

## Project Overview

EcoTwin is a SUMO-based intelligent traffic management project that uses traffic simulation, real-time traffic data, and reinforcement learning to support adaptive traffic-signal control.

### Technologies

* Python
* SUMO
* TraCI
* Gymnasium
* Ray RLlib
* PyTorch
* FastAPI
* WebSocket
* React

## Project Architecture

```text
SUMO
  ↓
TraCI
  ↓
Traffic Environment
  ↓
FastAPI / WebSocket
  ↓
PPO / DQN
  ↓
Traffic Signal Action
  ↓
Traffic Metrics / Dashboard
```

## Week 1 — Traffic Demand & Routing

The project was initialized with the SUMO traffic network and traffic-demand generation.

Work included:

* SUMO road network configuration
* Traffic demand generation
* Vehicle routing
* Simulation configuration
* Traffic-flow verification

## Week 2 — Traffic Environment & Backend

The SUMO simulation was integrated with a Gymnasium traffic environment.

The environment provides observations including:

* Queue length
* Waiting time
* Average speed
* Localized CO₂ emissions
* Traffic-light phase
* Phase elapsed time

Traffic-signal actions:

* Keep the current phase
* Switch to the next phase

A reward function was implemented using:

* Waiting time
* CO₂ emissions
* Queue length

The backend also includes FastAPI and WebSocket components for traffic-data communication.

## Week 3 — Reinforcement Learning & Traffic/Data Backend

The reinforcement-learning pipeline was implemented using Ray RLlib and PyTorch.

### Implemented

* PPO training
* DQN training
* PPO hyperparameter tuning
* PPO checkpoint evaluation
* DQN checkpoint evaluation
* Traffic metrics collection
* DQN action tracking
* Traffic-light phase-change tracking

### Training Files

```text
EcoTwin/training/
├── train_ppo.py
├── train_dqn.py
├── hyperparameter_tuning.py
├── evaluate_ppo.py
└── evaluate_dqn.py
```

### Training Results

```text
EcoTwin/training/results/
├── ppo_results.json
├── dqn_results.json
└── hyperparameter_results.json
```

## DQN Evaluation

The trained DQN checkpoint was successfully restored and evaluated for 1,000 simulation steps.

Observed evaluation output included:

* Keep actions: 667
* Switch actions: 333
* Traffic-light phase changes: 436
* Throughput: 162 vehicles
* Average speed: 13.44 m/s

These results verify that the trained DQN model can generate traffic-signal control actions through the SUMO/TraCI environment.

## Project Structure

```text
Infotact-internship/
├── EcoTwin/
│   ├── API/
│   ├── environment/
│   ├── sumo/
│   ├── traffic/
│   ├── training/
│   └── Websocket/
├── README.md
└── .gitignore
```

