// =============================================
// DynoRex X1 - Express Server + Socket.io
// Multi-Mode Autonomous Robotic System Backend
// =============================================

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const database = require('./database');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ----- ESP32-S3 Robot WebSocket Bridge -----
// Try to load 'ws' for robot connection; install with: npm install ws
let WebSocket;
try { WebSocket = require('ws'); } catch(e) { WebSocket = null; }

// =============================================
// ROBOT CONFIGURATION
// Change ESP32_IP to your robot's IP address
// (shown in Serial Monitor after WiFi connects)
// =============================================
const ESP32_IP   = process.env.ESP32_IP   || '192.168.255.25'; // <-- SET YOUR ROBOT IP HERE
const ESP32_PORT = process.env.ESP32_PORT || 80;

// =============================================
// ROBOT BRIDGE  (ESP32-S3 ←→ Node.js ←→ Web)
// =============================================
class RobotBridge {
    constructor() {
        this.ws            = null;
        this.connected     = false;
        this.reconnecting  = false;
        this.lastTelemetry = null;
        this.io            = null;   // set after io is created
    }

    setIO(ioInstance) { this.io = ioInstance; }

    connect() {
        if (!WebSocket) {
            console.warn('[Robot] ws library not found. Run: npm install ws');
            console.warn('[Robot] Running in mock-only mode.');
            return;
        }
        if (this.reconnecting) return;
        this.reconnecting = true;

        const url = `ws://${ESP32_IP}:${ESP32_PORT}/ws`;
        console.log(`[Robot] Connecting to ESP32 at ${url}`);

        try {
            this.ws = new WebSocket(url, { handshakeTimeout: 4000 });
        } catch(e) {
            console.warn('[Robot] WebSocket creation failed:', e.message);
            this._scheduleReconnect();
            return;
        }

        this.ws.on('open', () => {
            this.connected    = true;
            this.reconnecting = false;
            console.log('[Robot] ✅ Connected to ESP32-S3');
            if (this.io) this.io.emit('robotConnectionStatus', { connected: true });
        });

        this.ws.on('message', (raw) => {
            try {
                const data = JSON.parse(raw.toString());
                this.lastTelemetry = data;

                // Map ESP32 JSON fields → our standard mockState fields
                const mapped = this._mapTelemetry(data);

                // Merge into mockState so REST /api/data still works
                Object.assign(mockState, mapped);
                mockState.timestamp = new Date().toISOString();

                if (this.io) this.io.emit('sensorUpdate', mockState);

                // Persist to DB occasionally
                try { database.saveSensorData(mockState); } catch(_){}
            } catch(e) {
                // ignore parse errors
            }
        });

        this.ws.on('close', () => {
            this.connected    = false;
            console.warn('[Robot] ⚠️  Disconnected from ESP32-S3. Retrying...');
            if (this.io) this.io.emit('robotConnectionStatus', { connected: false });
            this._scheduleReconnect();
        });

        this.ws.on('error', (err) => {
            console.warn('[Robot] Connection error:', err.message);
            // 'close' event will fire after error → triggers reconnect
        });
    }

    _scheduleReconnect() {
        this.reconnecting = true;
        setTimeout(() => {
            this.reconnecting = false;
            this.connect();
        }, 5000);
    }

    /**
     * Send a JSON command to the ESP32.
     * The ESP32 accepts these keys:
     *   { cmd: 'forward'|'backward'|'left'|'right'|'stop' }
     *   { mode: 0-5 }
     *   { servo: 60|90|120 }
     *   { scan: true }
     */
    send(payload) {
        if (this.ws && this.connected && this.ws.readyState === WebSocket.OPEN) {
            try {
                this.ws.send(JSON.stringify(payload));
                return true;
            } catch(e) {
                console.warn('[Robot] Send failed:', e.message);
            }
        }
        return false; // Not connected – command absorbed by mockState only
    }

    isConnected() { return this.connected; }

