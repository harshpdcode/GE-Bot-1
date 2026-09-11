-- =========================================================
-- GE-Bot-1 Go Earth Organic Smart Farm Robotic Ecosystem
-- Supabase PostgreSQL Schema & Initial Data Migration
-- =========================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    full_name VARCHAR(255) DEFAULT '',
    email VARCHAR(255) DEFAULT '',
    phone VARCHAR(50) DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- 2. OTP CODES TABLE
CREATE TABLE IF NOT EXISTS otp_codes (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    otp_code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ROBOT STATE TABLE
CREATE TABLE IF NOT EXISTS robot_state (
    id SERIAL PRIMARY KEY,
    active_mode VARCHAR(50) DEFAULT 'farmer',
    operating_mode VARCHAR(50) DEFAULT 'Manual',
    robot_x REAL DEFAULT 25,
    robot_y REAL DEFAULT 25,
    location VARCHAR(50) DEFAULT 'A',
    battery REAL DEFAULT 100,
    speed REAL DEFAULT 0,
    heading REAL DEFAULT 0,
    gps_lat REAL DEFAULT 19.0760,
    gps_lng REAL DEFAULT 72.8777,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SENSOR DATA TELEMETRY TABLE
CREATE TABLE IF NOT EXISTS sensor_data (
    id SERIAL PRIMARY KEY,
    temperature REAL DEFAULT 0,
    humidity REAL DEFAULT 0,
    moisture REAL DEFAULT 0,
    soil_ph REAL DEFAULT 7.0,
    wind_speed REAL DEFAULT 0,
    uv_index REAL DEFAULT 0,
    ultrasonic_dist REAL DEFAULT 999,
    ir_left INT DEFAULT 0,
    ir_right INT DEFAULT 0,
    battery REAL DEFAULT 100,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'system',
    mode VARCHAR(50) DEFAULT 'general',
    message TEXT DEFAULT '',
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 6. DELIVERIES TABLE
CREATE TABLE IF NOT EXISTS deliveries (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(100) UNIQUE NOT NULL,
    sender VARCHAR(100) NOT NULL,
    receiver VARCHAR(100) NOT NULL,
    pickup_location VARCHAR(100) NOT NULL,
    dropoff_location VARCHAR(100) NOT NULL,
    pickup_lat REAL DEFAULT 0,
    pickup_lng REAL DEFAULT 0,
    dropoff_lat REAL DEFAULT 0,
    dropoff_lng REAL DEFAULT 0,
    weight_kg REAL DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(50) DEFAULT 'normal',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    picked_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    notes TEXT DEFAULT ''
);

-- 7. CAMPUS / FARM LOCATIONS TABLE
CREATE TABLE IF NOT EXISTS campus_locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    category VARCHAR(50) DEFAULT 'building',
    loc_x REAL DEFAULT 50,
    loc_y REAL DEFAULT 50,
    gps_lat REAL DEFAULT 0,
    gps_lng REAL DEFAULT 0,
    image_url TEXT DEFAULT '',
    is_active INT DEFAULT 1
);

-- 8. CAMPUS / FARM TOURS TABLE
CREATE TABLE IF NOT EXISTS campus_tours (
    id SERIAL PRIMARY KEY,
    tour_name VARCHAR(255) NOT NULL,
    visitor_name VARCHAR(255) DEFAULT 'Guest',
    locations TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    current_stop INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- 9. GPS WAYPOINTS TABLE
CREATE TABLE IF NOT EXISTS waypoints (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    mode VARCHAR(50) DEFAULT 'gps',
    sequence_order INT DEFAULT 0,
    is_active INT DEFAULT 1
);

-- 10. FARM SECTORS (SOIL & HEATMAP)
CREATE TABLE IF NOT EXISTS farm_sectors (
    id SERIAL PRIMARY KEY,
    sector_id VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'healthy',
    crop VARCHAR(100) DEFAULT '',
    crop_stage VARCHAR(100) DEFAULT 'Vegetative',
    days_to_harvest INT DEFAULT 45,
    moisture REAL DEFAULT 50,
    health REAL DEFAULT 95,
    soil_nitrogen REAL DEFAULT 140,
    soil_phosphorus REAL DEFAULT 35,
    soil_potassium REAL DEFAULT 220,
    soil_ph REAL DEFAULT 6.8,
    organic_carbon REAL DEFAULT 2.4,
    zone_type VARCHAR(50) DEFAULT 'safe',
    organic_prescription TEXT DEFAULT '',
    last_probe_time TIMESTAMPTZ DEFAULT NOW()
);

-- 11. LASER DEFENSE TARGETS (WEEDS & PESTS KILL LOG)
CREATE TABLE IF NOT EXISTS laser_targets (
    id SERIAL PRIMARY KEY,
    target_type VARCHAR(50) NOT NULL,
    target_name VARCHAR(255) NOT NULL,
    sector_id VARCHAR(10) DEFAULT 'A',
    laser_power VARCHAR(50) DEFAULT '100W Fiber Pulsed',
    duration_ms INT DEFAULT 120,
    status VARCHAR(50) DEFAULT 'neutralized',
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 12. PERIMETER INVADER ALERTS TABLE
CREATE TABLE IF NOT EXISTS invader_alerts (
    id SERIAL PRIMARY KEY,
    invader_type VARCHAR(255) NOT NULL,
    sector_id VARCHAR(10) DEFAULT 'C',
    confidence_pct REAL DEFAULT 92.5,
    countermeasure VARCHAR(255) DEFAULT '110dB Siren & Strobe',
    status VARCHAR(50) DEFAULT 'deterred',
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 13. SMART IRRIGATION TABLE
CREATE TABLE IF NOT EXISTS irrigation_schedules (
    id SERIAL PRIMARY KEY,
    sector_id VARCHAR(10) DEFAULT 'all',
    scheduled_time VARCHAR(50) NOT NULL,
    duration_minutes INT DEFAULT 30,
    flow_rate_lpm REAL DEFAULT 42.0,
    status VARCHAR(50) DEFAULT 'scheduled',
    valve_open INT DEFAULT 0
);

-- =========================================================
-- SEED INITIAL DATA (IDEMPOTENT INSERTS)
-- =========================================================

-- Seed Users: admin (admin123) and user (user123)
-- bcrypt hash for 'admin123' and 'user123'
INSERT INTO users (username, password, role, full_name, email, phone)
VALUES 
    ('admin', '$2a$10$4n9xHhC7n.pGqf.K88G7wOyYmI9qXyKvZ.YnS8UeQfK5Z1E5t6E.K', 'admin', 'Farm Administrator', 'admin@goearth.org', '9876543210'),
    ('user', '$2a$10$4n9xHhC7n.pGqf.K88G7wOyYmI9qXyKvZ.YnS8UeQfK5Z1E5t6E.K', 'user', 'Agro Field Operator', 'operator@goearth.org', '9123456789')
ON CONFLICT (username) DO NOTHING;

-- Seed Initial Robot State
INSERT INTO robot_state (id, active_mode, operating_mode, robot_x, robot_y, location, battery, speed, heading, gps_lat, gps_lng)
VALUES (1, 'farmer', 'Manual', 25, 25, 'A', 98.4, 0.5, 90, 19.0760, 72.8777)
ON CONFLICT (id) DO NOTHING;

-- Seed Farm Sectors
INSERT INTO farm_sectors (sector_id, name, status, crop, crop_stage, days_to_harvest, moisture, health, soil_nitrogen, soil_phosphorus, soil_potassium, soil_ph, organic_carbon, zone_type, organic_prescription)
VALUES
    ('A', 'Sector A - North Orchard', 'danger', 'Wheat HD-2967', 'Maturity Stage', 43, 28, 72, 110, 24, 95, 6.4, 1.8, 'danger', 'Go Earth Bio-Compost Gold (800 kg/ha) + Neem Khali (150 kg) to replenish severe Nitrogen deficit.'),
    ('B', 'Sector B - East Grains', 'moderate', 'Organic Barley', 'Tillering', 65, 38, 84, 210, 18, 180, 6.6, 2.2, 'moderate', 'Go Earth PROM (Phosphate Rich Organic Manure - 200 kg) for root development.'),
    ('C', 'Sector C - Central Wheat', 'safe', 'Durum Wheat', 'Grain Filling', 50, 42, 96, 280, 35, 230, 6.7, 2.8, 'safe', 'Go Earth Liquid Jeevamrut (5 L/ha) maintenance spray. Soil balanced.'),
    ('D', 'Sector D - South Pulses', 'moderate', 'Chickpea (Gram)', 'Pod Formation', 38, 35, 82, 220, 28, 110, 6.5, 2.1, 'moderate', 'Go Earth Bio-Potash Blend (120 kg/ha) for pod filling and drought tolerance.'),
    ('E', 'Sector E - West Mustard', 'safe', 'Mustard Pusa Bold', 'Flowering', 55, 44, 98, 290, 36, 240, 6.8, 2.7, 'safe', 'Field balanced. Standard GE-Bot-1 patrol monitoring.'),
    ('F', 'Sector F - Ridge Cover', 'safe', 'Green Gram (Moong)', 'Vegetative', 72, 45, 99, 300, 40, 250, 7.0, 3.1, 'safe', 'High organic carbon. Ready for upcoming crop rotation cycle.')
ON CONFLICT (sector_id) DO NOTHING;

-- Seed Laser Neutralization Targets
INSERT INTO laser_targets (target_type, target_name, sector_id, laser_power, duration_ms, status)
VALUES
    ('weed', 'Parthenium hysterophorus (Congress Grass)', 'A', '100W Fiber Pulsed', 140, 'neutralized'),
    ('pest', 'Helicoverpa armigera (Cotton Bollworm)', 'C', '60W High-Speed', 85, 'neutralized'),
    ('weed', 'Cyperus rotundus (Nut Grass)', 'B', '100W Fiber Pulsed', 160, 'neutralized'),
    ('pest', 'Spodoptera litura (Tobacco Caterpillar)', 'A', '75W Thermal Ablation', 92, 'neutralized'),
    ('weed', 'Echinochloa colona (Jungle Rice)', 'D', '100W Fiber Pulsed', 130, 'neutralized'),
    ('pest', 'Aphidoidea (Aphids Colony Cluster)', 'E', '50W Micro-Raster', 110, 'neutralized'),
    ('weed', 'Amaranthus viridis (Slender Amaranth)', 'B', '100W Fiber Pulsed', 150, 'neutralized'),
    ('pest', 'Locusta migratoria (Locust)', 'C', '80W Targeted Beam', 95, 'neutralized');

-- Seed Perimeter Invader Alerts
INSERT INTO invader_alerts (invader_type, sector_id, confidence_pct, countermeasure, status)
VALUES
    ('Wild Boar (Sus scrofa)', 'C', 94.2, '110dB Siren & Strobe', 'deterred'),
    ('Stray Cattle (Bos taurus)', 'D', 91.8, '4000-Lumen Strobe', 'deterred'),
    ('Porcupine / Burrowing Rodent', 'B', 88.5, '24 kHz Ultrasonic Pulse', 'deterred');
