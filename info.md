# 🤖 DynoRex X1

**The Dynamic Autonomous Robotic System with Hybrid Navigation and AI Interaction**

## 📌 Project Overview

DynoRex X1 is a multi-mode autonomous robotic prototype designed to perform real-time operations using intelligent decision-making. The system integrates manual control, sensor-based automation, GPS navigation, and AI-based interaction.

It focuses on flexibility, adaptability, and scalability through a modular plug-and-play architecture, making it suitable for applications like surveillance, automation, and smart mobility systems.

---

## 🔬 ABSTRACT

DynoRex X1 is a multi-functional robotic system built using the **ESP32-S3-DevKitC-1 (ESP32-S3-N16R8)** and **APM 2.8 Flight Controller**. It supports multiple modes including manual control, line tracking, obstacle avoidance, follow-me, and GPS navigation. The system also integrates cloud-based AI using Google Gemini for voice interaction. Commands are processed via internet connectivity and responses are delivered through a Bluetooth-enabled amplifier. The system combines sensor fusion and modular design to enable scalable and intelligent robotic operations.

## 🛠️ COMPONENTS USED

- **ESP32-S3-DevKitC-1 (ESP32-S3-N16R8)** _(Main Processing Unit)_
- **ArduPilot Mega (APM) 2.8** _(Flight / Navigation Controller)_
- **ULBOX M7 GPS Module** _(Waypoint Tracking)_
- **L298N Motor Driver** _(Movement Control)_
- **300 RPM BO Motors**
- **IR Sensor Array** _(Line Following & Gap Detection)_
- **Ultrasonic Sensor (HC-SR04)** _(Obstacle Avoidance)_
- **Bluetooth-Enabled Amplifier** _(AI Audio Output)_
- **Li-ion Battery (3S2P with BMS)** _(Power Source)_
- **Buck Converter** _(Voltage Regulation)_

---

## ⚙️ MODES / WORKING

The dashboard enables real-time switching between 7 underlying autonomous modes:

1. **Manual Control Mode:** Override via the web D-Pad.
2. **Line Following Mode:** Uses the Left and Right IR array.
3. **Hybrid Mode (Line + Obstacle):** Combines IR routing with HC-SR04 object detection.
4. **Obstacle Avoidance Mode:** Full autonomous roaming safely.
5. **Follow-Me Mode:** Advanced sensor locking.
6. **GPS Waypoint Mode:** Powered by APM 2.8.
7. **AI Voice Interaction Mode:** Triggered via the Gemini Co-Pilot UI.

---

## 🚀 How to Run the System locally

### 1️⃣ Prerequisites

- **Node.js**
- **VS Code** (Optional)

### 2️⃣ Installation & Startup

1. Open terminal in the project folder.
2. Run `npm install` to setup all required modules.
3. Start the backend: `node backend/server.js`
4. Access interface at **[http://localhost:3000](http://localhost:3000)**

### 🔑 Test Credentials

- **Admin Account**: Username: `admin` | Password: `admin123`
- **User Account**: Username: `user` | Password: `user123`

---

## 🔗 HOW TO INTEGRATE WITH THE REAL ROBOT

Right now, the dashboard runs in a "Mock Data" phase which generates random but realistic numbers so you can preview the UI. To connect your **ESP32-S3** physically to the dashboard, follow these simple steps:

### 1. Activating Sensor Streams

Open `backend/server.js` and locate the block labeled:
`ESP32 REAL-TIME DATA (UNCOMMENT WHEN READY)`
Uncomment it. Ensure `ESP_IP` matches the IP address your ESP32 broadcasts (default: `192.168.4.1`). The server will automatically `fetch()` data from your ESP32 and send it to the dashboard.

### 2. Activating Command Button Sends

Open `frontend/dashboard.html` and look for the `sendCmd(cmd)` function.
You will see a block labeled:
`ESP32-S3 REAL ROBOT INTEGRATION CODE FOR COMMANDS`
Uncomment the `fetch()` command in that block. When you press "FWD", "LEFT", "STOP", or an Operating Mode button, it will immediately POST that string directly to your physical robot.

### What to program into your ESP32:

Ensure your ESP32 code hosts a web server at port `80`.

- **`GET /sensors`**: Should return a JSON block containing `{ temperature: 25, humidity: 50, ultrasonic_dist: 120, ir_left: 1, ir_right: 1, ... }`.
- **`POST /command`**: Should accept incoming command strings and write Logic HIGH/LOW to the L298N motor pins accordingly.

---

## 📊 DATA ANALYSIS & RESULTS

- Stable performance across all modes
- Fast response to sensor and AI inputs
- Smooth mode switching via the Web App
- Reliable GPS navigation
- Efficient real-time processing
- Modular system allows easy upgrades

DynoRex X1 successfully demonstrates integration of autonomous navigation, sensor intelligence, and AI-based interaction in a single platform. The ESP32-S3 ensures fast processing, while APM provides structured navigation. The modular design supports future expansion and application-specific customization.

## 🔭 CONCLUSION & FUTURE SCOPE

DynoRex X1 proves the feasibility of a scalable, multi-mode robotic system with integrated AI capabilities.
**Future Scope:**

- Edge AI implementation
- Vision-based navigation
- Mobile app integration
- Advanced AI interaction
- Modular attachment expansion