    /**
     * Map ESP32 telemetry JSON keys → our internal mockState field names.
     * ESP32 sends:  mode, distance, humidity, temp, soil, ir_left, ir_right,
     *               scanL, scanF, scanR, servoAngle, apmCh1Us, apmCh2Us,
     *               apmAlive, uptime
     */
    _mapTelemetry(d) {
        const mapped = {};

        // Core sensor data
        if (d.temp      !== undefined) mapped.temperature    = d.temp;
        if (d.humidity  !== undefined) mapped.humidity       = d.humidity;
        if (d.soil      !== undefined) mapped.moisture       = d.soil;
        if (d.distance  !== undefined) mapped.ultrasonic_dist = d.distance;
        if (d.ir_left   !== undefined) mapped.ir_left        = d.ir_left  ? 1 : 0;
        if (d.ir_right  !== undefined) mapped.ir_right       = d.ir_right ? 1 : 0;

        // APM / GPS signals
        if (d.apmCh1Us  !== undefined) mapped.ch1_steering   = d.apmCh1Us;
        if (d.apmCh2Us  !== undefined) mapped.ch2_throttle   = d.apmCh2Us;
        if (d.apmAlive  !== undefined) mapped.apm_link       = d.apmAlive;

        // Scan results
        if (d.scanL     !== undefined) mapped.scan_left      = d.scanL;
        if (d.scanF     !== undefined) mapped.scan_front     = d.scanF;
        if (d.scanR     !== undefined) mapped.scan_right     = d.scanR;
        if (d.servoAngle!== undefined) mapped.servo_angle    = d.servoAngle;

        // Robot mode (0=Manual 1=Line 2=Hybrid 3=Follow 4=GPS 5=Avoid)
        if (d.mode !== undefined) {
            const modeMap = { 0:'Manual', 1:'Line', 2:'Hybrid', 3:'Follow', 4:'GPS', 5:'Avoid' };
            mapped.operating_mode = modeMap[d.mode] || 'Manual';
            mapped.robot_mode_id  = d.mode;
        }

        // Uptime
        if (d.uptime !== undefined) mapped.uptime = d.uptime;

        return mapped;
    }
}

const robotBridge = new RobotBridge();

// Helper: convert web command strings to ESP32 cmd format
const WEB_CMD_MAP = {
    'move_forward':  'forward',
    'move_backward': 'backward',
    'move_left':     'left',
    'move_right':    'right',
    'stop':          'stop',
    'forward':       'forward',
    'backward':      'backward',
    'left':          'left',
    'right':         'right',
};

// Operating mode name → ESP32 mode id map
const OP_MODE_ID_MAP = {
    'Manual': 0, 'Line': 1, 'Hybrid': 2,
    'Follow': 3, 'GPS':  4, 'Avoid':  5,
};

// Initialize database
database.initDatabase();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Wire the IO instance into the robot bridge
robotBridge.setIO(io);
// Start connecting to ESP32 (non-blocking)
robotBridge.connect();

// =============================================
// MIDDLEWARE
// =============================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'dynorex-x1-secret-2024-avishkar',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

app.use(express.static(path.join(__dirname, '..', 'frontend')));

// UX: Manifest serving
app.get('/manifest.json', (req, res) => res.sendFile(path.join(__dirname, '..', 'frontend', 'manifest.json')));

// =============================================
// AUTH MIDDLEWARE
// =============================================
function requireAuth(req, res, next) {
    if (req.session && req.session.userId) return next();
    if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Unauthorized. Please login.' });
    return res.redirect('/login.html');
}

