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
            moisture REAL DEFAULT 50,
            health REAL DEFAULT 95,
            last_irrigated DATETIME,
            last_patrolled DATETIME
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

    // Default farm sectors
    const sectorCount = db.prepare('SELECT COUNT(*) as c FROM farm_sectors').get();
    if (sectorCount.c === 0) {
        const sectors = [
            ['A', 'Sector Alpha', 'healthy', 'Wheat', 55, 96],
            ['B', 'Sector Bravo', 'healthy', 'Rice', 62, 92],
            ['C', 'Sector Charlie', 'warning', 'Cotton', 28, 78],
            ['D', 'Sector Delta', 'healthy', 'Soybean', 48, 94]
        ];
        const stmt = db.prepare('INSERT INTO farm_sectors (sector_id, name, status, crop, moisture, health) VALUES (?, ?, ?, ?, ?, ?)');
        sectors.forEach(s => stmt.run(...s));
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
// FARM SECTORS
// =============================================
function getFarmSectors() { return db.prepare('SELECT * FROM farm_sectors ORDER BY sector_id').all(); }

function updateFarmSector(sectorId, data) {
    return db.prepare('UPDATE farm_sectors SET status=?, moisture=?, health=?, last_patrolled=CURRENT_TIMESTAMP WHERE sector_id=?').run(data.status, data.moisture, data.health, sectorId);
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
    getFarmSectors, updateFarmSector,
    getAllDeliveries, getDeliveryById, getDeliveriesByStatus, createDelivery, updateDeliveryStatus, deleteDelivery,
    getCampusLocations, getCampusTours, createCampusTour, updateTourStatus,
    getWaypoints, addWaypoint
};
