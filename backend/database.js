// =============================================
// DynoRex X1 - Database Module (SQLite + better-sqlite3)
// Multi-Mode Autonomous Robotic System
// =============================================

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'database', 'dynorex.db');
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// =============================================
// INIT DATABASE
// =============================================
function initDatabase() {
    // Users table
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            full_name TEXT DEFAULT '',
            email TEXT DEFAULT '',
            phone TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME
        )
    `);

    // OTP table
    db.exec(`
        CREATE TABLE IF NOT EXISTS otp_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            otp_code TEXT NOT NULL,
            expires_at DATETIME NOT NULL,
            used INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    // Robot state table (multi-mode)
    db.exec(`
        CREATE TABLE IF NOT EXISTS robot_state (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            active_mode TEXT DEFAULT 'farmer',
            operating_mode TEXT DEFAULT 'Manual',
            robot_x REAL DEFAULT 25,
            robot_y REAL DEFAULT 25,
            location TEXT DEFAULT 'A',
            battery REAL DEFAULT 100,
            speed REAL DEFAULT 0,
            heading REAL DEFAULT 0,
            gps_lat REAL DEFAULT 19.0760,
            gps_lng REAL DEFAULT 72.8777,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Sensor data table
    db.exec(`
        CREATE TABLE IF NOT EXISTS sensor_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            temperature REAL DEFAULT 0,
            humidity REAL DEFAULT 0,
            moisture REAL DEFAULT 0,
            soil_ph REAL DEFAULT 7.0,
            wind_speed REAL DEFAULT 0,
            uv_index REAL DEFAULT 0,
            ultrasonic_dist REAL DEFAULT 999,
            ir_left INTEGER DEFAULT 0,
            ir_right INTEGER DEFAULT 0,
            battery REAL DEFAULT 100,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Logs table
    db.exec(`
        CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            action TEXT NOT NULL,
            type TEXT NOT NULL DEFAULT 'system',
            mode TEXT DEFAULT 'general',
            message TEXT DEFAULT '',
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    // Deliveries table
    db.exec(`
        CREATE TABLE IF NOT EXISTS deliveries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT UNIQUE NOT NULL,
            sender TEXT NOT NULL,
            receiver TEXT NOT NULL,
            pickup_location TEXT NOT NULL,
            dropoff_location TEXT NOT NULL,
            pickup_lat REAL DEFAULT 0,
            pickup_lng REAL DEFAULT 0,
            dropoff_lat REAL DEFAULT 0,
            dropoff_lng REAL DEFAULT 0,
            weight_kg REAL DEFAULT 0,
            status TEXT DEFAULT 'pending',
            priority TEXT DEFAULT 'normal',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            picked_at DATETIME,
            delivered_at DATETIME,
            notes TEXT DEFAULT ''
        )
    `);

    // Campus locations table
    db.exec(`
        CREATE TABLE IF NOT EXISTS campus_locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT DEFAULT '',
            category TEXT DEFAULT 'building',
            loc_x REAL DEFAULT 50,
            loc_y REAL DEFAULT 50,
            gps_lat REAL DEFAULT 0,
            gps_lng REAL DEFAULT 0,
            image_url TEXT DEFAULT '',
            is_active INTEGER DEFAULT 1
        )
    `);

    // Campus tours table
    db.exec(`
        CREATE TABLE IF NOT EXISTS campus_tours (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tour_name TEXT NOT NULL,
            visitor_name TEXT DEFAULT 'Guest',
            locations TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            current_stop INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            started_at DATETIME,
            completed_at DATETIME
        )
    `);

    // GPS Waypoints table
    db.exec(`
        CREATE TABLE IF NOT EXISTS waypoints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            lat REAL NOT NULL,
            lng REAL NOT NULL,
            mode TEXT DEFAULT 'gps',
            sequence_order INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1
        )
    `);

    // Farm sectors
    db.exec(`
        CREATE TABLE IF NOT EXISTS farm_sectors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sector_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            status TEXT DEFAULT 'healthy',
            crop TEXT DEFAULT '',
            crop_stage TEXT DEFAULT 'Vegetative',
            days_to_harvest INTEGER DEFAULT 45,
            moisture REAL DEFAULT 50,
            health REAL DEFAULT 95,
            soil_nitrogen REAL DEFAULT 140,
            soil_phosphorus REAL DEFAULT 24,
            soil_potassium REAL DEFAULT 160,
            soil_ph REAL DEFAULT 6.5,
            organic_matter REAL DEFAULT 1.8,
            ec_salinity REAL DEFAULT 0.8,
            fertilizer_status TEXT DEFAULT 'optimal',
            recommended_fertilizer TEXT DEFAULT 'Compost + Neem Cake (2:1)',
            last_irrigated DATETIME,
            last_patrolled DATETIME
        )
    `);

    // Ensure columns exist if table was already created earlier
    const sectorCols = [
        ['crop_stage', "TEXT DEFAULT 'Vegetative'"],
        ['days_to_harvest', 'INTEGER DEFAULT 45'],
        ['soil_nitrogen', 'REAL DEFAULT 140'],
        ['soil_phosphorus', 'REAL DEFAULT 24'],
        ['soil_potassium', 'REAL DEFAULT 160'],
        ['soil_ph', 'REAL DEFAULT 6.5'],
        ['organic_matter', 'REAL DEFAULT 1.8'],
        ['ec_salinity', 'REAL DEFAULT 0.8'],
        ['fertilizer_status', "TEXT DEFAULT 'optimal'"],
        ['recommended_fertilizer', "TEXT DEFAULT 'Compost + Neem Cake'"]
    ];
    for (const [col, def] of sectorCols) {
        try { db.exec(`ALTER TABLE farm_sectors ADD COLUMN ${col} ${def}`); } catch (_) {}
    }

    // Farm Robot Patrol & Cleaning Stats
    db.exec(`
        CREATE TABLE IF NOT EXISTS farm_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            distance_km REAL DEFAULT 6.4,
            cleared_acres REAL DEFAULT 3.2,
            weeds_killed INTEGER DEFAULT 89,
            pests_killed INTEGER DEFAULT 53,
            battery_soh REAL DEFAULT 98.4,
            battery_voltage REAL DEFAULT 12.4,
            battery_temp REAL DEFAULT 29.5,
            energy_efficiency REAL DEFAULT 1.85,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Laser Weed & Pest Targeting Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS laser_targets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            target_type TEXT NOT NULL,
            species_name TEXT NOT NULL,
            sector_id TEXT DEFAULT 'A',
            coord_x REAL DEFAULT 0,
            coord_y REAL DEFAULT 0,
            coord_z REAL DEFAULT 0,
            laser_wattage REAL DEFAULT 12.0,
            pulse_ms INTEGER DEFAULT 350,
            energy_joules REAL DEFAULT 4.2,
            status TEXT DEFAULT 'neutralized',
            kill_confidence REAL DEFAULT 98.5,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Unauthorized Invader / Perimeter Security Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS invader_alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invader_type TEXT NOT NULL,
            sector_id TEXT DEFAULT 'B',
            severity TEXT DEFAULT 'high',
            deterrent_action TEXT DEFAULT 'Acoustic Siren (110dB) + Strobe Sweep',
            is_active INTEGER DEFAULT 1,
            detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            resolved_at DATETIME
        )
    `);

    // Farm Schedules (Harvest, Drip Filtration, Fertilizer Dumping, Maintenance)
    db.exec(`
        CREATE TABLE IF NOT EXISTS farm_schedules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            schedule_type TEXT NOT NULL,
            title TEXT NOT NULL,
            due_date TEXT NOT NULL,
            target_sector TEXT DEFAULT 'All',
            details TEXT DEFAULT '',
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Problem P25: Saved Organic Fertilizer & Compost Calculations
    db.exec(`
        CREATE TABLE IF NOT EXISTS fertilizer_recipes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            crop_name TEXT NOT NULL,
            growth_stage TEXT NOT NULL,
            acreage REAL DEFAULT 1.0,
            calculated_cn REAL DEFAULT 26.5,
            decomp_stage TEXT DEFAULT 'Semi-decomposed',
            moisture_pct REAL DEFAULT 35,
            recipe_json TEXT NOT NULL,
            total_kg REAL NOT NULL,
            estimated_cost REAL NOT NULL,
            release_timeline_json TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Farm Advisory Feed Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS farm_advisories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL DEFAULT 'general',
            severity TEXT NOT NULL DEFAULT 'info',
            title TEXT NOT NULL,
            action TEXT DEFAULT '',
            sector_id TEXT DEFAULT 'All',
            source TEXT DEFAULT 'system',
            dismissed INTEGER DEFAULT 0,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Crop Health Scan History Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS crop_health_scans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sector_id TEXT DEFAULT 'A',
            vigor_index REAL DEFAULT 0,
            green_ratio REAL DEFAULT 0,
            red_ratio REAL DEFAULT 0,
            blue_ratio REAL DEFAULT 0,
            disease_label TEXT DEFAULT 'unknown',
            disease_confidence REAL DEFAULT 0,
            scan_source TEXT DEFAULT 'camera',
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Environmental Risk Events Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS env_risk_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            risk_type TEXT NOT NULL,
            level TEXT DEFAULT 'low',
            detail TEXT DEFAULT '',
            triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            resolved_at DATETIME
        )
    `);

    // Seed defaults
    seedDefaults();
    console.log('✅ Database initialized successfully');
}