// SECURITY: Rate Limiting Memory Map
const rateLimitMap = new Map();
function apiRateLimiter(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowMs = 15000; // 15 seconds
    const limit = 20; // 20 requests per window
    
    if(!rateLimitMap.has(ip)) {
        rateLimitMap.set(ip, { count: 1, firstRequest: now });
        return next();
    }
    
    const record = rateLimitMap.get(ip);
    if(now - record.firstRequest > windowMs) {
        record.count = 1;
        record.firstRequest = now;
        return next();
    }
    
    if (record.count >= limit) {
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
    record.count++;
    next();
}
app.use('/api/', apiRateLimiter);

function requireAdmin(req, res, next) {
    if (req.session && req.session.role === 'admin') return next();
    return res.status(403).json({ error: 'Forbidden. Admin access required.' });
}

// =============================================
// AUTH ROUTES & PASSWORD RESET
// =============================================
const authRoutes = require('./routes/auth');
app.use('/api', authRoutes);

// =============================================
// ROBOT STATE API
// =============================================
app.get('/api/robot', requireAuth, (req, res) => {
    try { res.json(database.getRobotState() || {}); }
    catch (err) { res.status(500).json({ error: 'Failed to get robot state' }); }
});

app.post('/api/robot/mode', requireAuth, (req, res) => {
    try {
        const { mode } = req.body;
        if (!['farmer', 'delivery', 'campus'].includes(mode)) return res.status(400).json({ error: 'Invalid mode' });
        database.updateRobotState({ active_mode: mode });
        database.addLog(req.session.userId, 'Mode Switch', 'system', `Switched to ${mode} mode`, mode);
        io.emit('modeChanged', { mode });
        io.emit('sensorUpdate', { ...mockState, active_mode: mode });
        mockState.active_mode = mode;
        res.json({ success: true, mode });
    } catch (err) { res.status(500).json({ error: 'Failed to switch mode' }); }
});

app.post('/api/robot/operating-mode', requireAuth, (req, res) => {
    try {
        const { operating_mode } = req.body;
        const validModes = ['Manual', 'Line', 'Hybrid', 'Avoid', 'Follow', 'GPS', 'AI'];
        if (!validModes.includes(operating_mode)) return res.status(400).json({ error: 'Invalid operating mode' });
        database.updateRobotState({ operating_mode });
        mockState.operating_mode = operating_mode;
        database.addLog(req.session.userId, 'Operating Mode', 'command', `Set operating mode: ${operating_mode}`, mockState.active_mode);

        // ── Forward operating mode to ESP32 ──
        const modeId = OP_MODE_ID_MAP[operating_mode];
        if (modeId !== undefined) {
            const sent = robotBridge.send({ mode: modeId });
            console.log(`[Robot→ESP32] mode: ${modeId} (${operating_mode}), robot_connected: ${sent}`);
        }

        io.emit('sensorUpdate', mockState);
        res.json({ success: true, operating_mode, robot_connected: robotBridge.isConnected() });
    } catch (err) { res.status(500).json({ error: 'Failed to set operating mode' }); }
});

// =============================================
// COMMAND API
// =============================================
app.post('/api/command', requireAuth, (req, res) => {
    try {
        const { command, params } = req.body;

        // ── Real Robot: forward D-pad / stop commands directly to ESP32 ──
        const espCmd = WEB_CMD_MAP[command];
        if (espCmd) {
            const sent = robotBridge.send({ cmd: espCmd });
            if (sent) {
                console.log(`[Robot→ESP32] cmd: ${espCmd}`);
            }
            // Also update local speed state for UI feedback
            if (command === 'move_forward')  mockState.speed = 80;
            else if (command === 'move_backward') mockState.speed = -40;
            else if (command === 'move_left')     mockState.heading = (mockState.heading - 30 + 360) % 360;
            else if (command === 'move_right')    mockState.heading = (mockState.heading + 30) % 360;
            else if (command === 'stop')          { mockState.speed = 0; }
        } else {
            // Non-movement commands (patrol, irrigation, delivery, tour)
            if (command === 'start_patrol')   { mockState.operating_mode = 'Line'; mockState.speed = 50; robotBridge.send({ mode: 1 }); }
            else if (command === 'go_home')   { mockState.operating_mode = 'GPS';  mockState.location = 'Base'; mockState.robot_x = 50; mockState.robot_y = 90; robotBridge.send({ mode: 4 }); }
            else if (command === 'start_irrigation') { database.addLog(req.session.userId, 'Irrigation', 'event', 'Irrigation started', 'farmer'); }
            else if (command === 'start_delivery')   { mockState.operating_mode = 'GPS'; mockState.speed = 60; robotBridge.send({ mode: 4 }); }
            else if (command === 'start_tour')       { mockState.operating_mode = 'GPS'; mockState.speed = 40; robotBridge.send({ mode: 4 }); }
            else if (command === 'scan_now')         { robotBridge.send({ scan: true }); }
            else if (command === 'toggle_online')    { /* handled by frontend */ }
            else if (command === 'reset')            { /* hardware reset could be added here */ }
        }

        database.addLog(req.session.userId, command, 'command', `Command executed: ${command}`, mockState.active_mode);

        // Emit to all Socket.io clients
        io.emit('sensorUpdate', mockState);
        io.emit('commandExecuted', { command, timestamp: new Date().toISOString(), user: req.session.username });
        res.json({ success: true, message: `Command "${command}" executed`, robot_connected: robotBridge.isConnected() });
    } catch (err) {
        console.error('Command error:', err);
        res.status(500).json({ error: 'Command execution failed' });
    }
});

// =============================================
// SENSOR DATA API
// =============================================
app.get('/api/data', requireAuth, (req, res) => {
    try { res.json(mockState); }
    catch (err) { res.status(500).json({ error: 'Failed to get sensor data' }); }
});

app.get('/api/data/history', requireAuth, (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        res.json(database.getSensorHistory(limit));
    } catch (err) { res.status(500).json({ error: 'Failed to get history' }); }
});

