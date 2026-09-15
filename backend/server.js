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

app.post('/api/farm/invader-deter', requireAuth, (req, res) => {
    try {
        const { id, action } = req.body;
        database.triggerInvaderDeterrent(id);
        database.addLog(req.session.userId, 'Invader Deterred', 'system', `Deterrent triggered: ${action || '110dB Siren & Strobe'}`, 'farmer');
        io.emit('invaderResolved', { id, action });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed to trigger deterrent' }); }
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
        const { crop_name = 'wheat', growth_stage = 'Vegetative', acreage = 1.0, selected_materials = ['fym', 'vermicompost', 'neem_cake'], decomp_stage = 'semi_decomposed', moisture_pct = 35 } = req.body;

        const cropReq = CROP_REQUIREMENTS[crop_name.toLowerCase()] || CROP_REQUIREMENTS['wheat'];
        const stageFractions = (cropReq.stages && cropReq.stages[growth_stage]) || [0.4, 0.4, 0.3];

        // Net requirements for specified acreage
        const targetN = (cropReq.N * acreage * stageFractions[0]);
        const targetP = (cropReq.P * acreage * stageFractions[1]);
        const targetK = (cropReq.K * acreage * stageFractions[2]);

        // Decomposition stage modifier factor (mineralization efficiency)
        let decompEfficiency = 0.55;
        let lossFactor = 0.15; // 15% volatilization/leaching
        let decompLabel = 'Semi-Decomposed (Moderate mineralization, 55% released first season)';
        if (decomp_stage === 'raw') {
            decompEfficiency = 0.30;
            lossFactor = 0.30;
            decompLabel = 'Raw / Uncomposted (Slow release: ~30% first season, high odor/weed seed risk)';
        } else if (decomp_stage === 'mature') {
            decompEfficiency = 0.85;
            lossFactor = 0.05;
            decompLabel = 'Fully Mature Humified / Vermicompost (Rapid availability: 85% first season)';
        }

        // Calculate material weights & blend proportions
        const materials = selected_materials.map(id => ORGANIC_MATERIALS_DB[id] || ORGANIC_MATERIALS_DB['fym']);
        
        // Formulate recipe: default proportion weighting
        let totalWeightKg = 0;
        let weightedN = 0, weightedP = 0, weightedK = 0, weightedCN = 0;

        // Balance recipe to supply target Nitrogen primarily while augmenting P and K
        const blend = [];
        let remainingN = targetN / (decompEfficiency * (1 - lossFactor));

        materials.forEach((m, idx) => {
            let sharePct = 0;
            if (materials.length === 1) sharePct = 1.0;
            else if (idx === 0) sharePct = 0.55; // Base bulk amendment (e.g. FYM)
            else if (idx === 1) sharePct = 0.30; // Bioactive amendment (e.g. Vermicompost)
            else sharePct = 0.15 / (materials.length - 2 || 1); // Booster / cake / ash

            const dryMatterFraction = (1 - (m.moisture / 100));
            const effectiveN_pct = (m.N / 100) * dryMatterFraction;
            
            // Weight allocation
            let kg = (remainingN * sharePct) / Math.max(0.005, effectiveN_pct);
            kg = Math.round(Math.max(25, Math.min(3000, kg)));

            const cost = Math.round(kg * m.costPerKg);
            totalWeightKg += kg;

            weightedN += (kg * (m.N / 100) * dryMatterFraction);
            weightedP += (kg * (m.P / 100) * dryMatterFraction);
            weightedK += (kg * (m.K / 100) * dryMatterFraction);
            weightedCN += (kg * m.CN);

            blend.push({
                material_id: selected_materials[idx],
                name: m.name,
                kg: kg,
                percentage: 0, // computed below
                cost_inr: cost,
                moisture: m.moisture,
                c_n_ratio: m.CN,
                npk_ratio: `${m.N}-${m.P}-${m.K}`
            });
        });

        // Compute blend percentages
        blend.forEach(b => {
            b.percentage = Math.round((b.kg / (totalWeightKg || 1)) * 100);
        });

        const overallCN = parseFloat((weightedCN / (totalWeightKg || 1)).toFixed(1));
        const totalCost = blend.reduce((acc, b) => acc + b.cost_inr, 0);

        // C:N Ratio Diagnostic according to P25 spec
        let cnDiagnosis = { status: 'optimal', title: 'Balanced C:N Ratio (20:1 - 30:1)', message: 'Optimal microbial mineralization. Nutrients will be steadily released without robbing soil nitrogen.' };
        if (overallCN > 32) {
            cnDiagnosis = {
                status: 'warning_high_cn',
                title: 'High C:N Ratio (> 30:1) — Nitrogen Immobilization Risk!',
                message: 'Warning: Soil microorganisms will consume available nitrogen to break down excessive carbon, causing temporary nitrogen deficiency (yellowing) in crops. Recommendation: Add nitrogen-rich greens like Poultry Manure, Neem Cake, or Green Manure to balance.'
            };
        } else if (overallCN < 16) {
            cnDiagnosis = {
                status: 'warning_low_cn',
                title: 'Low C:N Ratio (< 16:1) — Volatilization / Leaching Risk!',
                message: 'Warning: Nitrogen mineralization is too rapid. Excess ammonia may volatilize into the air or leach into groundwater before crop root uptake. Recommendation: Blend with carbon-rich browns such as Biochar or mature compost residue.'
            };
        }

        // 12-Week Usable Nutrient Release Timeline (Curve)
        const timeline = [];
        for (let week = 1; week <= 12; week++) {
            // Sigmoid / saturation mineralization model
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
            growth_stage,
            acreage,
            decomposition_stage: decompLabel,
            calculated_cn_ratio: overallCN,
            cn_diagnosis: cnDiagnosis,
            total_recipe_kg: totalWeightKg,
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
                timing: 'Apply 65% as basal dressing during land prep / furrow opening. Top-dress remaining 35% at 30-40 days after sowing before irrigation.'
            },
            release_timeline: timeline
        };

        // Save to DB
        database.saveFertilizerRecipe({
            crop_name: cropReq.name,
            growth_stage,
            acreage,
            calculated_cn: overallCN,
            decomp_stage,
            moisture_pct,
            recipe_json: blend,
            total_kg: totalWeightKg,
            estimated_cost: totalCost,
            release_timeline_json: timeline
        });

        res.json({ success: true, calculation: result });
    } catch (err) {
        console.error('Organic calculator error:', err);
        res.status(500).json({ error: 'Calculation failed: ' + err.message });
    }
});

