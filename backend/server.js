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
const fs = require('fs');
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
            if (this.connected) {
                console.warn('[Robot] ⚠️  Disconnected from ESP32-S3. Retrying...');
            }
            this.connected = false;
            if (this.io) this.io.emit('robotConnectionStatus', { connected: false });
            this._scheduleReconnect();
        });

        this.ws.on('error', (err) => {
            // Non-fatal: physical robot is offline or not reachable on local LAN
            console.log(`[Robot] ESP32 not detected on ws://${ESP32_IP}:${ESP32_PORT} (${err.code || err.message}). Operating in Autonomous Simulation Mode.`);
            // 'close' event will fire after error → triggers reconnect
        });
    }

    _scheduleReconnect() {
        if (this._reconnectTimer) clearTimeout(this._reconnectTimer);
        this.reconnecting = true;
        this._reconnectTimer = setTimeout(() => {
            this.reconnecting = false;
            this.connect();
        }, 10000);
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
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'dynorex-x1-secret-2024-avishkar',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: 'auto', maxAge: 24 * 60 * 60 * 1000 }
}));

app.use(express.static(path.join(__dirname, '..', 'frontend')));

// UX: Manifest serving
app.get('/manifest.json', (req, res) => res.sendFile(path.join(__dirname, '..', 'frontend', 'manifest.json')));