// =============================================
// FARM SECTORS API
// =============================================
app.get('/api/farm/sectors', requireAuth, (req, res) => {
    try { res.json(database.getFarmSectors()); }
    catch (err) { res.status(500).json({ error: 'Failed to get farm sectors' }); }
});

app.put('/api/farm/sectors/:id', requireAuth, (req, res) => {
    try {
        database.updateFarmSector(req.params.id, req.body);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed to update sector' }); }
});

// =============================================
// DELIVERY API
// =============================================
app.get('/api/deliveries', requireAuth, (req, res) => {
    try {
        const status = req.query.status;
        res.json(status ? database.getDeliveriesByStatus(status) : database.getAllDeliveries());
    } catch (err) { res.status(500).json({ error: 'Failed to get deliveries' }); }
});

app.post('/api/deliveries', requireAuth, (req, res) => {
    try {
        const result = database.createDelivery(req.body);
        if (result.success) {
            database.addLog(req.session.userId, 'Delivery Created', 'event', `Order ${result.order_id} created`, 'delivery');
            io.emit('deliveryUpdate', { action: 'created', order_id: result.order_id });
            res.json(result);
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (err) { res.status(500).json({ error: 'Failed to create delivery' }); }
});

app.put('/api/deliveries/:id/status', requireAuth, (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'in_transit', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });
        
        database.updateDeliveryStatus(parseInt(req.params.id), status);
        const delivery = database.getDeliveryById(parseInt(req.params.id));
        database.addLog(req.session.userId, 'Delivery Update', 'event', `Order ${delivery?.order_id} → ${status}`, 'delivery');
        io.emit('deliveryUpdate', { action: 'status', id: req.params.id, status });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed to update delivery' }); }
});

app.delete('/api/deliveries/:id', requireAuth, (req, res) => {
    try {
        const result = database.deleteDelivery(parseInt(req.params.id));
        if (result.success) res.json({ success: true });
        else res.status(400).json({ error: result.error });
    } catch (err) { res.status(500).json({ error: 'Failed to delete delivery' }); }
});

// =============================================
// CAMPUS API
// =============================================
app.get('/api/campus/locations', requireAuth, (req, res) => {
    try { res.json(database.getCampusLocations()); }
    catch (err) { res.status(500).json({ error: 'Failed to get locations' }); }
});

app.get('/api/campus/tours', requireAuth, (req, res) => {
    try { res.json(database.getCampusTours()); }
    catch (err) { res.status(500).json({ error: 'Failed to get tours' }); }
});

app.post('/api/campus/tours', requireAuth, (req, res) => {
    try {
        const result = database.createCampusTour(req.body);
        if (result.success) {
            database.addLog(req.session.userId, 'Tour Created', 'event', `Tour "${req.body.tour_name}" created`, 'campus');
            io.emit('tourUpdate', { action: 'created', id: result.id });
            res.json(result);
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (err) { res.status(500).json({ error: 'Failed to create tour' }); }
});

app.put('/api/campus/tours/:id/status', requireAuth, (req, res) => {
    try {
        const { status, current_stop } = req.body;
        database.updateTourStatus(parseInt(req.params.id), status, current_stop);
        io.emit('tourUpdate', { action: 'status', id: req.params.id, status });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed to update tour' }); }
});

// =============================================
// GPS WAYPOINTS API
// =============================================
app.get('/api/waypoints', requireAuth, (req, res) => {
    try { res.json(database.getWaypoints(req.query.mode)); }
    catch (err) { res.status(500).json({ error: 'Failed to get waypoints' }); }
});

// =============================================
// USER MANAGEMENT API (Admin)
// =============================================
app.get('/api/users', requireAuth, requireAdmin, (req, res) => {
    try { res.json(database.getAllUsers()); }
    catch (err) { res.status(500).json({ error: 'Failed to get users' }); }
});

app.get('/api/users/:id', requireAuth, requireAdmin, (req, res) => {
    try {
        const user = database.findUserById(parseInt(req.params.id));
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) { res.status(500).json({ error: 'Failed to get user' }); }
});

app.post('/api/users', requireAuth, requireAdmin, (req, res) => {
    try {
        const { username, password, role, full_name, email } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
        const result = database.createUser(username, password, role || 'user', full_name || '', email || '');
        if (result.success) {
            database.addLog(req.session.userId, 'User Created', 'system', `Admin created: ${username}`, 'general');
            res.json({ success: true, id: result.id });
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (err) { res.status(500).json({ error: 'Failed to create user' }); }
});

app.put('/api/users/:id', requireAuth, requireAdmin, (req, res) => {
    try {
        const result = database.updateUser(parseInt(req.params.id), req.body);
        if (result.success) res.json({ success: true });
        else res.status(400).json({ error: result.error });
    } catch (err) { res.status(500).json({ error: 'Failed to update user' }); }
});

app.delete('/api/users/:id', requireAuth, requireAdmin, (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        if (userId === req.session.userId) return res.status(400).json({ error: 'Cannot delete your own account' });
        const result = database.deleteUser(userId);
        if (result.success) res.json({ success: true });
        else res.status(400).json({ error: result.error });
    } catch (err) { res.status(500).json({ error: 'Failed to delete user' }); }
});

app.post('/api/users/:id/reset-password', requireAuth, requireAdmin, (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters' });
        const result = database.updatePassword(parseInt(req.params.id), newPassword);
        if (result.success) res.json({ success: true });
        else res.status(500).json({ error: 'Failed to reset password' });
    } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// =============================================
// LOGS API
// =============================================
app.get('/api/logs', requireAuth, (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const mode = req.query.mode;
        res.json(mode ? database.getLogsByMode(mode, limit) : database.getLogs(limit));
    } catch (err) { res.status(500).json({ error: 'Failed to get logs' }); }
});

// =============================================
// AI API ROUTE
// =============================================
app.post('/api/ai-chat', requireAuth, async (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
            return res.status(400).json({ error: 'Missing Gemini API Key in .env file.' });
        }
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        // Ensure the input exists
        const promptText = req.body.prompt || "Hello RexAI";

        // Enhanced System Instructions (The "Training" for RexAI)
        const systemInstruction = `You are RexAI, the advanced intelligence system controlling the DynoRex X1 Autonomous Robotic Platform. 
        Detailed Project Context:
        - The DynoRex X1 is a professional multi-mode autonomous robot based on the ESP32-S3 and APM 2.8.
        - Modes: Farmer Mode (Patrol/Irrigation), Delivery Mode (Logistics/Orders), and Campus Guide (Tours).
        - Technical Stack: HTML/JS frontend, Node.js/Express backend, Socket.io for real-time telemetry, SQLite for data logging.
        - Capabilities: Manual remote control, Line Following, Object Avoidance, GPS Navigation (Simulated), and AI Voice Control.
        - Your Personality: Professional, technical, yet helpful.
        - Language Logic: Respond in the EXACT SAME language that the user uses (e.g., if asked in Hindi, respond in Hindi; if in Marathi, respond in Marathi, etc.). Ensure fluency and proper grammar in any language.
        - Goal: Assist the pilot in monitoring the robot's health (battery, temperature, location) and executing operational tasks.`;

        const result = await model.generateContent(systemInstruction + "\n\nUser Query: " + promptText);
        res.json({ answer: result.response.text() });
    } catch (err) {
        console.error('AI Error:', err);
        // Handle Quota Limit Specifically
        if (err.status === 429) {
            return res.status(429).json({ answer: "RexAI Quota Limit: I've had too many conversations today! Please wait a moment or try again later. Manual controls remain fully active." });
        }
        res.status(500).json({ error: 'Failed to process AI chat. Please check your internet or API usage.' });
    }
});

// =============================================
// PAGE ROUTES
// =============================================
app.get('/login.html', (req, res) => {
    if (req.session && req.session.userId) return res.redirect(req.session.role === 'admin' ? '/admin-portal.html' : '/dashboard.html');
    res.sendFile(path.join(__dirname, '..', 'frontend', 'login.html'));
});

app.get('/', (req, res) => {
    if (req.session && req.session.userId) return res.redirect(req.session.role === 'admin' ? '/admin-portal.html' : '/dashboard.html');
    res.redirect('/login.html');
});

app.get('/dashboard.html', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'dashboard.html'));
});

