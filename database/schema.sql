-- =============================================
-- GE-Bot-1 (Go Earth Smart Farm Robotic Platform)
-- Complete Database Schema (Generated: 2026-09-16T10:34:04.010Z)
-- =============================================

CREATE TABLE campus_locations (
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
        );

CREATE TABLE campus_tours (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tour_name TEXT NOT NULL,
            visitor_name TEXT DEFAULT 'Guest',
            locations TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            current_stop INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            started_at DATETIME,
            completed_at DATETIME
        );

CREATE TABLE deliveries (
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
        );

CREATE TABLE farm_schedules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            schedule_type TEXT NOT NULL,
            title TEXT NOT NULL,
            due_date TEXT NOT NULL,
            target_sector TEXT DEFAULT 'All',
            details TEXT DEFAULT '',
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

CREATE TABLE farm_sectors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sector_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            status TEXT DEFAULT 'healthy',
            crop TEXT DEFAULT '',
            moisture REAL DEFAULT 50,
            health REAL DEFAULT 95,
            last_irrigated DATETIME,
            last_patrolled DATETIME
        , crop_stage TEXT DEFAULT 'Vegetative', days_to_harvest INTEGER DEFAULT 45, soil_nitrogen REAL DEFAULT 140, soil_phosphorus REAL DEFAULT 24, soil_potassium REAL DEFAULT 160, soil_ph REAL DEFAULT 6.5, organic_matter REAL DEFAULT 1.8, ec_salinity REAL DEFAULT 0.8, fertilizer_status TEXT DEFAULT 'optimal', recommended_fertilizer TEXT DEFAULT 'Compost + Neem Cake');

CREATE TABLE farm_stats (
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
        );

CREATE TABLE fertilizer_recipes (
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
        );

CREATE TABLE invader_alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invader_type TEXT NOT NULL,
            sector_id TEXT DEFAULT 'B',
            severity TEXT DEFAULT 'high',
            deterrent_action TEXT DEFAULT 'Acoustic Siren (110dB) + Strobe Sweep',
            is_active INTEGER DEFAULT 1,
            detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            resolved_at DATETIME
        );

CREATE TABLE laser_targets (
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
        );

CREATE TABLE logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            action TEXT NOT NULL,
            type TEXT NOT NULL DEFAULT 'system',
            mode TEXT DEFAULT 'general',
            message TEXT DEFAULT '',
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

CREATE TABLE otp_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            otp_code TEXT NOT NULL,
            expires_at DATETIME NOT NULL,
            used INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

CREATE TABLE robot_state (
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
        );

CREATE TABLE sensor_data (
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
        );

CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            full_name TEXT DEFAULT '',
            email TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME
        );

CREATE TABLE waypoints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            lat REAL NOT NULL,
            lng REAL NOT NULL,
            mode TEXT DEFAULT 'gps',
            sequence_order INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1
        );