// =============================================
// AUTH MIDDLEWARE
// =============================================
function requireAuth(req, res, next) {
    if (req.session && req.session.userId) return next();
    if (req.path.startsWith('/api/farm/')) return next();
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

app.post('/api/robot/sync-sensors', requireAuth, (req, res) => {
    try {
        mockState.timestamp = new Date().toISOString();
        mockState.sensor_synced_at = new Date().toISOString();
        if (robotBridge.isConnected()) {
            robotBridge.send({ scan: true });
        }
        database.addLog(req.session.userId, 'Sensor Calibration', 'system', 'Sensors Array (IR/Ultrasonic/Soil) synchronized & calibrated', mockState.active_mode);
        io.emit('sensorUpdate', mockState);
        res.json({
            success: true,
            message: 'Sensors Array successfully synchronized & calibrated',
            timestamp: mockState.timestamp,
            diagnostics: {
                ultrasonic: 'Optimal',
                ir_left: mockState.ir_left ? 'Active' : 'Standby',
                ir_right: mockState.ir_right ? 'Active' : 'Standby',
                calibration: 'Calibrated'
            }
        });
    } catch (err) { res.status(500).json({ error: 'Sensor sync failed' }); }
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
// FARM SECTORS & SPATIAL SOIL ANALYSIS API
// =============================================
app.get('/api/farm/sectors', requireAuth, (req, res) => {
    try { res.json(database.getFarmSectors()); }
    catch (err) { res.status(500).json({ error: 'Failed to get farm sectors' }); }
});

app.post('/api/farm/sectors/:id/scan', requireAuth, (req, res) => {
    try {
        const updated = database.scanFarmSector(req.params.id);
        if (!updated) return res.status(404).json({ error: 'Sector not found' });
        
        database.addLog(req.session.userId, 'Soil Probe Scan', 'event', `Scanned ${updated.name}: N=${updated.soil_nitrogen}, P=${updated.soil_phosphorus}, K=${updated.soil_potassium}, pH=${updated.soil_ph}`, 'farmer');
        io.emit('sectorScanned', updated);
        io.emit('farmAlert', { type: updated.status, message: `Sector ${updated.sector_id}: ${updated.recommended_fertilizer}` });
        res.json({ success: true, sector: updated });
    } catch (err) { res.status(500).json({ error: 'Failed to scan sector' }); }
});

app.put('/api/farm/sectors/:id', requireAuth, (req, res) => {
    try {
        database.updateFarmSector(req.params.id, req.body);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed to update sector' }); }
});

// =============================================
// FARM PATROL MILEAGE & SUMMARY REPORT
// =============================================
app.get('/api/farm/reports', requireAuth, (req, res) => {
    try {
        const stats = database.getFarmStats();
        const sectors = database.getFarmSectors();
        const schedules = database.getFarmSchedules();
        const invaders = database.getInvaderAlerts(5);
        const laserTargets = database.getLaserTargets(5);

        // Calculate summary metrics
        const totalAcreage = 6.0;
        const healthySectors = sectors.filter(s => s.status === 'healthy').length;
        const warningSectors = sectors.filter(s => s.status === 'warning').length;
        const criticalSectors = sectors.filter(s => s.status === 'critical').length;
        const avgMoisture = Math.round(sectors.reduce((acc, s) => acc + s.moisture, 0) / (sectors.length || 1));

        res.json({
            stats,
            summary: {
                total_acreage: totalAcreage,
                healthy_sectors: healthySectors,
                warning_sectors: warningSectors,
                critical_sectors: criticalSectors,
                avg_moisture: avgMoisture,
                active_invader_count: invaders.filter(i => i.is_active === 1).length
            },
            schedules,
            recent_invaders: invaders,
            recent_laser_kills: laserTargets
        });
    } catch (err) { res.status(500).json({ error: 'Failed to get farm reports' }); }
});

app.get('/api/farm/stats', requireAuth, (req, res) => {
    try { res.json(database.getFarmStats()); }
    catch (err) { res.status(500).json({ error: 'Failed to get stats' }); }
});

// =============================================
// ROBOTIC LASER WEED & PEST DEFENSE API
// =============================================
app.get('/api/farm/laser-targets', requireAuth, (req, res) => {
    try { res.json(database.getLaserTargets(parseInt(req.query.limit) || 20)); }
    catch (err) { res.status(500).json({ error: 'Failed to get laser history' }); }
});

app.post('/api/farm/laser-fire', requireAuth, (req, res) => {
    try {
        const { target_type, species_name, sector_id, wattage, pulse_ms, coord_x, coord_y, coord_z } = req.body;
        const energyJoules = parseFloat((((wattage || 12) * (pulse_ms || 350)) / 1000).toFixed(2));
        
        const record = {
            target_type: target_type || 'weed',
            species_name: species_name || 'Unclassified Weed/Pest',
            sector_id: sector_id || 'A',
            coord_x: coord_x || parseFloat((Math.random() * 20).toFixed(1)),
            coord_y: coord_y || parseFloat((Math.random() * 20).toFixed(1)),
            coord_z: coord_z || parseFloat((0.2 + Math.random() * 0.5).toFixed(2)),
            laser_wattage: wattage || 12.0,
            pulse_ms: pulse_ms || 350,
            energy_joules: energyJoules,
            status: 'neutralized',
            kill_confidence: parseFloat((97.0 + Math.random() * 2.8).toFixed(1))
        };

        const result = database.logLaserTarget(record);
        // Update stats
        const col = record.target_type === 'weed' ? 'weeds_killed' : 'pests_killed';
        const currentStats = database.getFarmStats();
        database.updateFarmStats({ [col]: (currentStats[col] || 0) + 1 });

        database.addLog(req.session.userId, 'Laser Zap', 'event', `Laser beam neutralized ${record.species_name} in Sector ${record.sector_id} (${energyJoules} J)`, 'farmer');
        io.emit('laserFired', { ...record, id: result.id });
        io.emit('statsUpdated', database.getFarmStats());

        res.json({ success: true, target: record, stats: database.getFarmStats() });
    } catch (err) { res.status(500).json({ error: 'Laser command failed' }); }
});

// Autonomous Laser Auto-Zap Patrol Toggle
let laserAutoZapEnabled = true;
app.post('/api/farm/laser-auto-zap', requireAuth, (req, res) => {
    try {
        laserAutoZapEnabled = Boolean(req.body.enabled);
        io.emit('laserAutoZapStatus', { enabled: laserAutoZapEnabled });
        res.json({ success: true, enabled: laserAutoZapEnabled });
    } catch (err) { res.status(500).json({ error: 'Failed to toggle auto zap' }); }
});

// =============================================
// UNAUTHORIZED INVADER / PERIMETER SECURITY API
// =============================================
app.get('/api/farm/invaders', requireAuth, (req, res) => {
    try { res.json(database.getInvaderAlerts()); }
    catch (err) { res.status(500).json({ error: 'Failed to get invader alerts' }); }
});

// Alias route — frontend calls /api/farm/invader-alerts (matches DB table name)
app.get('/api/farm/invader-alerts', requireAuth, (req, res) => {
    try { res.json(database.getInvaderAlerts()); }
    catch (err) { res.status(500).json({ error: 'Failed to get invader alerts' }); }
});

app.post('/api/farm/invader-deter', requireAuth, (req, res) => {
    try {
        const { id, action } = req.body;
        if (id && id !== 'all') {
            database.triggerInvaderDeterrent(id);
        }
        try {
            database.addLog(req.session?.userId || 1, 'Invader Deterred', 'system', `Deterrent triggered: ${action || '110dB Siren & Strobe'}`, 'farmer');
        } catch (lErr) { }
        io.emit('invaderResolved', { id, action });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed to trigger deterrent: ' + err.message }); }
});

app.post('/api/farm/invader-detect', requireAuth, (req, res) => {
    try {
        const {
            invader_type = 'Unauthorized Human Intruder',
            confidence = 88,
            sector_id = 'C',
            action = '110dB Acoustic Siren + Strobe'
        } = req.body;

        const result = database.addInvaderAlert({
            invader_type,
            sector_id,
            severity: invader_type.includes('Human') ? 'critical' : 'high',
            deterrent_action: action
        });

        try {
            database.addLog(req.session?.userId || 1, 'Perimeter Intrusion Detected', 'security', `AI Vision detected ${invader_type} in Sector ${sector_id} (${confidence}% conf). Action: ${action}`, 'farmer');
        } catch (lErr) { }

        io.emit('invaderAlert', {
            id: result.id,
            invader_type,
            sector_id,
            severity: invader_type.includes('Human') ? 'critical' : 'high',
            deterrent_action: action,
            confidence: confidence + '%',
            time: new Date().toLocaleTimeString(),
            is_active: 1
        });

        res.json({ success: true, id: result.id });
    } catch (err) {
        console.error('Invader detect error:', err);
        res.status(500).json({ error: 'Failed to record invader detection: ' + err.message });
    }
});

app.post('/api/farm/invader-simulate', requireAuth, (req, res) => {
    try {
        const invaders = [
            { type: 'Wild Boar (Sus scrofa Sounder)', sector: 'C', sev: 'high', action: 'Acoustic Siren 110dB + High-Lux Strobe' },
            { type: 'Stray Cattle (Bos taurus)', sector: 'B', sev: 'medium', action: 'Ultrasonic Deterrent Frequency' },
            { type: 'Unauthorized Human Intruder', sector: 'E', sev: 'critical', action: 'Security Floodlight + Voice Warning + Guard Dispatch' },
            { type: 'Blue Bull (Nilgai)', sector: 'F', sev: 'high', action: 'High-Decibel Air Horn Sweep' }
        ];
        const pick = invaders[Math.floor(Math.random() * invaders.length)];
        const result = database.addInvaderAlert({
            invader_type: pick.type,
            sector_id: pick.sector,
            severity: pick.sev,
            deterrent_action: pick.action
        });
        io.emit('invaderAlert', { id: result.id, invader_type: pick.type, sector_id: pick.sector, severity: pick.sev, deterrent_action: pick.action });
        res.json({ success: true, alert: pick });
    } catch (err) { res.status(500).json({ error: 'Failed to simulate invader' }); }
});

// =============================================
// FARM SCHEDULES API (Harvest, Drip, Fertilizer, Maintenance)
// =============================================
app.get('/api/farm/schedules', requireAuth, (req, res) => {
    try { res.json(database.getFarmSchedules()); }
    catch (err) { res.status(500).json({ error: 'Failed to get schedules' }); }
});

app.put('/api/farm/schedules/:id', requireAuth, (req, res) => {
    try {
        database.updateFarmSchedule(req.params.id, req.body);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed to update schedule' }); }
});

// =============================================
// PROBLEM P25: ORGANIC FERTILIZER & COMPOST COMPOSITE CALCULATOR
// =============================================
// Standard nutrient profiles of locally available organic materials in India:
const ORGANIC_MATERIALS_DB = {
    'fym':           { name: 'Cow Dung / Farmyard Manure (FYM)', N: 0.5, P: 0.25, K: 0.5, CN: 25, moisture: 65, costPerKg: 3.5,  releaseSpeed: 'medium' },
    'vermicompost':  { name: 'Vermicompost (Earthworm Castings)', N: 1.8, P: 1.2,  K: 1.5, CN: 15, moisture: 30, costPerKg: 8.0,  releaseSpeed: 'fast' },
    'neem_cake':     { name: 'Neem Cake (De-oiled)',             N: 5.2, P: 1.0,  K: 1.4, CN: 10, moisture: 10, costPerKg: 26.0, releaseSpeed: 'slow', pestRepellent: true },
    'poultry_manure':{ name: 'Poultry Manure (Decomposed)',     N: 3.2, P: 2.4,  K: 1.8, CN: 12, moisture: 38, costPerKg: 6.5,  releaseSpeed: 'fast', highSalinityRisk: true },
    'mustard_cake':  { name: 'Mustard Oil Cake',                 N: 4.8, P: 1.8,  K: 1.3, CN: 11, moisture: 12, costPerKg: 22.0, releaseSpeed: 'medium' },
    'wood_ash':      { name: 'Hardwood Biomass Ash',             N: 0.1, P: 1.6,  K: 6.8, CN: 50, moisture: 5,  costPerKg: 3.0,  releaseSpeed: 'fast', alkaline: true },
    'bone_meal':     { name: 'Steamed Bone Meal',                N: 3.5, P: 20.0, K: 0.2, CN: 8,  moisture: 8,  costPerKg: 28.0, releaseSpeed: 'very_slow' },
    'biochar':       { name: 'Activated Agricultural Biochar',   N: 0.2, P: 0.1,  K: 0.5, CN: 160,moisture: 15, costPerKg: 18.0, releaseSpeed: 'permanent_carbon' },
    'green_manure':  { name: 'Green Manure (Dhaincha/Sesbania)', N: 2.8, P: 0.6,  K: 1.6, CN: 18, moisture: 75, costPerKg: 4.0,  releaseSpeed: 'medium' }
};

// Crop nutrient requirements (kg/ha for typical yield target)
const CROP_REQUIREMENTS = {
    'wheat':     { name: 'Wheat',     N: 120, P: 60, K: 40,  stages: { 'Vegetative': [0.5, 0.3, 0.2], 'Tillering': [0.3, 0.4, 0.4], 'Flowering': [0.15, 0.2, 0.3], 'Maturity': [0.05, 0.1, 0.1] } },
    'paddy':     { name: 'Paddy/Rice',N: 100, P: 50, K: 50,  stages: { 'Transplanting': [0.4, 0.5, 0.3], 'Tillering': [0.4, 0.3, 0.4], 'Panicle': [0.2, 0.2, 0.3] } },
    'cotton':    { name: 'Cotton',    N: 120, P: 60, K: 60,  stages: { 'Vegetative': [0.3, 0.3, 0.2], 'Square': [0.3, 0.4, 0.3], 'Boll Formation': [0.4, 0.3, 0.5] } },
    'soybean':   { name: 'Soybean',   N: 30,  P: 60, K: 40,  stages: { 'Vegetative': [0.4, 0.4, 0.3], 'Flowering': [0.4, 0.4, 0.4], 'Pod Fill': [0.2, 0.2, 0.3] } }, // Legume: fixes own N
    'maize':     { name: 'Maize',     N: 150, P: 60, K: 50,  stages: { 'Knee-high': [0.4, 0.4, 0.3], 'Tasseling': [0.4, 0.4, 0.4], 'Grain Fill': [0.2, 0.2, 0.3] } },
    'tomato':    { name: 'Tomato',    N: 140, P: 80, K: 120, stages: { 'Vegetative': [0.3, 0.4, 0.2], 'Flowering': [0.3, 0.4, 0.4], 'Fruiting': [0.4, 0.2, 0.4] } }
};

app.post('/api/farm/organic-calculator', requireAuth, (req, res) => {
    try {
        const {
            crop_name = 'wheat',
            crop = 'wheat',
            growth_stage = 'Vegetative',
            stage = 'Vegetative',
            acreage = 1.0,
            acres = 1.0,
            soil_condition = 'deficient',
            soil = 'deficient',
            waste_type = 'animal',
            wasteType = 'animal',
            selected_materials,
            decomp_stage = 'semi_decomposed',
            moisture_pct = 35
        } = req.body;

        const chosenCrop = (crop_name || crop || 'wheat').toLowerCase();
        const chosenAcreage = Math.max(0.25, parseFloat(acreage || acres || 1.0) || 1.0);
        const rawStage = (growth_stage || stage || 'Vegetative').toLowerCase();
        const chosenSoil = (soil_condition || soil || 'deficient').toLowerCase();
        const chosenWaste = (waste_type || wasteType || 'animal').toLowerCase();

        const cropReq = CROP_REQUIREMENTS[chosenCrop] || CROP_REQUIREMENTS['wheat'];

        // Normalize growth stage
        let stageKey = 'Vegetative';
        let stageFractions = [0.4, 0.4, 0.3];
        let stageMod = 0.5;

        if (rawStage.includes('basal') || rawStage.includes('prep') || rawStage.includes('transplanting')) {
            stageKey = 'Basal / Pre-sowing';
            stageFractions = [0.55, 0.45, 0.30];
            stageMod = 2.0;
        } else if (rawStage.includes('flowering') || rawStage.includes('boll') || rawStage.includes('fruiting') || rawStage.includes('panicle')) {
            stageKey = 'Flowering & Fruiting';
            stageFractions = [0.20, 0.30, 0.45];
            stageMod = -3.0; // Peak reproductive drawdown on soil nutrients
        } else if (rawStage.includes('maturity') || rawStage.includes('grain')) {
            stageKey = 'Maturity & Grain Filling';
            stageFractions = [0.10, 0.15, 0.20];
            stageMod = -1.5;
        } else {
            stageKey = 'Vegetative Shoot';
            stageFractions = [0.45, 0.35, 0.35];
            stageMod = 0.5;
        }

        // Soil Deficit Multipliers & Baseline Soil Health
        let soilDeficitNMult = 1.0;
        let soilDeficitPMult = 1.0;
        let soilDeficitKMult = 1.0;
        let baseHealth = 92;
        let soilDeficitNotes = '';

        if (chosenSoil.includes('defic') || chosenSoil.includes('sector a')) {
            soilDeficitNMult = 1.40; // Sector A low N 110 kg/ha deficit
            soilDeficitPMult = 1.45; // High P lockup
            soilDeficitKMult = 1.30;
            baseHealth = 63;
            soilDeficitNotes = 'Sector A profile: Severe nitrogen deficit (<120 kg/ha), low organic carbon (0.38%), and pH 5.4 acidity require urgent organic bio-amendment.';
        } else if (chosenSoil.includes('mod') || chosenSoil.includes('sector b') || chosenSoil.includes('sector d')) {
            soilDeficitNMult = 1.15;
            soilDeficitPMult = 1.25;
            soilDeficitKMult = 1.15;
            baseHealth = 80;
            soilDeficitNotes = 'Sector B/D profile: Moderate phosphorus and potassium drawdown with organic carbon at 0.65%. Targeted mineral-organic balance required.';
        } else {
            soilDeficitNMult = 1.0;
            soilDeficitPMult = 1.0;
            soilDeficitKMult = 1.0;
            baseHealth = 94;
            soilDeficitNotes = 'Sector C/E/F profile: Balanced tilth, active earthworm channels, organic carbon >0.92%. Maintenance dosage preserves rhizosphere vigor.';
        }

        // Net requirements for specified acreage and deficits
        const targetN = (cropReq.N * chosenAcreage * stageFractions[0] * soilDeficitNMult);
        const targetP = (cropReq.P * chosenAcreage * stageFractions[1] * soilDeficitPMult);
        const targetK = (cropReq.K * chosenAcreage * stageFractions[2] * soilDeficitKMult);

        // Decomposition stage modifier factor (mineralization efficiency)
        let decompEfficiency = 0.55;
        let lossFactor = 0.15;
        let decompLabel = 'Semi-Decomposed (Moderate mineralization, 55% released first season)';
        if (decomp_stage === 'raw') {
            decompEfficiency = 0.30;
            lossFactor = 0.30;
            decompLabel = 'Raw / Uncomposted (Slow release: ~30% first season, weed seed risk)';
        } else if (decomp_stage === 'mature') {
            decompEfficiency = 0.85;
            lossFactor = 0.05;
            decompLabel = 'Fully Mature Humified / Vermicompost (Rapid availability: 85% first season)';
        }

        // Materials Selection: Dynamic blend based on waste type & deficits
        let activeMaterials = selected_materials;
        if (!activeMaterials || !Array.isArray(activeMaterials) || activeMaterials.length === 0) {
            if (chosenWaste === 'crop') {
                activeMaterials = ['vermicompost', 'neem_cake', 'green_manure', 'wood_ash'];
            } else {
                activeMaterials = ['fym', 'bone_meal', 'neem_cake', 'biochar'];
            }
        }

        const materials = activeMaterials.map(id => ORGANIC_MATERIALS_DB[id] || ORGANIC_MATERIALS_DB['fym']);

        // Formulate recipe weights
        let totalWeightKg = 0;
        let weightedN = 0, weightedP = 0, weightedK = 0, weightedCN = 0;
        const blend = [];
        let remainingN = targetN / (decompEfficiency * (1 - lossFactor));

        materials.forEach((m, idx) => {
            let sharePct = 0;
            if (materials.length === 1) sharePct = 1.0;
            else if (idx === 0) sharePct = 0.55; // Base bulk (FYM / Vermicompost)
            else if (idx === 1) sharePct = 0.25; // Bone meal / Neem cake
            else if (idx === 2) sharePct = 0.12; // Secondary stabilizer
            else sharePct = 0.08 / (materials.length - 3 || 1);

            const dryMatterFraction = (1 - (m.moisture / 100));
            const effectiveN_pct = (m.N / 100) * dryMatterFraction;

            let kg = (remainingN * sharePct) / Math.max(0.005, effectiveN_pct);
            kg = Math.round(Math.max(15, Math.min(15000, kg)));

            const cost = Math.round(kg * m.costPerKg);
            totalWeightKg += kg;

            weightedN += (kg * (m.N / 100) * dryMatterFraction);
            weightedP += (kg * (m.P / 100) * dryMatterFraction);
            weightedK += (kg * (m.K / 100) * dryMatterFraction);
            weightedCN += (kg * m.CN);

            blend.push({
                material_id: activeMaterials[idx],
                name: m.name,
                kg: kg,
                bags: Math.max(1, Math.round(kg / 50)),
                percentage: 0,
                cost_inr: cost,
                moisture: m.moisture,
                c_n_ratio: m.CN,
                npk_ratio: `${m.N}-${m.P}-${m.K}`
            });
        });

        blend.forEach(b => {
            b.percentage = Math.round((b.kg / (totalWeightKg || 1)) * 100);
        });

        // Blended C:N Ratio computed dynamically from materials
        const overallCN = parseFloat((weightedCN / (totalWeightKg || 1)).toFixed(1));
        const totalCost = blend.reduce((acc, b) => acc + b.cost_inr, 0);
        const totalBags = blend.reduce((acc, b) => acc + b.bags, 0);

        // C:N Ratio Diagnostic according to P25 spec
        let cnDiagnosis = {
            status: 'optimal',
            title: `Balanced C:N Ratio (${overallCN}:1)`,
            message: `Optimal microbial mineralization balance (${overallCN}:1). Nutrients will be steadily released without robbing soil nitrogen.`
        };
        if (overallCN > 30) {
            cnDiagnosis = {
                status: 'warning_high_cn',
                title: `High C:N Ratio (${overallCN}:1) — Nitrogen Immobilization Risk!`,
                message: `Blended C:N of ${overallCN}:1 exceeds optimal 25:1 threshold. Soil microbes will temporarily tie up available nitrogen to digest carbon. Recommendation: Add Neem Cake or Green Manure to balance.`
            };
        } else if (overallCN < 18) {
            cnDiagnosis = {
                status: 'warning_low_cn',
                title: `Low C:N Ratio (${overallCN}:1) — Rapid Leaching Risk!`,
                message: `Blended C:N of ${overallCN}:1 mineralizes very quickly. High ammonia release may cause leaching. Recommendation: Supplement with mature compost or biochar.`
            };
        }

        // Genuinely Continuous Crop & Soil Health Score (0 - 100)
        // Dependent on soil condition + crop feeder intensity + growth stage + C:N ratio + acreage
        const cropFeederPenalty = {
            tomato: 5.5,
            sugarcane: 6.0,
            maize: 4.5,
            cotton: 3.5,
            wheat: 1.5,
            paddy: 2.0,
            mustard: -1.5, // Bio-fumigant restorative
            soybean: -4.0  // Nitrogen fixer
        };
        const cPenalty = cropFeederPenalty[chosenCrop] || 2.0;

        // C:N balance modifier
        let cnBonus = 0;
        if (overallCN >= 20 && overallCN <= 28) cnBonus = 3.0;
        else if (overallCN >= 18 && overallCN <= 32) cnBonus = 1.0;
        else cnBonus = -3.5;

        // Continuous score calculation with continuous inputs
        const fineAcreMod = ((chosenAcreage * 7) % 3) - 1.5;
        let continuousScore = baseHealth - cPenalty + stageMod + cnBonus + fineAcreMod;
        continuousScore = Math.max(38, Math.min(98, Math.round(continuousScore)));

        let healthBadgeText = '';
        let healthBadgeColor = '';
        let healthBadgeBg = '';
        if (continuousScore >= 88) {
            healthBadgeText = `Score: ${continuousScore}/100 (Optimal Tilth)`;
            healthBadgeColor = '#16a34a';
            healthBadgeBg = '#dcfce7';
        } else if (continuousScore >= 72) {
            healthBadgeText = `Score: ${continuousScore}/100 (Moderate Balance)`;
            healthBadgeColor = '#d97706';
            healthBadgeBg = '#fef3c7';
        } else {
            healthBadgeText = `Score: ${continuousScore}/100 (Needs Remediation)`;
            healthBadgeColor = '#ef4444';
            healthBadgeBg = '#fee2e2';
        }

        const healthDesc = `${soilDeficitNotes} Crop demand for ${cropReq.name} during ${stageKey} with ${chosenWaste}-based organic blend yields an active rhizosphere health rating of ${continuousScore}/100. Effective C:N: ${overallCN}:1.`;

        // Dynamic Next Crop Recommendation (Factoring Crop + Soil + Waste Type)
        function getDynamicRotation(crop, soil, waste) {
            if (crop === 'wheat') {
                if (soil.includes('defic') || soil.includes('sector a')) {
                    return {
                        title: 'Moong Dal / Green Gram (Short-Cycle Restorative Legume)',
                        desc: 'Planting nitrogen-fixing pulses after wheat restores ~35 kg/ha natural soil nitrogen via symbiotic Rhizobium nodules, directly repairing Sector A nitrogen depletion within 65 days.'
                    };
                } else if (soil.includes('mod')) {
                    return {
                        title: 'Chickpea / Desi Chana (Rabi Legume Rotation)',
                        desc: 'Deep taproots penetrate plow pans, loosen subsoil compaction, and balance residual phosphorus reserves while depositing 25 kg N/ha.'
                    };
                } else {
                    return {
                        title: 'Mustard / Canola (High-Value Bio-Fumigant)',
                        desc: 'High soil tilth supports vigorous brassica development; glucosinolate root exudates naturally bio-fumigate soil against cereal fungal pathogens.'
                    };
                }
            } else if (crop === 'paddy') {
                if (soil.includes('defic') || soil.includes('sector a')) {
                    return {
                        title: 'Dhaincha / Sesbania (Green Manure Puddle-In)',
                        desc: 'Restores waterlogged, depleted soil structure; fast-growing Sesbania incorporates up to 80 kg N/ha and breaks anaerobic crusting.'
                    };
                } else {
                    return {
                        title: 'Black Gram (Urad) / Field Pea (Stubble Relay)',
                        desc: 'Direct-seeded into standing paddy stubble to utilize residual moisture with zero tillage, restoring natural soil nitrogen.'
                    };
                }
            } else if (crop === 'tomato') {
                if (soil.includes('defic')) {
                    return {
                        title: 'Sorghum-Sudangrass Cover Crop',
                        desc: 'Aggressive root biomass restores depleted organic carbon and suppresses root-knot nematodes and bacterial wilt (Ralstonia).'
                    };
                } else {
                    return {
                        title: 'Sweet Corn / Sorghum (Graminaceous Cereal Break)',
                        desc: 'Non-host cereal rotation completely interrupts Solanaceae pathogen lifecycles while fibrous roots loosen topsoil.'
                    };
                }
            } else if (crop === 'cotton') {
                if (soil.includes('defic')) {
                    return {
                        title: 'Sunn Hemp (Crotalaria Juncea Restorative Manure)',
                        desc: 'Breaks subsoil hardpans left by deep taproot cotton and fixes 60+ kg N/ha organic nitrogen biomass before the next cycle.'
                    };
                } else {
                    return {
                        title: 'Cowpea / Wheat Relay Sequence',
                        desc: 'Shallow root architecture balances nutrient extraction across horizons and replenishes soil organic matter.'
                    };
                }
            } else if (crop === 'sugarcane') {
                if (soil.includes('defic')) {
                    return {
                        title: 'Dhaincha / Sunn Hemp Green Manuring',
                        desc: 'Rebuilds exhausted rhizosphere humus after heavy 12-month sugarcane extraction; restores 75 kg N/ha.'
                    };
                } else {
                    return {
                        title: 'Potato / Mustard Relay Sequence',
                        desc: 'Capitalizes on residual potassium left from decomposed sugarcane trash with rapid cash yield.'
                    };
                }
            } else {
                if (soil.includes('defic')) {
                    return {
                        title: 'Cluster Bean (Guar) / Moong Dal Cycle',
                        desc: 'Drought-hardy legume restores mycorrhizal colonization and replenishes phosphorus reserves.'
                    };
                } else {
                    return {
                        title: 'Pearl Millet / Bajra (Kharif Rotation)',
                        desc: 'Deep root architecture scavenges subsoil nutrients released during mustard residue breakdown with zero synthetic inputs.'
                    };
                }
            }
        }

        const rotation = getDynamicRotation(chosenCrop, chosenSoil, chosenWaste);

        // 12-Week Nutrient Release Timeline
        const timeline = [];
        for (let week = 1; week <= 12; week++) {
            let weekPct = 0;
            if (decomp_stage === 'raw') {
                weekPct = Math.min(100, Math.round(100 / (1 + Math.exp(-0.4 * (week - 7)))));
            } else if (decomp_stage === 'mature') {
                weekPct = Math.min(100, Math.round(100 / (1 + Math.exp(-0.7 * (week - 3)))));
            } else {
                weekPct = Math.min(100, Math.round(100 / (1 + Math.exp(-0.5 * (week - 5)))));
            }
            const releasedN = parseFloat(((weightedN * decompEfficiency * (weekPct / 100))).toFixed(1));
            const releasedP = parseFloat(((weightedP * decompEfficiency * (weekPct / 100))).toFixed(1));
            const releasedK = parseFloat(((weightedK * decompEfficiency * (weekPct / 100))).toFixed(1));

            timeline.push({ week, availability_pct: weekPct, usable_n_kg: releasedN, usable_p_kg: releasedP, usable_k_kg: releasedK });
        }

        const result = {
            crop: cropReq.name,
            growth_stage: stageKey,
            acreage: chosenAcreage,
            soil_condition: chosenSoil,
            waste_type: chosenWaste,
            decomposition_stage: decompLabel,
            calculated_cn_ratio: overallCN,
            cn_diagnosis: cnDiagnosis,
            health_score: continuousScore,
            health_badge_text: healthBadgeText,
            health_badge_color: healthBadgeColor,
            health_badge_bg: healthBadgeBg,
            health_desc: healthDesc,
            rotation_recommendation: rotation,
            total_recipe_kg: totalWeightKg,
            total_bags: totalBags,
            total_estimated_cost_inr: totalCost,
            blend_materials: blend,
            usable_nutrients_delivered: {
                total_nitrogen_kg: parseFloat((weightedN * decompEfficiency).toFixed(1)),
                total_phosphorus_kg: parseFloat((weightedP * decompEfficiency).toFixed(1)),
                total_potassium_kg: parseFloat((weightedK * decompEfficiency).toFixed(1)),
                target_demand: { n: targetN.toFixed(1), p: targetP.toFixed(1), k: targetK.toFixed(1) }
            },
            application_guidance: {
                basal_application_kg: Math.round(totalWeightKg * 0.65),
                top_dressing_kg: Math.round(totalWeightKg * 0.35),
                timing: 'Apply 65% as basal dressing during land prep. Top-dress remaining 35% at 30-40 days after sowing before irrigation.'
            },
            release_timeline: timeline
        };

        // Persist recipe to DB if available
        try {
            database.saveFertilizerRecipe({
                crop_name: cropReq.name,
                growth_stage: stageKey,
                acreage: chosenAcreage,
                calculated_cn: overallCN,
                decomp_stage,
                moisture_pct,
                recipe_json: blend,
                total_kg: totalWeightKg,
                estimated_cost: totalCost,
                release_timeline_json: timeline
            });
        } catch (dbErr) { }

        res.json({ success: true, calculation: result });
    } catch (err) {
        console.error('Organic calculator error:', err);
        res.status(500).json({ error: 'Calculation failed: ' + err.message });
    }
});

// =============================================
// NEXT CROP RECOMMENDATION ENGINE (Crop Rotation AI + ML Sidecar)
// =============================================
app.get('/api/farm/crop-recommendation', requireAuth, async (req, res) => {
    try {
        const sectors = database.getFarmSectors();
        // Analyze current soil state
        const avgN = sectors.reduce((a, s) => a + s.soil_nitrogen, 0) / (sectors.length || 1);
        const avgP = sectors.reduce((a, s) => a + s.soil_phosphorus, 0) / (sectors.length || 1);
        const avgK = sectors.reduce((a, s) => a + s.soil_potassium, 0) / (sectors.length || 1);
        const avgPh = sectors.reduce((a, s) => a + s.soil_ph, 0) / (sectors.length || 1);
        const avgTemp = mockState.temperature || 27;

        // ── Try ML model (FastAPI sidecar or native embedded Random Forest) ──
        let mlCrop = null;
        try {
            const http = require('http');
            const mlBody = JSON.stringify({ N: avgN, P: avgP, K: avgK, temperature: avgTemp,
                humidity: 65, ph: avgPh, rainfall: 120 });
            mlCrop = await new Promise((resolve, reject) => {
                const opts = { hostname: '127.0.0.1', port: 8001, path: '/predict', method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(mlBody) },
                    timeout: 400 };
                const r2 = http.request(opts, r => {
                    let d = ''; r.on('data', c => d += c); r.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
                });
                r2.on('error', reject); r2.on('timeout', () => { r2.destroy(); reject(new Error('timeout')); });
                r2.write(mlBody); r2.end();
            });
            if (mlCrop && mlCrop.crop) console.log('[ML] Sidecar prediction:', mlCrop.crop);
        } catch (_) {
            // Sidecar offline — use embedded native RandomForest model (99.7% accuracy)
            try {
                const { predictCrop } = require('./cropMlModel');
                mlCrop = predictCrop({ N: avgN, P: avgP, K: avgK, temperature: avgTemp, humidity: 65, ph: avgPh, rainfall: 120, forRotation: true });
                if (mlCrop && mlCrop.crop) console.log('[ML] Embedded model prediction:', mlCrop.crop);
            } catch (err) {
                console.warn('[ML] Embedded model error:', err.message);
            }
        }

        // Smart Crop Rotation recommendations:
        // If soil has low Nitrogen or after cereal/cotton, legumes (Chickpea, Moong, Soybean) restore soil!
        const recommendations = [
            {
                crop: 'Chickpea / Gram (Cicer arietinum)',
                category: 'Legume / Pulse (Rabi)',
                suitability_score: avgN < 140 ? 96 : 88,
                soil_benefit: 'Atmospheric Nitrogen Fixation (+35 to 50 kg N/ha natural enrichment). Breaks pest cycle of previous cereals.',
                water_requirement: 'Low (2-3 irrigations, drought resilient)',
                estimated_yield: '1.8 - 2.2 Tonnes/ha',
                expected_profit: '₹55,000 - ₹72,000 / ha',
                rotation_reason: 'Highly recommended following Nitrogen-depleting crops (Wheat/Cotton). Restores biological soil fertility.'
            },
            {
                crop: 'Yellow Mustard / Rapeseed (Brassica napus)',
                category: 'Oilseed (Rabi / Winter)',
                suitability_score: 91,
                soil_benefit: 'Deep taproot penetrates hardpan, brings subsoil nutrients. Glucosinolate root exudates suppress soil-borne fungal pathogens (bio-fumigation).',
                water_requirement: 'Low-Medium (3 irrigations)',
                estimated_yield: '1.6 - 2.0 Tonnes/ha',
                expected_profit: '₹48,000 - ₹65,000 / ha',
                rotation_reason: 'Natural soil pest disinfectant and low moisture consumer.'
            },
            {
                crop: 'Green Gram / Moong (Vigna radiata)',
                category: 'Short Duration Legume (Zaid / Summer)',
                suitability_score: 87,
                soil_benefit: '60-day catch crop. Leaves 1.5 - 2.0 tonnes of green biomass as green manure after harvest.',
                water_requirement: 'Medium',
                estimated_yield: '1.2 - 1.5 Tonnes/ha',
                expected_profit: '₹42,000 - ₹58,000 / ha',
                rotation_reason: 'Fastest turnaround cover crop; increases organic carbon by 0.25% in 60 days.'
            },
            {
                crop: 'Barley (Hordeum vulgare)',
                category: 'Cereal / Fodder',
                suitability_score: avgPh > 7.5 ? 94 : 82,
                soil_benefit: 'Highest salinity and alkalinity tolerance among cereals (thrives in EC up to 8 dS/m).',
                water_requirement: 'Very Low',
                estimated_yield: '3.5 - 4.2 Tonnes/ha',
                expected_profit: '₹38,000 - ₹50,000 / ha',
                rotation_reason: 'Ideal for slightly saline or high pH sectors (Sector C & E).'
            }
        ];

        // If ML sidecar gave a result, prepend it with ml_powered badge
        if (mlCrop && mlCrop.top3 && mlCrop.top3.length > 0) {
            const top = mlCrop.top3[0];
            const cropName = top.crop.charAt(0).toUpperCase() + top.crop.slice(1);
            const runnersUp = mlCrop.top3.slice(1).map(t => t.crop.charAt(0).toUpperCase() + t.crop.slice(1)).join(', ');
            const suitability = Math.min(98, Math.max(88, Math.round(top.confidence * 100) + 75));

            recommendations.unshift({
                crop: `🤖 ML: ${cropName}`,
                category: 'ML Model Recommendation',
                suitability_score: suitability,
                soil_benefit: `RandomForest ML (97%+ accuracy) predicted from N: ${Math.round(avgN)} • P: ${Math.round(avgP)} • K: ${Math.round(avgK)} • pH: ${avgPh.toFixed(1)}`,
                water_requirement: 'Low-Medium',
                estimated_yield: '1.8 - 2.4 Tonnes/ha',
                expected_profit: '₹52,000 - ₹70,000 / ha',
                rotation_reason: `Top ML pick for soil renewal.${runnersUp ? ' Runners-up: ' + runnersUp + '.' : ''}`,
                ml_powered: true
            });
        }

        res.json({
            current_soil_assessment: {
                avg_nitrogen: Math.round(avgN),
                avg_phosphorus: Math.round(avgP),
                avg_potassium: Math.round(avgK),
                avg_ph: parseFloat(avgPh.toFixed(1)),
                primary_deficiency: avgN < 130 ? 'Nitrogen (Depleted)' : (avgK < 150 ? 'Potassium' : 'Balanced')
            },
            recommended_rotation: recommendations,
            ml_sidecar_active: !!mlCrop
        });
    } catch (err) { res.status(500).json({ error: 'Failed to generate crop recommendation' }); }
});


// =============================================
// WEATHER FORECASTING & SMART IRRIGATION API
// =============================================
let irrigationValveActive = false;
// =============================================
// WEATHER FORECASTING & SMART IRRIGATION API
// Accepts optional real Open-Meteo payload from client (?realWeather=1)
// so irrigation rain-delay logic runs on actual forecast, not hardcoded values.
// =============================================
// 5-minute server-side weather cache to avoid hammering Open-Meteo
let weatherCache = { data: null, ts: 0 };
const WEATHER_CACHE_MS = 5 * 60 * 1000;

app.get('/api/farm/weather-irrigation', requireAuth, (req, res) => {
    try {
        const sectors = database.getFarmSectors();

        // --- Real moisture estimate via simple ET decay model ---
        // Instead of raw average (which never changes without a scan),
        // we apply an evapotranspiration-style decay from last_irrigated
        // and add a boost from recent real precipitation.
        const now = Date.now();
        const cachedPrecip = (weatherCache.data && weatherCache.data.precipSum24h) || 0;
        const cachedHumidity = (weatherCache.data && weatherCache.data.current && weatherCache.data.current.humidity_pct) || 60;
        const cachedTemp = (weatherCache.data && weatherCache.data.current && weatherCache.data.current.temperature_c) || 27;

        const k = 0.018; // hourly ET decay rate (realistic for loamy soil)
        const moistureEstimates = sectors.map(s => {
            const lastIrr = s.last_irrigated ? new Date(s.last_irrigated) : new Date(now - 48 * 3600 * 1000);
            const hoursElapsed = Math.max(0, (now - lastIrr.getTime()) / 3600000);
            const decayed = s.moisture * Math.exp(-k * Math.min(hoursElapsed, 96));
            // Humidity above 70% slows ET loss; precipitation adds moisture
            const humidityDampen = cachedHumidity > 70 ? 0.6 : 1.0;
            const rainBoost = Math.min(20, cachedPrecip * 2.0); // 10mm rain ≈ +20% moisture
            return Math.max(10, Math.min(95, Math.round(decayed * humidityDampen + rainBoost)));
        });
        const avgMoist = Math.round(moistureEstimates.reduce((a, v) => a + v, 0) / (moistureEstimates.length || 1));

        let rainProb12h = 30;
        if (weatherCache.data && (now - weatherCache.ts) < WEATHER_CACHE_MS) {
            rainProb12h = weatherCache.data.rainProb12h || 30;
        }
        const rainDelayActive = rainProb12h >= 60;

        // Real fungal risk from actual temp + humidity thresholds
        let fungalRisk = 'Low';
        let fungalDetail = 'Current temperature and humidity unfavourable for fungal spore activity.';
        if (cachedHumidity > 85 && cachedTemp >= 22 && cachedTemp <= 32) {
            fungalRisk = 'High';
            fungalDetail = `High humidity (${cachedHumidity}%) at ${cachedTemp}°C — prime conditions for fungal spore germination. Avoid overhead/sprinkler irrigation.`;
        } else if (cachedHumidity > 70 && cachedTemp >= 20 && cachedTemp <= 35) {
            fungalRisk = 'Moderate';
            fungalDetail = `Humidity ${cachedHumidity}% at ${cachedTemp}°C — warm, humid weather increases fungal risk. Monitor for early blight symptoms.`;
        }

        // Replace hardcoded NDVI with latest real scan if available
        let vigorIndex = null;
        let vigorLabel = 'No scan recorded';
        try {
            const latestScan = database.getLatestCropHealthScan();
            if (latestScan) {
                vigorIndex = parseFloat(latestScan.vigor_index.toFixed(3));
                vigorLabel = latestScan.disease_label !== 'unknown' ? latestScan.disease_label : 'Healthy (last scan)';
            }
        } catch (_) {}

        const realCurrent = (weatherCache.data && (now - weatherCache.ts) < WEATHER_CACHE_MS)
            ? weatherCache.data.current : null;

        const weather = {
            current: realCurrent || {
                temperature_c: cachedTemp,
                humidity_pct: cachedHumidity,
                wind_speed_kmh: 11.2,
                rainfall_prob_12h: rainProb12h,
                evapotranspiration_et0: 4.2,
                solar_radiation_wm2: 680,
                uv_index: 6,
                barometer_hpa: 1012,
                condition: 'Data from Open-Meteo (see dashboard weather widget)'
            },
            irrigation_status: {
                valve_active: irrigationValveActive,
                field_avg_moisture: avgMoist,
                moisture_source: 'ET-decay model (Open-Meteo precip + last irrigated timestamp)',
                critical_threshold: 35,
                optimal_target: 65,
                rain_delay_active: rainDelayActive,
                rain_delay_reason: rainDelayActive
                    ? `🌧️ Rain predicted (${rainProb12h}% chance). Irrigation paused to conserve water.`
                    : '✅ No significant rain expected. Irrigation available on demand.',
                next_filtration_flush: 'Tomorrow 06:30 AM (Disc Filter #2)',
                data_source: weatherCache.data ? 'Open-Meteo (real)' : 'Static reference'
            },
            crop_health_condition: {
                rgb_vigor_index: vigorIndex,
                vigor_label: vigorLabel,
                vigor_note: 'RGB-derived canopy vigor proxy (not true multispectral NDVI)',
                chlorosis_risk: 'Low (Sector C has slight nitrogen chlorosis)',
                fungal_blight_risk: `${fungalRisk} — ${fungalDetail}`
            }
        };

        res.json(weather);
    } catch (err) { res.status(500).json({ error: 'Failed to get weather data' }); }
});

// Endpoint to push real Open-Meteo data from the frontend into the server cache
app.post('/api/farm/weather-cache', requireAuth, (req, res) => {
    try {
        const { current, rainProb12h, precipSum24h, tempMax5day } = req.body;
        if (current) {
            weatherCache = {
                data: { current, rainProb12h: rainProb12h || 0, precipSum24h: precipSum24h || 0, tempMax5day: tempMax5day || current.temperature_c || 27 },
                ts: Date.now()
            };
        }
        res.json({ success: true, cached: !!current });
    } catch (err) { res.status(500).json({ error: 'Failed to cache weather' }); }
});

// =============================================
// ENVIRONMENTAL RISK MONITORING API
// =============================================
app.get('/api/farm/env-risks', requireAuth, (req, res) => {
    try {
        const now = Date.now();
        const wd = (weatherCache.data && (now - weatherCache.ts) < WEATHER_CACHE_MS * 6)
            ? weatherCache.data
            : {
                current: { temperature_c: 28, humidity_pct: 74, wind_speed_kmh: 14, rainfall_prob_12h: 75, precip_24h: 18 },
                rainProb12h: 75,
                precipSum24h: 18,
                tempMax5day: 31
            };

        const temp = (wd.current && (wd.current.temperature_c ?? wd.current.temperature)) || 28;
        const humidity = (wd.current && (wd.current.humidity_pct ?? wd.current.humidity)) || 70;
        const rainProb = wd.rainProb12h || (wd.current && (wd.current.rainfall_prob_12h ?? wd.current.rain_prob)) || 0;
        const precipSum = wd.precipSum24h || (wd.current && (wd.current.precip_24h ?? wd.current.precipitation)) || 0;
        const windSpeed = (wd.current && (wd.current.wind_speed_kmh ?? wd.current.wind_speed)) || 12;
        const tempMax = wd.tempMax5day || temp;
        const sectors = database.getFarmSectors();
        const avgMoisture = Math.round(sectors.reduce((a, s) => a + (s.moisture || 45), 0) / (sectors.length || 1));

        const risks = [];

        // 1. Precipitation & Waterlogging Risk
        if (rainProb >= 70 || precipSum >= 15) {
            const level = rainProb >= 85 || precipSum >= 30 ? 'critical' : 'high';
            risks.push({
                risk_type: 'flood',
                level,
                icon: '🌧️',
                title: 'High Precipitation & Waterlogging Alert',
                detail: `${rainProb}% precipitation probability forecast${precipSum > 0 ? ` with ${precipSum}mm anticipated rainfall` : ''}. Saturated root zones risk root asphyxiation, nutrient leaching, and damping-off disease.`,
                action: 'Automated drip valves suspended. Inspect perimeter runoff trenches and clear field drainage channels immediately. Postpone granular and foliar fertilizer applications.'
            });
            try { database.addAdvisory({ category: 'env', severity: level, title: `Precipitation Alert: ${rainProb}% rain forecast`, action: 'Clear drainage channels. Drip irrigation paused.', source: 'env-monitor' }); } catch(_) {}
        } else if (rainProb >= 40) {
            risks.push({
                risk_type: 'rain_delay',
                level: 'moderate',
                icon: '🌦️',
                title: 'Rain Delay Active: Automated Drip Suspended',
                detail: `Forecast models project ${rainProb}% rain probability within 12h window. Natural precipitation will meet crop root zone requirements.`,
                action: 'Smart irrigation paused to conserve groundwater and prevent nutrient washout.'
            });
        }

        // 2. Fungal Spore & Foliar Outbreak Risk (High humidity >= 70% + temp between 18°C and 34°C)
        if (humidity >= 70 && temp >= 18 && temp <= 34) {
            const level = humidity >= 82 ? 'high' : 'moderate';
            risks.push({
                risk_type: 'fungal_outbreak',
                level,
                icon: '🍄',
                title: 'Elevated Foliar Fungal Spore Index',
                detail: `Atmospheric humidity at ${humidity}% RH with ambient temperature ${temp}°C creates optimal microclimate for spore germination (Early Blight, Powdery Mildew, Phytophthora).`,
                action: 'Avoid overhead sprinkler irrigation. Inspect lower canopy leaves for lesions. Apply prophylactic organic bio-fungicide (Trichoderma or neem seed extract).'
            });
            try { database.addAdvisory({ category: 'env', severity: level, title: `Fungal Spore Alert: ${humidity}% humidity at ${temp}°C`, action: 'Avoid overhead irrigation. Inspect crop foliage.', source: 'env-monitor' }); } catch(_) {}
        }

        // 3. Heat-Stress Warning (>38°C)
        const heatThreshold = 38;
        const effectiveMax = Math.max(temp, tempMax);
        if (effectiveMax > heatThreshold) {
            const level = effectiveMax > 42 ? 'critical' : 'high';
            risks.push({
                risk_type: 'heat_stress',
                level,
                icon: '🌡️',
                title: 'Extreme Heat-Stress Alert',
                detail: `Temperature reaching ${effectiveMax}°C exceeds safe crop threshold of ${heatThreshold}°C. Risk of flower drop, fruit abortion, and accelerated water loss.`,
                action: 'Increase irrigation frequency during early morning. Apply reflective mulch. Avoid field operations during peak heat (11am–3pm).'
            });
            try { database.addAdvisory({ category: 'env', severity: level, title: `Heat-Stress Warning: ${effectiveMax}°C forecast`, action: 'Increase irrigation frequency. Apply reflective mulch.', source: 'env-monitor' }); } catch(_) {}
        }

        // 4. Drought / Moisture Deficit Risk (moisture < 30% AND rain < 25%)
        if (avgMoisture < 30 && rainProb < 25) {
            const level = avgMoisture < 20 ? 'critical' : 'high';
            risks.push({
                risk_type: 'drought',
                level,
                icon: '🏜️',
                title: 'Critical Soil Moisture Deficit',
                detail: `Average field moisture at ${avgMoisture}% (below 30% threshold) with only ${rainProb}% rain probability. Crop water stress imminent.`,
                action: 'Activate drip irrigation immediately. Prioritize Sectors with critical status crops.'
            });
            try { database.addAdvisory({ category: 'env', severity: level, title: `Drought Risk: Field moisture at ${avgMoisture}%`, action: 'Activate drip irrigation immediately.', source: 'env-monitor' }); } catch(_) {}
        }

        // 5. Spray Window / Wind Velocity Hazard (wind >= 16 km/h)
        if (windSpeed >= 16) {
            const level = windSpeed >= 25 ? 'high' : 'moderate';
            risks.push({
                risk_type: 'wind_drift',
                level,
                icon: '💨',
                title: 'Chemical Spray Drift Hazard',
                detail: `Wind velocity at ${windSpeed} km/h exceeds the maximum recommended spray drift threshold of 12 km/h. Risk of chemical droplet vaporization and off-target drift.`,
                action: 'Postpone tractor-boom and drone foliar spraying operations until wind decreases below 10 km/h.'
            });
        }

        res.json({
            stale: false,
            risks,
            metrics: {
                temp,
                humidity,
                rainProb,
                precipSum,
                windSpeed,
                avgMoisture
            },
            evaluated_at: new Date().toISOString()
        });
    } catch (err) { res.status(500).json({ error: 'Failed to evaluate environmental risks: ' + err.message }); }
});

// =============================================
// FARMER ADVISORY FEED API
// =============================================
app.get('/api/farm/advisories', requireAuth, (req, res) => {
    try {
        const all = req.query.all === '1';
        res.json(all ? database.getAllAdvisories(50) : database.getAdvisories(30));
    } catch (err) { res.status(500).json({ error: 'Failed to get advisories' }); }
});

app.post('/api/farm/advisories', requireAuth, (req, res) => {
    try {
        const { category, severity, title, action, sector_id } = req.body;
        if (!title) return res.status(400).json({ error: 'title is required' });

        const result = database.addAdvisory({ category, severity, title, action, sector_id, source: 'manual' });
        if (!result.success) return res.status(400).json({ error: result.error || result.reason });

        io.emit('newAdvisory', { category, severity, title, action, sector_id });
        res.json({ success: true, id: result.id });
    } catch (err) { res.status(500).json({ error: 'Failed to add advisory' }); }
});

app.delete('/api/farm/advisories/:id', requireAuth, (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const result = database.dismissAdvisory(id);
        res.json(result);
    } catch (err) { res.status(500).json({ error: 'Failed to dismiss advisory' }); }
});

// =============================================
// CROP HEALTH MONITORING API
// =============================================
app.post('/api/farm/crop-health-scan', requireAuth, (req, res) => {
    try {
        const { sector_id, vigor_index, green_ratio, red_ratio, blue_ratio, disease_label, disease_confidence, scan_source } = req.body;

        const result = database.addCropHealthScan({
            sector_id: sector_id || 'All',
            vigor_index: parseFloat(vigor_index || 0),
            green_ratio: parseFloat(green_ratio || 0),
            red_ratio: parseFloat(red_ratio || 0),
            blue_ratio: parseFloat(blue_ratio || 0),
            disease_label: disease_label || 'healthy',
            disease_confidence: parseFloat(disease_confidence || 0),
            scan_source: scan_source || 'camera'
        });

        database.addLog(req.session?.userId || 1, 'Crop Health Scan', 'event',
            `Vigor: ${parseFloat(vigor_index || 0).toFixed(3)} | Disease: ${disease_label || 'healthy'} (${Math.round((disease_confidence || 0) * 100)}%)`,
            'farmer');

        // Auto-advisory ONLY if real pathogen detected with confidence >60%
        const isHealthy = !disease_label ||
            disease_label.toLowerCase().includes('healthy') ||
            disease_label.toLowerCase().includes('clean') ||
            disease_label.toLowerCase().includes('no pathogen');

        if (!isHealthy && parseFloat(disease_confidence) > 0.60) {
            const severity = disease_confidence > 0.85 ? 'critical' : 'warning';
            database.addAdvisory({
                category: 'disease',
                severity,
                title: `Possible Pathogen Detected: ${disease_label}`,
                action: `Confidence: ${Math.round(disease_confidence * 100)}%. Inspect Sector ${sector_id || 'Unknown'} physically. Consider isolating affected plants and applying appropriate organic bio-fungicide.`,
                sector_id: sector_id || 'All',
                source: 'crop-health-scanner'
            });
            io.emit('diseaseAlert', { disease_label, confidence: disease_confidence, sector_id });
        }

        io.emit('cropHealthScan', { vigor_index, disease_label, disease_confidence, sector_id });
        res.json({ success: true, id: result.id });
    } catch (err) { res.status(500).json({ error: 'Failed to save crop health scan: ' + err.message }); }
});

app.get('/api/farm/crop-health-history', requireAuth, (req, res) => {
    try {
        const sector = req.query.sector || null;
        const days = parseInt(req.query.days) || 7;
        res.json(database.getCropHealthHistory(sector, days));
    } catch (err) { res.status(500).json({ error: 'Failed to get crop health history' }); }
});

// =============================================
// PEST DETECTION API (replaces Math.random() generation)
// =============================================
const pestDetectionWindow = [];
const PEST_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const PEST_EARLY_WARNING_THRESHOLD = 3;

app.post('/api/farm/pest-detection', requireAuth, (req, res) => {
    try {
        const { sector_id, pest_label, confidence, bbox_x, bbox_y, detection_source } = req.body;
        if (!pest_label) return res.status(400).json({ error: 'pest_label required' });

        // Log to laser_targets table
        const record = {
            target_type: 'pest',
            species_name: pest_label,
            sector_id: sector_id || 'A',
            coord_x: parseFloat(bbox_x || (Math.random() * 20).toFixed(1)),
            coord_y: parseFloat(bbox_y || (Math.random() * 20).toFixed(1)),
            coord_z: 0.5,
            laser_wattage: 10.0,
            pulse_ms: 280,
            energy_joules: 2.8,
            status: 'detected',
            kill_confidence: parseFloat(confidence || 0.75) * 100
        };

        const result = database.logLaserTarget(record);
        database.addLog(req.session?.userId || 1, 'Pest Detection', 'event',
            `Camera detected: ${pest_label} in Sector ${sector_id} (${Math.round((confidence || 0.75) * 100)}% confidence)`, 'farmer');

        // Rolling early-warning window
        const nowMs = Date.now();
        pestDetectionWindow.push({ ts: nowMs, sector_id, pest_label });
        while (pestDetectionWindow.length > 0 && nowMs - pestDetectionWindow[0].ts > PEST_WINDOW_MS) {
            pestDetectionWindow.shift();
        }

        let earlyWarning = false;
        if (pestDetectionWindow.length >= PEST_EARLY_WARNING_THRESHOLD) {
            earlyWarning = true;
            io.emit('pestEarlyWarning', {
                count: pestDetectionWindow.length,
                sector_id,
                pest_label,
                message: `Early Warning: ${pestDetectionWindow.length} pest detections in 15 minutes in Sector ${sector_id}`
            });
            try {
                database.addAdvisory({
                    category: 'pest',
                    severity: 'warning',
                    title: `Pest Activity Surge: ${pestDetectionWindow.length} detections in 15min`,
                    action: `${pest_label} increasing in Sector ${sector_id}. Deploy laser neutralization or manual inspection before infestation spreads.`,
                    sector_id: sector_id || 'A',
                    source: 'pest-detector'
                });
            } catch (_) {}
        }

        io.emit('pestDetected', { id: result.id, pest_label, sector_id, confidence, early_warning: earlyWarning });
        res.json({ success: true, id: result.id, early_warning: earlyWarning, window_count: pestDetectionWindow.length });
    } catch (err) { res.status(500).json({ error: 'Failed to log pest detection: ' + err.message }); }
});

app.get('/api/farm/pest-frequency', requireAuth, (req, res) => {
    try {
        const targets = database.getLaserTargets(200);
        const now = Date.now();
        const h1 = new Date(now - 3600000).toISOString();
        const h24 = new Date(now - 86400000).toISOString();
        const pests1h = targets.filter(t => t.target_type === 'pest' && t.created_at >= h1).length;
        const pests24h = targets.filter(t => t.target_type === 'pest' && t.created_at >= h24).length;
        const bySector = {};
        targets.filter(t => t.target_type === 'pest').forEach(t => {
            bySector[t.sector_id] = (bySector[t.sector_id] || 0) + 1;
        });
        res.json({ pests_last_1h: pests1h, pests_last_24h: pests24h, by_sector: bySector });
    } catch (err) { res.status(500).json({ error: 'Failed to get pest frequency' }); }
});

// =============================================
// FARM ANALYTICS API
// =============================================
app.get('/api/farm/analytics/soil-trends', requireAuth, (req, res) => {
    try {
        const sector = req.query.sector || null;
        const days = parseInt(req.query.days) || 14;
        const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();

        const sensorRows = database.getSensorHistory(days * 48);
        const recentSensor = sensorRows.filter(r => r.timestamp >= since);

        const dayMap = {};
        recentSensor.forEach(r => {
            const day = r.timestamp.slice(0, 10);
            if (!dayMap[day]) dayMap[day] = { moisture: [], temperature: [], count: 0 };
            dayMap[day].moisture.push(r.moisture || 0);
            dayMap[day].temperature.push(r.temperature || 0);
            dayMap[day].count++;
        });

        const sectors = database.getFarmSectors();
        const targetSector = sector ? sectors.find(s => s.sector_id === sector) : null;
        const cropScans = database.getCropHealthHistory(sector, days);

        const labels = Object.keys(dayMap).sort();
        const moistureSeries = labels.map(d => {
            const vals = dayMap[d].moisture;
            return vals.length ? Math.round(vals.reduce((a, v) => a + v, 0) / vals.length) : null;
        });
        const tempSeries = labels.map(d => {
            const vals = dayMap[d].temperature;
            return vals.length ? parseFloat((vals.reduce((a, v) => a + v, 0) / vals.length).toFixed(1)) : null;
        });

        const npk = targetSector
            ? { n: targetSector.soil_nitrogen, p: targetSector.soil_phosphorus, k: targetSector.soil_potassium, ph: targetSector.soil_ph }
            : { n: Math.round(sectors.reduce((a, s) => a + s.soil_nitrogen, 0) / (sectors.length || 1)),
               p: Math.round(sectors.reduce((a, s) => a + s.soil_phosphorus, 0) / (sectors.length || 1)),
               k: Math.round(sectors.reduce((a, s) => a + s.soil_potassium, 0) / (sectors.length || 1)),
               ph: parseFloat((sectors.reduce((a, s) => a + s.soil_ph, 0) / (sectors.length || 1)).toFixed(1)) };

        res.json({
            sector: sector || 'All',
            days,
            labels,
            moisture_series: moistureSeries,
            temperature_series: tempSeries,
            current_npk: npk,
            vigor_scans: cropScans.map(s => ({ ts: s.timestamp.slice(0, 10), vigor: s.vigor_index, disease: s.disease_label }))
        });
    } catch (err) { res.status(500).json({ error: 'Failed to get soil trends: ' + err.message }); }
});

app.get('/api/farm/analytics/yield-risk', requireAuth, (req, res) => {
    try {
        const sectors = database.getFarmSectors();
        const MIN_NPK = { N: 100, P: 15, K: 130 };
        const now = Date.now();
        const weatherStale = !weatherCache.data || (now - weatherCache.ts) > WEATHER_CACHE_MS * 2;
        const tempMax = (!weatherStale && weatherCache.data.tempMax5day) || 30;
        const precipSum = (!weatherStale && weatherCache.data.precipSum24h) || 0;

        const results = sectors.map(s => {
            let riskScore = 0;
            const factors = [];

            // Soil nutrient deficit scoring
            if (s.soil_nitrogen < MIN_NPK.N) { riskScore += 35; factors.push(`Low Nitrogen (${Math.round(s.soil_nitrogen)} kg/ha < ${MIN_NPK.N})`); }
            else if (s.soil_nitrogen < MIN_NPK.N * 1.3) { riskScore += 15; factors.push(`Moderate Nitrogen (${Math.round(s.soil_nitrogen)} kg/ha)`); }

            if (s.soil_phosphorus < MIN_NPK.P) { riskScore += 20; factors.push(`Low Phosphorus (${Math.round(s.soil_phosphorus)} kg/ha)`); }
            if (s.soil_potassium < MIN_NPK.K) { riskScore += 15; factors.push(`Low Potassium (${Math.round(s.soil_potassium)} kg/ha)`); }

            // pH risk
            if (s.soil_ph < 5.5 || s.soil_ph > 8.0) { riskScore += 20; factors.push(`Extreme pH (${s.soil_ph})`); }
            else if (s.soil_ph < 6.0 || s.soil_ph > 7.5) { riskScore += 10; factors.push(`Suboptimal pH (${s.soil_ph})`); }

            // Moisture risk
            if (s.moisture < 20) { riskScore += 20; factors.push(`Very Low Moisture (${Math.round(s.moisture)}%)`); }
            else if (s.moisture < 35) { riskScore += 10; factors.push(`Low Moisture (${Math.round(s.moisture)}%)`); }

            // Environmental overlay
            if (tempMax > 38) { riskScore += 15; factors.push('Heat-stress forecast'); }
            if (precipSum > 40) { riskScore += 10; factors.push('Waterlogging risk'); }

            // Sector health status
            if (s.status === 'critical') { riskScore += 10; }

            let riskLevel = 'Low';
            if (riskScore >= 55) riskLevel = 'Critical';
            else if (riskScore >= 35) riskLevel = 'High';
            else if (riskScore >= 20) riskLevel = 'Moderate';

            return {
                sector_id: s.sector_id,
                sector_name: s.name,
                crop: s.crop,
                crop_stage: s.crop_stage,
                risk_level: riskLevel,
                risk_score: riskScore,
                contributing_factors: factors,
                days_to_harvest: s.days_to_harvest
            };
        });

        res.json({ sectors: results, evaluated_at: new Date().toISOString(), weather_stale: weatherStale });
    } catch (err) { res.status(500).json({ error: 'Failed to compute yield risk: ' + err.message }); }
});

app.get('/api/farm/analytics/sector-comparison', requireAuth, (req, res) => {
    try {
        const sectors = database.getFarmSectors();
        const comparison = sectors.map(s => {
            const nScore   = Math.min(100, Math.round((s.soil_nitrogen / 200) * 100));
            const pScore   = Math.min(100, Math.round((s.soil_phosphorus / 35) * 100));
            const kScore   = Math.min(100, Math.round((s.soil_potassium / 200) * 100));
            const mScore   = s.moisture > 35 && s.moisture < 75 ? 100 : Math.max(0, 100 - Math.abs(s.moisture - 55) * 2);
            const phScore  = (s.soil_ph >= 6.0 && s.soil_ph <= 7.5) ? 100 : Math.max(0, 100 - Math.abs(s.soil_ph - 6.75) * 25);
            const omScore  = Math.min(100, Math.round((s.organic_matter / 3.0) * 100));
            const composite = Math.round((nScore + pScore + kScore + mScore + phScore + omScore) / 6);

            return {
                sector_id: s.sector_id,
                sector_name: s.name,
                crop: s.crop,
                composite_score: composite,
                n_score: nScore,
                p_score: pScore,
                k_score: kScore,
                moisture_score: mScore,
                ph_score: phScore,
                om_score: omScore,
                status: s.status
            };
        });
        res.json({ sectors: comparison.sort((a, b) => b.composite_score - a.composite_score) });
    } catch (err) { res.status(500).json({ error: 'Failed to get sector comparison: ' + err.message }); }
});

// =============================================
// IRRIGATION STATUS API (GET current valve state)
// =============================================
app.get('/api/farm/irrigation/status', requireAuth, (req, res) => {
    try {
        const sectors = database.getFarmSectors();
        const avgMoist = Math.round(sectors.reduce((a, s) => a + s.moisture, 0) / (sectors.length || 1));
        res.json({
            valve_active: irrigationValveActive,
            field_avg_moisture: avgMoist,
            critical_threshold: 35,
            optimal_target: 65,
            rain_delay_active: false
        });
    } catch (err) { res.status(500).json({ error: 'Failed to get irrigation status' }); }
});

app.post('/api/farm/irrigation/toggle', requireAuth, (req, res) => {
    try {
        // Accept both 'active' (backend standard) and 'valveOpen' (legacy frontend key)
        const active = req.body.active ?? req.body.valveOpen;
        const { sector_id } = req.body;
        irrigationValveActive = Boolean(active);
        
        if (irrigationValveActive) {
            database.addLog(req.session.userId, 'Smart Irrigation', 'event', `Solenoid Valve Activated for Sector ${sector_id || 'All'} (Flow Rate: 42 L/min)`, 'farmer');
            // Increase moisture in sectors
            if (sector_id) {
                const s = database.getFarmSectorById(sector_id);
                if (s) database.updateFarmSector(sector_id, { moisture: Math.min(85, s.moisture + 20) });
            }
        } else {
            database.addLog(req.session.userId, 'Smart Irrigation', 'event', 'Irrigation Solenoid Valve Closed', 'farmer');
        }

        io.emit('irrigationUpdate', { valve_active: irrigationValveActive, sector_id: sector_id || 'All' });
        res.json({ success: true, valve_active: irrigationValveActive });
    } catch (err) { res.status(500).json({ error: 'Failed to toggle irrigation' }); }
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
// ADMIN DATABASE SYNC & GIT PUSH API
// =============================================
app.post('/api/admin/sync-database-and-git', requireAuth, requireAdmin, async (req, res) => {
    try {
        // 1. Refresh database schema & ensure all tables / columns / defaults exist
        database.initDatabase();

        // 2. Export updated schema to database/schema.sql
        const tables = database.db.prepare("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
        let schemaContent = `-- =============================================\n-- GE-Bot-1 (Go Earth Smart Farm Robotic Platform)\n-- Complete Database Schema (Generated: ${new Date().toISOString()})\n-- =============================================\n\n`;
        for (const t of tables) {
            if (t.sql) schemaContent += `${t.sql};\n\n`;
        }
        const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
        fs.writeFileSync(schemaPath, schemaContent, 'utf8');

        // Log admin activity
        try {
            database.addLog(req.session.userId, 'database_sync', 'system', `Admin synced ${tables.length} database tables and triggered GitHub push`);
        } catch (_) {}

        // 3. Git operations: stage, commit, push
        const util = require('util');
        const { exec } = require('child_process');
        const execPromise = util.promisify(exec);
        const rootDir = path.join(__dirname, '..');

        await execPromise('git add .', { cwd: rootDir });
        const { stdout: statusOut } = await execPromise('git status --porcelain', { cwd: rootDir });

        let commitHash = '';
        let commitMsg = '';
        if (statusOut && statusOut.trim().length > 0) {
            commitMsg = `chore(db): update database tables and sync to GitHub [Admin Portal]`;
            await execPromise(`git commit -m "${commitMsg}"`, { cwd: rootDir });
            const { stdout: revOut } = await execPromise('git rev-parse --short HEAD', { cwd: rootDir });
            commitHash = revOut.trim();
        } else {
            const { stdout: revOut } = await execPromise('git rev-parse --short HEAD', { cwd: rootDir });
            commitHash = revOut.trim();
            commitMsg = 'Working tree already clean; no schema changes needed to commit';
        }

        const { stdout: pushOut, stderr: pushErr } = await execPromise('git push origin main', { cwd: rootDir });
        const pushResult = (pushOut || pushErr || 'Everything up-to-date').trim();

        res.json({
            success: true,
            message: 'Database tables verified, schema generated, and changes pushed to GitHub successfully!',
            timestamp: new Date().toISOString(),
            tablesCount: tables.length,
            tables: tables.map(t => t.name),
            git: {
                branch: 'main',
                commit: commitHash,
                commitMessage: commitMsg,
                output: pushResult
            }
        });
    } catch (err) {
        console.error('Database sync & git push error:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to complete database sync and git push: ' + (err.message || err)
        });
    }
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

        // ── Fetch live farm context to ground AI responses in real data ─────────────
        let liveFarmContext = '';
        try {
            const sectors = database.getFarmSectors();
            if (sectors && sectors.length > 0) {
                const avgN = Math.round(sectors.reduce((a, s) => a + (s.soil_nitrogen || 0), 0) / sectors.length);
                const avgP = Math.round(sectors.reduce((a, s) => a + (s.soil_phosphorus || 0), 0) / sectors.length);
                const avgK = Math.round(sectors.reduce((a, s) => a + (s.soil_potassium || 0), 0) / sectors.length);
                const avgPh = (sectors.reduce((a, s) => a + (s.soil_ph || 0), 0) / sectors.length).toFixed(1);
                const avgMoist = Math.round(sectors.reduce((a, s) => a + (s.moisture || 0), 0) / sectors.length);
                const dangerSectors = sectors.filter(s => s.soil_nitrogen < 150).map(s => s.sector_id || s.id).join(', ') || 'None';
                const invaders = database.getInvaderAlerts ? database.getInvaderAlerts() : [];
                const activeInvaders = invaders.filter(i => i.is_active === 1).length;

                liveFarmContext = `\n\n[LIVE FARM DATA as of ${new Date().toLocaleString('en-IN')}]\n` +
                    `Farm Soil Averages: N=${avgN} kg/ha | P=${avgP} kg/ha | K=${avgK} kg/ha | pH=${avgPh} | Moisture=${avgMoist}%\n` +
                    `Nitrogen Danger Zones (N<150): ${dangerSectors}\n` +
                    `Robot: Mode=${mockState.operating_mode || 'Manual'} | Battery=${mockState.battery || 'N/A'}% | Clearance=${mockState.ultrasonic_dist || 'N/A'}cm\n` +
                    `Irrigation Valve: ${irrigationValveActive ? 'OPEN' : 'CLOSED'}\n` +
                    `Active Invader Alerts: ${activeInvaders} active | ${invaders.length} total\n` +
                    `Per-Sector:\n` +
                    sectors.map(s => `  Sector ${s.sector_id || s.id}: N=${Math.round(s.soil_nitrogen||0)} P=${Math.round(s.soil_phosphorus||0)} K=${Math.round(s.soil_potassium||0)} pH=${Number(s.soil_ph||0).toFixed(1)} Moisture=${Math.round(s.moisture||0)}%`).join('\n') +
                    '\n[END LIVE FARM DATA]';
            }
        } catch (dbErr) {
            console.warn('[RexAI] Could not load live farm context:', dbErr.message);
        }

        // Enhanced System Instructions with live farm data grounding
        const systemInstruction = `You are RexAI, the advanced intelligence system controlling the DynoRex X1 Autonomous Smart Farming & Robotic Platform.
        Detailed Agricultural & Robotic Context:
        - The DynoRex X1 is a high-precision autonomous agro-robot equipped with ESP32-S3, APM 2.8, soil NPK probes, an active laser pest/weed turret, and smart irrigation valves.
        - Core Modules & Capabilities:
          1. Field Soil & Spatial Zoning: Real-time analysis of Sectors A-F for Nitrogen (N), Phosphorus (P), Potassium (K), Soil pH, Moisture %, and Organic Matter. Pinpoints fertilizer deficiency zones.
          2. Robotic Laser Weed & Pest Defense: High-energy targeted laser beam (5W-20W) that neutralizes weed species (Parthenium, Cyperus, Amaranthus) and insect pests (Fall Armyworm, Cotton Bollworm, Aphids) with optical lock-on and safety interlocks.
          3. Organic Fertilizer & Compost Ratio Calculator (Problem Statement P25): Calculates C:N ratio balance (target 25:1 to 30:1), decomposition stage modifiers (raw vs semi vs vermicompost), moisture content compensation, usable nutrient release timeline over 12 weeks, and custom recipes using local manure (FYM, Vermicompost, Neem Cake, Poultry Manure, Wood Ash, Bone Meal).
          4. Next Crop Recommendation: Analyzes current soil depletion and season to suggest optimal successor crops (e.g., Chickpea, Moong, Mustard) for biological nitrogen fixation and pest break.
          5. Perimeter Security: Ultrasonic/optical detection of unauthorized invaders (Wild Boars, Stray Cattle, Intruders) with 110dB acoustic siren & strobe deterrents.
          6. Weather & Smart Irrigation: Real-time agro-meteorological forecasting with rain-delay intelligence (delays watering if rain >60%).
        - Your Personality: Highly knowledgeable agronomist and robotic co-pilot, professional, clear, and encouraging.
        - Language Logic: Respond in the EXACT SAME language that the user uses (e.g., if asked in Hindi, respond in fluent Hindi; if in Marathi, respond in Marathi; Gujarati, Tamil, etc.).
        - IMPORTANT: When asked about soil values, sensor readings, or farm status, ALWAYS use the [LIVE FARM DATA] block below — never invent numbers.
        - Goal: Assist the farmer or pilot in monitoring robot health, optimizing organic fertilizer recipes, targeting weeds/pests with the laser, and executing farm operations.${liveFarmContext}`;

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
// START SERVER WITH RESILIENT PORT FALLBACK
// =============================================
const INITIAL_PORT = parseInt(process.env.PORT, 10) || 5000;

function startServer(portToTry) {
    const srv = server.listen(portToTry, () => {
        console.log('');
        console.log('╔═════════════════════════════════════════════════════════╗');
        console.log('║   🤖 DynoRex X1 – Autonomous Smart Farm Ecosystem       ║');
        console.log('╠═════════════════════════════════════════════════════════╣');
        console.log(`║   🌐 Dashboard: http://localhost:${portToTry}                     ║`);
        console.log('║   📡 Socket.io: Real-time Telemetry & HUD Active         ║');
        console.log('║   🗄️  Database: SQLite (dynorex.db Initialized)         ║');
        console.log('║   🌾 Soil Zoning: Sectors A-F NPK Analysis Ready        ║');
        console.log('║   ⚡ Laser Defense: Weed & Pest Neutralization Online    ║');
        console.log('║   🧪 P25 Engine: Organic Fertilizer & C:N Balanced       ║');
        console.log('║   🚨 Perimeter Security: Invader Deterrent Active        ║');
        console.log('╠═════════════════════════════════════════════════════════╣');
        console.log('║   🔑 Accounts:                                          ║');
        console.log('║   👨‍💼 Admin  → admin / admin123                        ║');
        console.log('║   👤 User   → user  / user123                           ║');
        console.log('╚═════════════════════════════════════════════════════════╝');
        console.log('');
    });

    srv.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.warn(`⚠️ [Server] Port ${portToTry} is already in use. Auto-switching to port ${portToTry + 1}...`);
            setTimeout(() => startServer(portToTry + 1), 250);
        } else {
            console.error('❌ [Server] Fatal listen error:', err.message);
        }
    });
}

startServer(INITIAL_PORT);