app.get('/admin-portal.html', requireAuth, requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'admin-portal.html'));
});

app.get('/user-management.html', requireAuth, requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'user-management.html'));
});

// =============================================
// SOCKET.IO - Real-time Updates
// =============================================
let mockState = {
    active_mode: 'farmer',
    operating_mode: 'Manual',
    temperature: 26, humidity: 62, moisture: 45,
    soil_ph: 6.8, wind_speed: 12, uv_index: 5,
    ultrasonic_dist: 999,
    ir_left: 0, ir_right: 0,
    battery: 100, speed: 0, heading: 0,
    gps_lat: 19.0760, gps_lng: 72.8777,
    robot_x: 25, robot_y: 25, location: 'A',
    ch1_steering: 1500, ch2_throttle: 1500,
    apm_link: false,
    sectors: { A: 'healthy', B: 'healthy', C: 'warning', D: 'healthy' },
    alerts: 0,
    timestamp: new Date().toISOString()
};

const sectorSequence = ['A', 'B', 'D', 'C'];
let sectorIndex = 0;
const POS_MAP = { 'A': { x: 25, y: 25 }, 'B': { x: 75, y: 25 }, 'C': { x: 25, y: 75 }, 'D': { x: 75, y: 75 }, 'Base': { x: 50, y: 90 } };