function seedDefaults() {
    // Default users
    const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get();
    if (userCount.c === 0) {
        const adminHash = bcrypt.hashSync('admin123', 10);
        const userHash = bcrypt.hashSync('user123', 10);
        db.prepare('INSERT INTO users (username, password, role, full_name, email, phone) VALUES (?, ?, ?, ?, ?, ?)').run('admin', adminHash, 'admin', 'System Administrator', 'admin@dynorex.io', '9999999999');
        db.prepare('INSERT INTO users (username, password, role, full_name, email, phone) VALUES (?, ?, ?, ?, ?, ?)').run('user', userHash, 'user', 'DynoRex Operator', 'user@dynorex.io', '8888888888');
        console.log('  → Default users created');
    }

    // Default robot state
    const robotCount = db.prepare('SELECT COUNT(*) as c FROM robot_state').get();
    if (robotCount.c === 0) {
        db.prepare('INSERT INTO robot_state (active_mode, operating_mode, robot_x, robot_y, location, battery) VALUES (?, ?, ?, ?, ?, ?)').run('farmer', 'Manual', 25, 25, 'A', 100);
    }

    // Default farm sectors (6 rich sectors with realistic NPK, pH, organic matter, and deficits)
    const sectorCount = db.prepare('SELECT COUNT(*) as c FROM farm_sectors').get();
    if (sectorCount.c < 6) {
        db.prepare('DELETE FROM farm_sectors').run();
        const sectors = [
            ['A', 'Sector Alpha (North-East)', 'healthy', 'Wheat (HD-2967)', 'Vegetative', 42, 58, 96, 175, 26, 185, 6.7, 2.1, 0.65, 'optimal', 'Balanced Vermicompost (200 kg/ha)'],
            ['B', 'Sector Bravo (North-West)', 'warning', 'Paddy (Basmati 1121)', 'Tillering', 65, 42, 82, 110, 18, 140, 6.2, 1.4, 0.72, 'needs_nitrogen', 'High-N Poultry Manure + Neem Cake (60:40) - 350 kg/ha'],
            ['C', 'Sector Charlie (Central)', 'critical', 'Cotton (Bt-II)', 'Flowering', 52, 26, 68, 85, 14, 115, 7.8, 1.1, 1.25, 'critical_deficit', 'Rapid Organic Booster: FYM + Mustard Cake + Bone Meal (500 kg/ha)'],
            ['D', 'Sector Delta (South-East)', 'healthy', 'Soybean (JS-335)', 'Pod Formation', 38, 54, 94, 160, 24, 170, 6.5, 2.4, 0.58, 'optimal', 'Rhizobium Bio-fertilizer + Compost (150 kg/ha)'],
            ['E', 'Sector Echo (South-West)', 'warning', 'Maize (HQPM-1)', 'Silking', 48, 34, 79, 125, 16, 130, 6.9, 1.3, 0.85, 'needs_potassium', 'Wood Ash (Potash Rich) + Vermicompost (250 kg/ha)'],
            ['F', 'Sector Foxtrot (Perimeter Ridge)', 'healthy', 'Chickpea / Gram', 'Vegetative', 75, 48, 91, 150, 28, 195, 7.1, 1.9, 0.60, 'optimal', 'Decomposed Farmyard Manure (FYM) Maintenance']
        ];
        const stmt = db.prepare(`
            INSERT INTO farm_sectors (
                sector_id, name, status, crop, crop_stage, days_to_harvest, moisture, health,
                soil_nitrogen, soil_phosphorus, soil_potassium, soil_ph, organic_matter, ec_salinity,
                fertilizer_status, recommended_fertilizer, last_irrigated, last_patrolled
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `);
        sectors.forEach(s => stmt.run(...s));
    }

    // Default Farm Robot Stats
    const statsCount = db.prepare('SELECT COUNT(*) as c FROM farm_stats').get();
    if (statsCount.c === 0) {
        db.prepare(`
            INSERT INTO farm_stats (distance_km, cleared_acres, weeds_killed, pests_killed, battery_soh, battery_voltage, battery_temp, energy_efficiency)
            VALUES (6.84, 3.45, 142, 67, 98.4, 12.55, 28.4, 1.72)
        `).run();
    }

    // Default Laser Targets History
    const laserCount = db.prepare('SELECT COUNT(*) as c FROM laser_targets').get();
    if (laserCount.c === 0) {
        const targets = [
            ['weed', 'Parthenium hysterophorus (Congress Grass)', 'C', 14.2, 8.5, 0.35, 15.0, 420, 6.3, 'neutralized', 99.1],
            ['pest', 'Spodoptera frugiperda (Fall Armyworm)', 'B', 8.7, 12.3, 0.82, 10.0, 280, 2.8, 'neutralized', 97.8],
            ['weed', 'Cyperus rotundus (Nut Grass)', 'C', 22.1, 19.4, 0.28, 12.5, 360, 4.5, 'neutralized', 98.4],
            ['pest', 'Helicoverpa armigera (Cotton Bollworm)', 'C', 18.3, 14.6, 0.75, 14.0, 310, 4.3, 'neutralized', 96.9],
            ['pest', 'Aphis gossypii (Cotton Aphid Colony)', 'E', 5.6, 21.0, 0.45, 8.5, 190, 1.6, 'neutralized', 99.4]
        ];
        const stmt = db.prepare(`
            INSERT INTO laser_targets (target_type, species_name, sector_id, coord_x, coord_y, coord_z, laser_wattage, pulse_ms, energy_joules, status, kill_confidence)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        targets.forEach(t => stmt.run(...t));
    }

    // Default Invader / Perimeter Security Alerts
    const invCount = db.prepare('SELECT COUNT(*) as c FROM invader_alerts').get();
    if (invCount.c === 0) {
        db.prepare(`
            INSERT INTO invader_alerts (invader_type, sector_id, severity, deterrent_action, is_active)
            VALUES ('Wild Boar (Sus scrofa Sounder)', 'C', 'high', 'Acoustic Siren 110dB + High-Lux Strobe + Boundary Sweep', 1)
        `).run();
        db.prepare(`
            INSERT INTO invader_alerts (invader_type, sector_id, severity, deterrent_action, is_active, resolved_at)
            VALUES ('Stray Cattle (Bos taurus)', 'E', 'medium', 'Ultrasonic Frequency Deterrent Pulse', 0, CURRENT_TIMESTAMP)
        `).run();
    }

    // Default Farm Operational Schedules
    const schedCount = db.prepare('SELECT COUNT(*) as c FROM farm_schedules').get();
    if (schedCount.c === 0) {
        const schedules = [
            ['harvest', '🌾 Harvest: Wheat HD-2967 (Sector A)', '2026-10-24', 'A', 'Maturity stage estimated at 92%. Grain moisture ideal at 13-14%.'],
            ['filtration', '💧 Drip Irrigation Sand & Disc Filter Flush', 'Tomorrow 06:30 AM', 'All', 'Automatic backwash cycle after 16.4 m³ filtered volume.'],
            ['fertilizer', '⏰ Fertilizer Dumping: Organic Composite', 'Thursday 08:00 AM', 'C', 'Apply 350kg/ha Basal Compost + Neem Cake mix before scheduled drip run.'],
            ['maintenance', '🛠️ Scheduled Robot Preventative Maintenance', '2026-09-16', 'Base', 'Inspect optical laser protective lens, calibrate soil NPK conductivity probes, lube wheel bearings.']
        ];
        const stmt = db.prepare(`
            INSERT INTO farm_schedules (schedule_type, title, due_date, target_sector, details)
            VALUES (?, ?, ?, ?, ?)
        `);
        schedules.forEach(s => stmt.run(...s));
    }

    // Default deliveries
    const delCount = db.prepare('SELECT COUNT(*) as c FROM deliveries').get();
    if (delCount.c === 0) {
        const deliveries = [
            ['DRX-001', 'Admin Block', 'Library', 'Block A', 'Block D', 19.0760, 72.8777, 19.0780, 72.8800, 2.5, 'in_transit', 'high', 'Urgent documents'],
            ['DRX-002', 'Lab Complex', 'Hostel B', 'Block B', 'Hostel Area', 19.0765, 72.8780, 19.0790, 72.8810, 1.2, 'pending', 'normal', 'Lab equipment sample'],
            ['DRX-003', 'Canteen', 'Sports Ground', 'Canteen', 'Sports Block', 19.0770, 72.8785, 19.0795, 72.8815, 3.0, 'delivered', 'normal', 'Refreshments delivery'],
            ['DRX-004', 'Main Gate', 'Admin Block', 'Gate', 'Block A', 19.0755, 72.8770, 19.0760, 72.8777, 0.5, 'pending', 'low', 'Courier package']
        ];
        const stmt = db.prepare('INSERT INTO deliveries (order_id, sender, receiver, pickup_location, dropoff_location, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, weight_kg, status, priority, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        deliveries.forEach(d => stmt.run(...d));
    }

    // Default campus locations
    const locCount = db.prepare('SELECT COUNT(*) as c FROM campus_locations').get();
    if (locCount.c === 0) {
        const locs = [
            ['Admin Block', 'Main administration office and reception', 'building', 20, 20, 19.0760, 72.8777],
            ['Library', 'Central library with digital resources', 'building', 80, 20, 19.0765, 72.8785],
            ['Lab Complex', 'Engineering and science laboratories', 'building', 20, 50, 19.0770, 72.8780],
            ['Auditorium', 'Multi-purpose event hall (500 seats)', 'building', 80, 50, 19.0775, 72.8790],
            ['Sports Ground', 'Athletic track and sports facilities', 'outdoor', 50, 80, 19.0780, 72.8795],
            ['Canteen', 'Student dining area and food court', 'facility', 50, 20, 19.0763, 72.8782],
            ['Hostel Area', 'Student residential blocks', 'building', 20, 80, 19.0785, 72.8800],
            ['Parking Zone', 'Vehicle parking and charging station', 'facility', 80, 80, 19.0790, 72.8805]
        ];
        const stmt = db.prepare('INSERT INTO campus_locations (name, description, category, loc_x, loc_y, gps_lat, gps_lng) VALUES (?, ?, ?, ?, ?, ?, ?)');
        locs.forEach(l => stmt.run(...l));
    }
}

// =============================================
// USER OPERATIONS
// =============================================
function findUserByUsername(username) { return db.prepare('SELECT * FROM users WHERE username = ?').get(username); }
function findUserById(id) { return db.prepare('SELECT id, username, role, full_name, email, created_at, last_login FROM users WHERE id = ?').get(id); }
function findUserByEmail(email) { return db.prepare('SELECT * FROM users WHERE email = ?').get(email); }
function getAllUsers() { return db.prepare('SELECT id, username, role, full_name, email, created_at, last_login FROM users ORDER BY created_at DESC').all(); }

function createUser(username, password, role, fullName, email) {
    const hash = bcrypt.hashSync(password, 10);
    try {
        const result = db.prepare('INSERT INTO users (username, password, role, full_name, email) VALUES (?, ?, ?, ?, ?)').run(username, hash, role, fullName || '', email || '');
        return { success: true, id: result.lastInsertRowid };
    } catch (err) {
        if (err.message.includes('UNIQUE')) return { success: false, error: 'Username already exists' };
        return { success: false, error: err.message };
    }
}

function updateUser(id, data) {
    try {
        if (data.password) {
            const hash = bcrypt.hashSync(data.password, 10);
            db.prepare('UPDATE users SET username=?, role=?, full_name=?, email=?, phone=?, password=? WHERE id=?').run(data.username, data.role, data.full_name || '', data.email || '', data.phone || '', hash, id);
        } else {
            db.prepare('UPDATE users SET username=?, role=?, full_name=?, email=?, phone=? WHERE id=?').run(data.username, data.role, data.full_name || '', data.email || '', data.phone || '', id);
        }
        return { success: true };
    } catch (err) { return { success: false, error: err.message }; }
}

function updatePassword(userId, newPassword) {
    try {
        const hash = bcrypt.hashSync(newPassword, 10);
        db.prepare('UPDATE users SET password=? WHERE id=?').run(hash, userId);
        return { success: true };
    } catch (err) { return { success: false, error: err.message }; }
}

function deleteUser(id) {
    try { db.prepare('DELETE FROM users WHERE id=?').run(id); return { success: true }; }
    catch (err) { return { success: false, error: err.message }; }
}

function updateLastLogin(id) { db.prepare('UPDATE users SET last_login=? WHERE id=?').run(new Date().toISOString(), id); }
function verifyPassword(plain, hashed) { return bcrypt.compareSync(plain, hashed); }

// =============================================
// OTP OPERATIONS
// =============================================
function generateOTP(userId) {
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    db.prepare('UPDATE otp_codes SET used=1 WHERE user_id=? AND used=0').run(userId);
    db.prepare('INSERT INTO otp_codes (user_id, otp_code, expires_at) VALUES (?, ?, ?)').run(userId, otp, expiresAt);
    return otp;
}

function verifyOTP(userId, otpCode) {
    const record = db.prepare("SELECT * FROM otp_codes WHERE user_id=? AND otp_code=? AND used=0 AND expires_at > datetime('now') ORDER BY created_at DESC LIMIT 1").get(userId, otpCode);
    if (record) { db.prepare('UPDATE otp_codes SET used=1 WHERE id=?').run(record.id); return true; }
    return false;
}

// =============================================
// SENSOR DATA
// =============================================
function saveSensorData(data) {
    return db.prepare('INSERT INTO sensor_data (temperature, humidity, moisture, soil_ph, wind_speed, uv_index, ultrasonic_dist, ir_left, ir_right, battery) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
        data.temperature || 0, data.humidity || 0, data.moisture || 0, data.soil_ph || 7.0,
        data.wind_speed || 0, data.uv_index || 0, data.ultrasonic_dist || 999,
        data.ir_left || 0, data.ir_right || 0, data.battery || 100
    );
}

function getLatestSensorData() { return db.prepare('SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 1').get(); }
function getSensorHistory(limit = 50) { return db.prepare('SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT ?').all(limit); }

// =============================================
// LOGS
// =============================================
function addLog(userId, action, type, message, mode) {
    return db.prepare('INSERT INTO logs (user_id, action, type, message, mode) VALUES (?, ?, ?, ?, ?)').run(userId || null, action, type, message, mode || 'general');
}

function getLogs(limit = 100) {
    return db.prepare('SELECT logs.*, users.username FROM logs LEFT JOIN users ON logs.user_id = users.id ORDER BY logs.timestamp DESC LIMIT ?').all(limit);
}

function getLogsByMode(mode, limit = 50) {
    return db.prepare('SELECT * FROM logs WHERE mode=? ORDER BY timestamp DESC LIMIT ?').all(mode, limit);
}

// =============================================
// ROBOT STATE
// =============================================
function getRobotState() { return db.prepare('SELECT * FROM robot_state WHERE id=1').get(); }

function updateRobotState(data) {
    const fields = [];
    const values = [];
    for (const [key, val] of Object.entries(data)) {
        if (key !== 'id') { fields.push(`${key}=?`); values.push(val); }
    }
    fields.push('updated_at=CURRENT_TIMESTAMP');
    values.push(1);
    return db.prepare(`UPDATE robot_state SET ${fields.join(', ')} WHERE id=?`).run(...values);
}

// =============================================
// FARM SECTORS & INTELLIGENCE
// =============================================
function getFarmSectors() { return db.prepare('SELECT * FROM farm_sectors ORDER BY sector_id').all(); }
function getFarmSectorById(sectorId) { return db.prepare('SELECT * FROM farm_sectors WHERE sector_id=?').get(sectorId); }

function updateFarmSector(sectorId, data) {
    const fields = [];
    const vals = [];
    for (const [key, val] of Object.entries(data)) {
        if (key !== 'id' && key !== 'sector_id') {
            fields.push(`${key}=?`);
            vals.push(val);
        }
    }
    fields.push('last_patrolled=CURRENT_TIMESTAMP');
    vals.push(sectorId);
    return db.prepare(`UPDATE farm_sectors SET ${fields.join(', ')} WHERE sector_id=?`).run(...vals);
}

function scanFarmSector(sectorId) {
    const sector = getFarmSectorById(sectorId);
    if (!sector) return null;
    const n = Math.max(60, Math.min(240, Math.round(sector.soil_nitrogen + (Math.random() - 0.45) * 14)));
    const p = Math.max(10, Math.min(50, Math.round(sector.soil_phosphorus + (Math.random() - 0.5) * 4)));
    const k = Math.max(80, Math.min(260, Math.round(sector.soil_potassium + (Math.random() - 0.5) * 12)));
    const ph = parseFloat((Math.max(5.5, Math.min(8.5, sector.soil_ph + (Math.random() - 0.5) * 0.15))).toFixed(1));
    const moisture = Math.max(15, Math.min(90, Math.round(sector.moisture + (Math.random() - 0.5) * 6)));
    const om = parseFloat((Math.max(0.6, Math.min(3.5, sector.organic_matter + (Math.random() - 0.5) * 0.1))).toFixed(1));

    let status = 'healthy';
    let fertStatus = 'optimal';
    let rec = 'Soil balanced: Routine vermicompost application.';
    if (n < 100) {
        status = 'critical';
        fertStatus = 'critical_deficit';
        rec = 'Severe Nitrogen Deficit! Apply High-N Organic Booster (Mustard Cake + FYM 450 kg/ha).';
    } else if (n < 130) {
        status = 'warning';
        fertStatus = 'needs_nitrogen';
        rec = 'Nitrogen sub-optimal. Apply Poultry Manure + Neem Cake (60:40) - 300 kg/ha.';
    } else if (k < 140) {
        status = 'warning';
        fertStatus = 'needs_potassium';
        rec = 'Potassium low. Supplement with Potash-rich Wood Ash + Biochar.';
    }

    db.prepare(`
        UPDATE farm_sectors 
        SET soil_nitrogen=?, soil_phosphorus=?, soil_potassium=?, soil_ph=?, moisture=?, organic_matter=?, status=?, fertilizer_status=?, recommended_fertilizer=?, last_patrolled=CURRENT_TIMESTAMP
        WHERE sector_id=?
    `).run(n, p, k, ph, moisture, om, status, fertStatus, rec, sectorId);

    return getFarmSectorById(sectorId);
}

// Farm Stats & Mileage
function getFarmStats() {
    let stats = db.prepare('SELECT * FROM farm_stats ORDER BY id DESC LIMIT 1').get();
    if (!stats) {
        db.prepare('INSERT INTO farm_stats (distance_km, cleared_acres, weeds_killed, pests_killed) VALUES (6.84, 3.45, 142, 67)').run();
        stats = db.prepare('SELECT * FROM farm_stats ORDER BY id DESC LIMIT 1').get();
    }
    return stats;
}

function updateFarmStats(data) {
    const fields = [];
    const vals = [];
    for (const [k, v] of Object.entries(data)) {
        if (k !== 'id') { fields.push(`${k}=?`); vals.push(v); }
    }
    fields.push('updated_at=CURRENT_TIMESTAMP');
    return db.prepare(`UPDATE farm_stats SET ${fields.join(', ')} WHERE id=1`).run(...vals);
}

function recordLaserZap(targetType, species, sectorId, energyJoules = 4.2) {
    const col = targetType === 'weed' ? 'weeds_killed' : 'pests_killed';
    db.prepare(`UPDATE farm_stats SET ${col} = ${col} + 1, updated_at=CURRENT_TIMESTAMP WHERE id=1`).run();
    return logLaserTarget({
        target_type: targetType,
        species_name: species,
        sector_id: sectorId || 'A',
        coord_x: parseFloat((Math.random() * 25).toFixed(1)),
        coord_y: parseFloat((Math.random() * 25).toFixed(1)),
        coord_z: parseFloat((0.2 + Math.random() * 0.8).toFixed(2)),
        laser_wattage: targetType === 'weed' ? 15.0 : 10.0,
        pulse_ms: targetType === 'weed' ? 420 : 250,
        energy_joules: energyJoules,
        status: 'neutralized',
        kill_confidence: parseFloat((96.5 + Math.random() * 3.4).toFixed(1))
    });
}

// Laser Targets History
function getLaserTargets(limit = 20) {
    return db.prepare('SELECT * FROM laser_targets ORDER BY created_at DESC LIMIT ?').all(limit);
}

function logLaserTarget(data) {
    const res = db.prepare(`
        INSERT INTO laser_targets (target_type, species_name, sector_id, coord_x, coord_y, coord_z, laser_wattage, pulse_ms, energy_joules, status, kill_confidence)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        data.target_type, data.species_name, data.sector_id || 'A',
        data.coord_x || 0, data.coord_y || 0, data.coord_z || 0,
        data.laser_wattage || 12, data.pulse_ms || 350, data.energy_joules || 4.2,
        data.status || 'neutralized', data.kill_confidence || 98.0
    );
    return { success: true, id: res.lastInsertRowid };
}

// Invader Alerts
function getInvaderAlerts(limit = 20) {
    return db.prepare('SELECT * FROM invader_alerts ORDER BY detected_at DESC LIMIT ?').all(limit);
}

function addInvaderAlert(data) {
    const res = db.prepare(`
        INSERT INTO invader_alerts (invader_type, sector_id, severity, deterrent_action, is_active)
        VALUES (?, ?, ?, ?, 1)
    `).run(data.invader_type, data.sector_id || 'B', data.severity || 'high', data.deterrent_action || 'Acoustic Siren 110dB + Strobe');
    return { success: true, id: res.lastInsertRowid };
}

function triggerInvaderDeterrent(id) {
    db.prepare('UPDATE invader_alerts SET is_active=0, resolved_at=CURRENT_TIMESTAMP WHERE id=?').run(id);
    return { success: true };
}

// Farm Schedules
function getFarmSchedules() {
    return db.prepare('SELECT * FROM farm_schedules ORDER BY id ASC').all();
}

function updateFarmSchedule(id, data) {
    return db.prepare('UPDATE farm_schedules SET title=?, due_date=?, details=?, status=? WHERE id=?').run(
        data.title, data.due_date, data.details || '', data.status || 'pending', id
    );
}

// P25 Fertilizer Recipes
function saveFertilizerRecipe(data) {
    const res = db.prepare(`
        INSERT INTO fertilizer_recipes (crop_name, growth_stage, acreage, calculated_cn, decomp_stage, moisture_pct, recipe_json, total_kg, estimated_cost, release_timeline_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        data.crop_name, data.growth_stage, data.acreage, data.calculated_cn,
        data.decomp_stage, data.moisture_pct, JSON.stringify(data.recipe_json),
        data.total_kg, data.estimated_cost, JSON.stringify(data.release_timeline_json)
    );
    return { success: true, id: res.lastInsertRowid };
}

function getFertilizerRecipes(limit = 10) {
    return db.prepare('SELECT * FROM fertilizer_recipes ORDER BY created_at DESC LIMIT ?').all(limit);
}

// =============================================
// DELIVERIES
// =============================================
function getAllDeliveries() { return db.prepare('SELECT * FROM deliveries ORDER BY created_at DESC').all(); }
function getDeliveryById(id) { return db.prepare('SELECT * FROM deliveries WHERE id=?').get(id); }
function getDeliveriesByStatus(status) { return db.prepare('SELECT * FROM deliveries WHERE status=? ORDER BY created_at DESC').all(status); }

function createDelivery(data) {
    try {
        const orderId = 'DRX-' + String(Date.now()).slice(-6);
        const result = db.prepare('INSERT INTO deliveries (order_id, sender, receiver, pickup_location, dropoff_location, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, weight_kg, status, priority, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
            orderId, data.sender, data.receiver, data.pickup_location, data.dropoff_location,
            data.pickup_lat || 0, data.pickup_lng || 0, data.dropoff_lat || 0, data.dropoff_lng || 0,
            data.weight_kg || 0, 'pending', data.priority || 'normal', data.notes || ''
        );
        return { success: true, id: result.lastInsertRowid, order_id: orderId };
    } catch (err) { return { success: false, error: err.message }; }
}

function updateDeliveryStatus(id, status) {
    const extras = {};
    if (status === 'in_transit') extras.picked_at = new Date().toISOString();
    if (status === 'delivered') extras.delivered_at = new Date().toISOString();
    
    let sql = 'UPDATE deliveries SET status=?';
    const vals = [status];
    if (extras.picked_at) { sql += ', picked_at=?'; vals.push(extras.picked_at); }
    if (extras.delivered_at) { sql += ', delivered_at=?'; vals.push(extras.delivered_at); }
    sql += ' WHERE id=?';
    vals.push(id);
    db.prepare(sql).run(...vals);
    return { success: true };
}

function deleteDelivery(id) {
    try { db.prepare('DELETE FROM deliveries WHERE id=?').run(id); return { success: true }; }
    catch (err) { return { success: false, error: err.message }; }
}

// =============================================
// CAMPUS LOCATIONS & TOURS
// =============================================
function getCampusLocations() { return db.prepare('SELECT * FROM campus_locations WHERE is_active=1 ORDER BY name').all(); }

function getCampusTours() { return db.prepare('SELECT * FROM campus_tours ORDER BY created_at DESC').all(); }

function createCampusTour(data) {
    try {
        const result = db.prepare('INSERT INTO campus_tours (tour_name, visitor_name, locations, status) VALUES (?, ?, ?, ?)').run(
            data.tour_name, data.visitor_name || 'Guest', JSON.stringify(data.locations), 'pending'
        );
        return { success: true, id: result.lastInsertRowid };
    } catch (err) { return { success: false, error: err.message }; }
}

function updateTourStatus(id, status, currentStop) {
    const extras = {};
    if (status === 'active') extras.started_at = new Date().toISOString();
    if (status === 'completed') extras.completed_at = new Date().toISOString();
    
    let sql = 'UPDATE campus_tours SET status=?, current_stop=?';
    const vals = [status, currentStop || 0];
    if (extras.started_at) { sql += ', started_at=?'; vals.push(extras.started_at); }
    if (extras.completed_at) { sql += ', completed_at=?'; vals.push(extras.completed_at); }
    sql += ' WHERE id=?';
    vals.push(id);
    db.prepare(sql).run(...vals);
    return { success: true };
}

// =============================================
// GPS WAYPOINTS
// =============================================
function getWaypoints(mode) { return db.prepare('SELECT * FROM waypoints WHERE mode=? AND is_active=1 ORDER BY sequence_order').all(mode || 'gps'); }

function addWaypoint(data) {
    return db.prepare('INSERT INTO waypoints (name, lat, lng, mode, sequence_order) VALUES (?, ?, ?, ?, ?)').run(
        data.name, data.lat, data.lng, data.mode || 'gps', data.sequence_order || 0
    );
}

// =============================================
// FARM ADVISORIES
// =============================================
function addAdvisory(data) {
    try {
        const res = db.prepare(`
            INSERT INTO farm_advisories (category, severity, title, action, sector_id, source)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(
            data.category || 'general',
            data.severity || 'info',
            data.title,
            data.action || '',
            data.sector_id || 'All',
            data.source || 'system'
        );
        return { success: true, id: res.lastInsertRowid };
    } catch (err) { return { success: false, error: err.message }; }
}

function getAdvisories(limit = 30) {
    return db.prepare('SELECT * FROM farm_advisories WHERE dismissed=0 ORDER BY timestamp DESC LIMIT ?').all(limit);
}

function getAllAdvisories(limit = 50) {
    return db.prepare('SELECT * FROM farm_advisories ORDER BY timestamp DESC LIMIT ?').all(limit);
}

function dismissAdvisory(id) {
    try { db.prepare('UPDATE farm_advisories SET dismissed=1 WHERE id=?').run(id); return { success: true }; }
    catch (err) { return { success: false, error: err.message }; }
}

// =============================================
// CROP HEALTH SCANS
// =============================================
function addCropHealthScan(data) {
    try {
        const res = db.prepare(`
            INSERT INTO crop_health_scans (sector_id, vigor_index, green_ratio, red_ratio, blue_ratio, disease_label, disease_confidence, scan_source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            data.sector_id || 'A',
            parseFloat(data.vigor_index || 0),
            parseFloat(data.green_ratio || 0),
            parseFloat(data.red_ratio || 0),
            parseFloat(data.blue_ratio || 0),
            data.disease_label || 'unknown',
            parseFloat(data.disease_confidence || 0),
            data.scan_source || 'camera'
        );
        return { success: true, id: res.lastInsertRowid };
    } catch (err) { return { success: false, error: err.message }; }
}

function getLatestCropHealthScan(sectorId) {
    if (sectorId) {
        return db.prepare('SELECT * FROM crop_health_scans WHERE sector_id=? ORDER BY timestamp DESC LIMIT 1').get(sectorId);
    }
    return db.prepare('SELECT * FROM crop_health_scans ORDER BY timestamp DESC LIMIT 1').get();
}

function getCropHealthHistory(sectorId, days = 7) {
    const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
    if (sectorId) {
        return db.prepare('SELECT * FROM crop_health_scans WHERE sector_id=? AND timestamp>=? ORDER BY timestamp ASC').all(sectorId, since);
    }
    return db.prepare('SELECT * FROM crop_health_scans WHERE timestamp>=? ORDER BY timestamp ASC').all(since);
}

// =============================================
// ENVIRONMENTAL RISK EVENTS
// =============================================
function addEnvRiskEvent(data) {
    try {
        const res = db.prepare(`
            INSERT INTO env_risk_events (risk_type, level, detail)
            VALUES (?, ?, ?)
        `).run(data.risk_type, data.level || 'low', data.detail || '');
        return { success: true, id: res.lastInsertRowid };
    } catch (err) { return { success: false, error: err.message }; }
}

function getActiveEnvRisks() {
    return db.prepare("SELECT * FROM env_risk_events WHERE resolved_at IS NULL ORDER BY triggered_at DESC LIMIT 10").all();
}

function resolveEnvRisk(riskType) {
    db.prepare("UPDATE env_risk_events SET resolved_at=CURRENT_TIMESTAMP WHERE risk_type=? AND resolved_at IS NULL").run(riskType);
    return { success: true };
}

// =============================================
// EXPORT
// =============================================
module.exports = {
    db, initDatabase,
    findUserByUsername, findUserById, findUserByEmail, getAllUsers,
    createUser, updateUser, updatePassword, deleteUser, updateLastLogin, verifyPassword,
    generateOTP, verifyOTP,
    saveSensorData, getLatestSensorData, getSensorHistory,
    addLog, getLogs, getLogsByMode,
    getRobotState, updateRobotState,
    getFarmSectors, getFarmSectorById, updateFarmSector, scanFarmSector,
    getFarmStats, updateFarmStats, recordLaserZap,
    getLaserTargets, logLaserTarget,
    getInvaderAlerts, addInvaderAlert, triggerInvaderDeterrent,
    getFarmSchedules, updateFarmSchedule,
    saveFertilizerRecipe, getFertilizerRecipes,
    getAllDeliveries, getDeliveryById, getDeliveriesByStatus, createDelivery, updateDeliveryStatus, deleteDelivery,
    getCampusLocations, getCampusTours, createCampusTour, updateTourStatus,
    getWaypoints, addWaypoint,
    addAdvisory, getAdvisories, getAllAdvisories, dismissAdvisory,
    addCropHealthScan, getLatestCropHealthScan, getCropHealthHistory,
    addEnvRiskEvent, getActiveEnvRisks, resolveEnvRisk
};

