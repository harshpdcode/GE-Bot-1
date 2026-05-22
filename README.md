# DynoRex X1

**The Dynamic Autonomous Robotic System with Hybrid Navigation and AI Interaction**

DynoRex X1 is a multi-mode autonomous robotic prototype built for real-time operation, sensor-driven navigation, and AI-assisted interaction. The system combines manual controls, line tracking, obstacle avoidance, GPS waypoint navigation, and voice-enabled AI command handling.

## Features

- Manual remote control via dashboard
- Line-following and hybrid obstacle-aware path tracking
- Obstacle avoidance mode
- Follow-me mode with sensor locking
- GPS waypoint navigation using APM 2.8
- AI voice interaction using Google Gemini integration
- Modular dashboard for live telemetry and mode switching

## Technologies

- Node.js + Express backend
- Socket.io / WebSockets for realtime updates
- SQLite via `better-sqlite3`
- Google Gemini AI integration
- ESP32-S3 and APM 2.8-based robotic hardware (real robot integration supported)

## Prerequisites

- Node.js installed
- `npm` available in your shell

## Installation

1. Open a terminal in the project folder.
2. Install dependencies:

```bash
npm install
```

3. Start the server:

```bash
npm start
```

4. Open the dashboard in your browser:

```text
http://localhost:3000
```

## Project Structure

- `backend/` — Express server, routes, realtime logic
- `frontend/` — Dashboard HTML, UI, and client-side logic
- `database/` — SQL schema and database assets
- `scripts/` — helper scripts
- `info.md` — project overview and integration notes

## Running the App

From the repo root:

```bash
npm start
```

Then visit:

```text
http://localhost:3000
```

## Notes

- The dashboard includes mock data by default for previewing the UI.
- To integrate with a physical ESP32-S3 robot, follow the instructions in `info.md` to enable real-time sensor streaming and command posting.

## Author

Harshpdcode

## GitHub Repository

https://github.com/harshpdcode/DynoRex-X1---The-Multilingual-Autonomous-Robotic-Ecosystem