io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Send current state + robot connection status immediately
    socket.emit('sensorUpdate', mockState);
    socket.emit('robotConnectionStatus', { connected: robotBridge.isConnected() });

    // ─── Real-time Robot Drive Commands (from web dashboard) ─────────────────
    socket.on('robotCmd', (data) => {
        // data = { cmd: 'forward'|'backward'|'left'|'right'|'stop' }
        const sent = robotBridge.send(data);
        console.log(`📡 robotCmd: ${JSON.stringify(data)} → ESP32 ${sent ? '✅' : '(mock)'}`);

        // Update mock speed for UI even if robot not connected
        if (data.cmd === 'forward')  mockState.speed = 80;
        else if (data.cmd === 'backward') mockState.speed = -40;
        else if (data.cmd === 'stop')     mockState.speed = 0;
    });

    // ─── Operating Mode from Socket.io ───────────────────────────────────────
    socket.on('setOpMode', (data) => {
        // data = { mode_id: 0-5 }
        const sent = robotBridge.send({ mode: data.mode_id });
        const names = ['Manual','Line','Hybrid','Follow','GPS','Avoid'];
        mockState.operating_mode = names[data.mode_id] || 'Manual';
        console.log(`📡 setOpMode: ${mockState.operating_mode} → ESP32 ${sent ? '✅' : '(mock)'}`);
        io.emit('sensorUpdate', mockState);
    });

    // ─── Servo Control from Socket.io ────────────────────────────────────────
    socket.on('setServo', (data) => {
        // data = { angle: 60|90|120 }
        robotBridge.send({ servo: data.angle });
        mockState.servo_angle = data.angle;
    });

    // ─── Scan trigger ─────────────────────────────────────────────────────────
    socket.on('triggerScan', () => {
        robotBridge.send({ scan: true });
    });

    // ─── Legacy sendCommand (keeps existing code working) ────────────────────
    socket.on('sendCommand', (data) => {
        console.log(`📡 Command received: ${data.command}`);
        const espCmd = WEB_CMD_MAP[data.command];
        if (espCmd) robotBridge.send({ cmd: espCmd });
        if (data.command === 'start_irrigation') { mockState.moisture = Math.min(90, mockState.moisture + 30); }
        else if (data.command === 'start_patrol') { mockState.operating_mode = 'Line'; robotBridge.send({ mode: 1 }); }
        else if (data.command === 'go_home') { mockState.operating_mode = 'Manual'; mockState.location = 'Base'; mockState.robot_x = 50; mockState.robot_y = 90; robotBridge.send({ mode: 0 }); }
        else if (data.command === 'stop') { mockState.speed = 0; mockState.operating_mode = 'Manual'; }
        io.emit('sensorUpdate', mockState);
        io.emit('commandExecuted', { command: data.command, timestamp: new Date().toISOString() });
    });

    socket.on('switchMode', (data) => {
        if (['farmer', 'delivery', 'campus'].includes(data.mode)) {
            mockState.active_mode = data.mode;
            database.updateRobotState({ active_mode: data.mode });
            io.emit('modeChanged', { mode: data.mode });
            io.emit('sensorUpdate', mockState);
        }
    });

    socket.on('disconnect', () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
    });
});