// =============================================
// NEXT CROP RECOMMENDATION ENGINE (Crop Rotation AI)
// =============================================
app.get('/api/farm/crop-recommendation', requireAuth, (req, res) => {
    try {
        const sectors = database.getFarmSectors();
        // Analyze current soil state
        const avgN = sectors.reduce((a, s) => a + s.soil_nitrogen, 0) / (sectors.length || 1);
        const avgP = sectors.reduce((a, s) => a + s.soil_phosphorus, 0) / (sectors.length || 1);
        const avgK = sectors.reduce((a, s) => a + s.soil_potassium, 0) / (sectors.length || 1);
        const avgPh = sectors.reduce((a, s) => a + s.soil_ph, 0) / (sectors.length || 1);

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

        res.json({
            current_soil_assessment: {
                avg_nitrogen: Math.round(avgN),
                avg_phosphorus: Math.round(avgP),
                avg_potassium: Math.round(avgK),
                avg_ph: parseFloat(avgPh.toFixed(1)),
                primary_deficiency: avgN < 130 ? 'Nitrogen (Depleted)' : (avgK < 150 ? 'Potassium' : 'Balanced')
            },
            recommended_rotation: recommendations
        });
    } catch (err) { res.status(500).json({ error: 'Failed to generate crop recommendation' }); }
});

// =============================================
// WEATHER FORECASTING & SMART IRRIGATION API
// =============================================
let irrigationValveActive = false;
app.get('/api/farm/weather-irrigation', requireAuth, (req, res) => {
    try {
        const sectors = database.getFarmSectors();
        const avgMoist = Math.round(sectors.reduce((a, s) => a + s.moisture, 0) / (sectors.length || 1));

        // Simulated high-precision agro-meteorological forecast
        const weather = {
            current: {
                temperature_c: 27.4,
                humidity_pct: 64,
                wind_speed_kmh: 11.2,
                rainfall_prob_12h: 68, // High rain probability!
                evapotranspiration_et0: 4.2, // mm/day
                solar_radiation_wm2: 680,
                uv_index: 6,
                barometer_hpa: 1012,
                condition: 'Scattered Clouds & Approaching Monsoon Front'
            },
            forecast_5day: [
                { day: 'Today', temp_max: 29, temp_min: 22, rain_prob: 68, condition: 'Light Rain Showers (4-8mm)' },
                { day: 'Tomorrow', temp_max: 28, temp_min: 21, rain_prob: 85, condition: 'Moderate Rainfall (18-25mm)' },
                { day: 'Friday', temp_max: 30, temp_min: 23, rain_prob: 30, condition: 'Partly Cloudy' },
                { day: 'Saturday', temp_max: 31, temp_min: 24, rain_prob: 15, condition: 'Sunny & Dry' },
                { day: 'Sunday', temp_max: 32, temp_min: 24, rain_prob: 20, condition: 'Clear Sky' }
            ],
            irrigation_status: {
                valve_active: irrigationValveActive,
                field_avg_moisture: avgMoist,
                critical_threshold: 35,
                optimal_target: 65,
                rain_delay_active: true,
                rain_delay_reason: '🌧️ Rain predicted in next 12h (68% chance, 18-25mm rainfall expected). Irrigation paused automatically to conserve water and prevent root waterlogging.',
                next_filtration_flush: 'Tomorrow 06:30 AM (Disc Filter #2)'
            },
            crop_health_condition: {
                overall_ndvi_index: 0.78, // 0.0 - 1.0 (Healthy green biomass)
                chlorosis_risk: 'Low (Sector C has slight nitrogen chlorosis)',
                fungal_blight_risk: 'Moderate (Warm humidity triggers fungal spore germination: avoid evening sprinkler irrigation)'
            }
        };

        res.json(weather);
    } catch (err) { res.status(500).json({ error: 'Failed to get weather data' }); }
});

app.post('/api/farm/irrigation/toggle', requireAuth, (req, res) => {
    try {
        const { active, sector_id } = req.body;
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
        - Goal: Assist the farmer or pilot in monitoring robot health, optimizing organic fertilizer recipes, targeting weeds/pests with the laser, and executing farm operations.`;

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