// =============================================
// MOCK DATA SIMULATOR (Every 3 seconds)
// =============================================
// =============================================
// MOCK DATA SIMULATOR
// Only runs when ESP32 robot is NOT connected.
// When the robot IS connected, real telemetry
// arrives via the RobotBridge WebSocket and
// updates mockState automatically.
// =============================================
setInterval(() => {
    // Skip mock updates if robot is connected (real data is flowing)
    if (robotBridge.isConnected()) return;

    // Simulated sensor fluctuations (mock mode only)
    mockState.temperature    = parseFloat((mockState.temperature + (Math.random() - 0.5) * 1.5).toFixed(1));
    mockState.temperature    = Math.max(10, Math.min(45, mockState.temperature));
    mockState.moisture       = Math.max(5, Math.min(95, mockState.moisture + Math.floor((Math.random() - 0.52) * 3)));
    mockState.humidity       = Math.max(20, Math.min(90, mockState.humidity + Math.floor((Math.random() - 0.5) * 4)));
    mockState.wind_speed     = Math.max(0, Math.min(60, mockState.wind_speed + Math.floor((Math.random() - 0.5) * 5)));
    mockState.soil_ph        = parseFloat((mockState.soil_ph + (Math.random() - 0.5) * 0.1).toFixed(1));
    mockState.soil_ph        = Math.max(4, Math.min(9, mockState.soil_ph));
    mockState.uv_index       = Math.max(0, Math.min(11, mockState.uv_index + Math.floor((Math.random() - 0.5) * 2)));
    mockState.ultrasonic_dist = Math.max(5, Math.min(999, Math.floor(100 + Math.random() * 300)));
    mockState.ir_left        = Math.random() > 0.3 ? 1 : 0;
    mockState.ir_right       = Math.random() > 0.3 ? 1 : 0;

    // Battery drain simulation
    if (mockState.location === 'Base') {
        mockState.battery = Math.min(100, mockState.battery + 2);
    } else if (mockState.speed > 0) {
        mockState.battery = Math.max(5, mockState.battery - 0.3);
    }
    mockState.battery = parseFloat(mockState.battery.toFixed(0));

    // APM link simulation
    mockState.ch1_steering = 1500 + Math.floor((Math.random() - 0.5) * 100);
    mockState.ch2_throttle = 1500 + Math.floor((Math.random() - 0.5) * 100);
    mockState.apm_link     = Math.random() > 0.1;

    // GPS drift simulation
    mockState.gps_lat = parseFloat((mockState.gps_lat + (Math.random() - 0.5) * 0.0001).toFixed(6));
    mockState.gps_lng = parseFloat((mockState.gps_lng + (Math.random() - 0.5) * 0.0001).toFixed(6));

    // Auto-move when in auto modes
    if (['Line', 'Follow', 'GPS'].includes(mockState.operating_mode)) {
        sectorIndex = (sectorIndex + 1) % sectorSequence.length;
        mockState.location = sectorSequence[sectorIndex];
        mockState.robot_x  = POS_MAP[mockState.location].x;
        mockState.robot_y  = POS_MAP[mockState.location].y;
        mockState.speed    = 50;
    }

    mockState.timestamp = new Date().toISOString();
    io.emit('sensorUpdate', mockState);

    try { database.saveSensorData(mockState); } catch(e) { /* ignore */ }
}, 3000);

// =============================================
// START SERVER
// =============================================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║   🤖 DynoRex X1 – Autonomous Robot Server    ║');
    console.log('╠══════════════════════════════════════════════╣');
    console.log(`║   🌐 http://localhost:${PORT}                   ║`);
    console.log('║   📡 Socket.io: Active                       ║');
    console.log('║   🗄️  Database: SQLite (Connected)            ║');
    console.log('║   🕹️  ESP32-S3: Mock Mode (Commented)         ║');
    console.log('║   🧭 APM 2.8: Simulated                      ║');
    console.log('╠══════════════════════════════════════════════╣');
    console.log('║   🔑 Accounts:                               ║');
    console.log('║   👨‍💼 Admin  → admin / admin123             ║');
    console.log('║   👤 User   → user  / user123                ║');
    console.log('╠══════════════════════════════════════════════╣');
    console.log('║   🌾 Modes: Farmer | Delivery | Campus Guide ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log('');
});
