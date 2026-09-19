// ============================================================
// DynoRex X1 - Complete Multilingual Translation Engine (i18n)
// Supports all 8 Indian Languages with Dual-Layer Full-DOM Engine:
// 1. English (en)
// 2. हिंदी (hi)
// 3. मराठी (mr)
// 4. ગુજરાતી (gu)
// 5. ਪੰਜਾਬੀ (pa)
// 6. தமிழ் (ta)
// 7. తెలుగు (te)
// 8. বাংলা (bn)
// ============================================================

const TRANSLATIONS = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    soil_zoning: 'Soil Zoning',
    laser_defense: 'Laser Defense',
    organic_calculator: 'Organic Calculator',
    crop_rotation: 'Crop Rotation',
    leaf_scanner: 'Foliar AI Scanner',
    weather_irrigation: 'Weather & Irrigation',
    invader_security: 'Invader Security',
    farm_reports: 'Farm Reports',
    farmer_advisory: 'Farmer Advisory',
    farm_analytics: 'Analytics',
    control: 'Control Modules',
    log: 'Activity Log',
    network: 'Network Status',
    camera: 'Camera Live',
    diag: 'Robot Diagnostics',
    logout: 'Logout',

    // Operational Modes & Modules
    farmer_mode: 'Farmer Mode',
    delivery_mode: 'Delivery Mode',
    campus_tour: 'Campus Tour',
    sel_module: 'Select Operational Module',
    farm_desc: 'View soil profile, climate data, and farm patrol logs.',
    delivery_desc: 'Track deliveries, routes, and dispatch the robot.',
    campus_desc: 'Start guided campus tours with voice AI.',
    op_mode: 'Operating Mode',
    manual: 'Manual',
    line: 'Line',
    hybrid: 'Hybrid',
    gps: 'GPS',
    follow: 'Follow',
    avoid: 'Avoid',

    // Hardware Controls & Driving
    sys_overview: 'System Overview',
    hw_controls: 'Robotic Telemetry & Radar',
    manual_drive: 'Manual Drive Override',
    fwd: 'FWD',
    lft: 'LFT',
    stop: 'STOP',
    rgt: 'RGT',
    bck: 'BCK',
    ultrasonic: 'Ultrasonic Radar (HC-SR04)',
    front_clear: 'Front Clearance',
    safe: 'Safe',
    danger: 'Danger',
    ir_track: 'IR Line Tracking',
    left_ir: 'Left IR array',
    right_ir: 'Right IR array',
    on_path: 'On Path Centered',
    pan_scan: 'Pan Scan Mount',
    cur_angle: 'Current Angle',
    auto_scan: 'Auto Scan',
    flight_ctrl: 'Flight Controller (APM 2.8)',
    ch1_steer: 'CH1 Steering',
    ch2_throt: 'CH2 Throttle',
    mavlink: 'MavLink Status',
    connected: 'CONNECTED',

    // Telemetry & Environment
    climate: 'Climate',
    soil_profile: 'Soil Profile',
    farm_patrol: 'Farm Patrol',
    optimal_moisture: 'Optimal Moisture',
    safe_zone: 'Safe Zone',
    sector: 'Sector',
    speed: 'Speed',
    battery: 'Battery',
    heading: 'Heading',
    location: 'Location',
    temperature: 'Temperature',
    humidity: 'Humidity',
    moisture: 'Moisture',
    active: 'Active',
    online: 'Online',
    reset: 'Reset',
    robot_status: 'Robot Online Status',
    robot_live: 'Robot LIVE',
    mock_mode: 'Mock Mode',

    // Leaf Scanner & AI
    crop_context: 'Crop Context:',
    auto_detect_crop: 'Auto-Detect (Any PlantVillage Crop)',
    capture_scan: 'Capture & Scan Leaf',
    resume_cam: 'Resume Live Camera',
    choose_photo: 'Choose Photo File',
    flip_cam: 'Flip Camera',
    rexai_title: 'RexAI Intelligence',
    rexai_sub: 'Autonomous Neural Engine',
    chat_placeholder: 'Ask RexAI or speak a command...',
    ai_status: 'Powered by RexAI Architecture',

    // Diagnostics & System
    sys_diag: 'Diagnostics',
    batt_health: 'Battery Health',
    voltage: 'Voltage',
    cycles: 'Cycles',
    motor_drv: 'Motor Drivers',
    sensor_arr: 'Sensors Array',
    needs_sync: 'Needs Sync',
    recent_logs: 'Recent Activity Logs',
    loading_logs: 'Loading logs...',
    net_conn: 'Network & Connectivity',
    wifi_link: 'Primary WiFi Link',
    esp_server: 'ESP32-S3 Server',
    node_ws: 'Node.js WebSocket',
    cam_feed: 'Robot Camera Feed',
    cam_offline: 'Camera Feed Offline',
    refresh_feed: 'Refresh Feed',

    // Preferences & Modals
    preferences: 'Preferences & Settings',
    select_lang: 'Select Language',
    close: 'Close',
    cancel: 'Cancel',
    save: 'Save Changes',
    lang_updated: 'Language updated to {lang}',

    // Login & Admin
    login_title: 'GE-Bot-1 Login',
    username: 'Username',
    password: 'Password',
    sign_in: 'Sign In',
    forgot_pw: 'Forgot Password?',
    create_acc: 'Create Account',
    fullname: 'Full Name',
    email: 'Email',
    register: 'Register',
    back_to_login: 'Back to Login',
    reset_pw: 'Reset Password',
    send_otp: 'Send OTP',
    enter_otp: 'Enter OTP Code',
    verify_otp: 'Verify OTP',
    resend: 'Resend',
    new_pw: 'New Password',
    confirm_pw: 'Confirm Password',
    admin_users: 'Users Overview',
    live_map: 'Live Map',
    sys_alerts: 'System Alerts',
    history: 'History & Logs',
    portal_mgmt: 'Portal Management',
    admin_panel: 'Admin Control Center',
    administrator: 'Administrator'
  },

  hi: {
    // Navigation
    dashboard: 'डैशबोर्ड (Dashboard)',
    soil_zoning: 'मिट्टी ज़ोनिंग (Soil Zoning)',
    laser_defense: 'लेजर सुरक्षा (Laser Defense)',
    organic_calculator: 'जैविक खाद कैलकुलेटर',
    crop_rotation: 'फसल चक्र योजना (Crop Rotation)',
    leaf_scanner: 'पर्ण AI स्कैनर (Leaf Scanner)',
    weather_irrigation: 'मौसम और सिंचाई (Weather & Irrigation)',
    invader_security: 'घुसपैठिया सुरक्षा (Invader Security)',
    farm_reports: 'कृषि रिपोर्ट और उपज (Farm Reports)',
    farmer_advisory: 'किसान सलाह (Farmer Advisory)',
    farm_analytics: 'कृषि एनालिटिक्स (Analytics)',
    control: 'नियंत्रण मॉड्यूल (Controls)',
    log: 'गतिविधि लॉग (Logs)',
    network: 'नेटवर्क स्थिति (Network)',
    camera: 'कैमरा लाइव (Camera)',
    diag: 'रोबोट निदान (Diagnostics)',
    logout: 'लॉग आउट (Logout)',

    // Operational Modes & Modules
    farmer_mode: 'किसान मोड (Farmer)',
    delivery_mode: 'डिलीवरी मोड (Delivery)',
    campus_tour: 'कैम्पस टूर (Campus)',
    sel_module: 'ऑपरेशनल मॉड्यूल चुनें',
    farm_desc: 'मिट्टी प्रोफ़ाइल, जलवायु डेटा और गश्त लॉग देखें।',
    delivery_desc: 'डिलीवरी, मार्ग ट्रैक करें और रोबोट भेजें।',
    campus_desc: 'आवाज AI के साथ निर्देशित कैम्पस टूर शुरू करें।',
    op_mode: 'ऑपरेटिंग मोड',
    manual: 'मैनुअल (Manual)',
    line: 'लाइन फॉलो (Line)',
    hybrid: 'हाइब्रिड (Hybrid)',
    gps: 'GPS ऑटो (GPS)',
    follow: 'फॉलो-मी (Follow)',
    avoid: 'बाधा बचाव (Avoid)',

    // Hardware Controls & Driving
    sys_overview: 'सिस्टम अवलोकन (Overview)',
    hw_controls: 'रोबोटिक टेलीमेट्री और रडार',
    manual_drive: 'मैनुअल ड्राइव नियंत्रण',
    fwd: 'आगे (FWD)',
    lft: 'बाएं (LFT)',
    stop: 'रुको (STOP)',
    rgt: 'दाएं (RGT)',
    bck: 'पीछे (BCK)',
    ultrasonic: 'अल्ट्रासोनिक रडार (HC-SR04)',
    front_clear: 'सामने की दूरी',
    safe: 'सुरक्षित',
    danger: 'खतरा',
    ir_track: 'IR लाइन ट्रैकिंग',
    left_ir: 'बायां IR सेंसर',
    right_ir: 'दायां IR सेंसर',
    on_path: 'पथ पर केंद्रित',
    pan_scan: 'पैन स्कैन माउंट',
    cur_angle: 'वर्तमान कोण',
    auto_scan: 'ऑटो स्कैन',
    flight_ctrl: 'फ्लाइट कंट्रोलर (APM 2.8)',
    ch1_steer: 'CH1 स्टीयरिंग',
    ch2_throt: 'CH2 थ्रॉटल',
    mavlink: 'MavLink स्थिति',
    connected: 'जुड़ा हुआ (Connected)',

    // Telemetry & Environment
    climate: 'जलवायु (Climate)',
    soil_profile: 'मिट्टी प्रोफ़ाइल (Soil)',
    farm_patrol: 'खेत गश्त (Patrol)',
    optimal_moisture: 'इष्टतम नमी (Optimal)',
    safe_zone: 'सुरक्षित क्षेत्र (Safe)',
    sector: 'सेक्टर (Sector)',
    speed: 'गति (Speed)',
    battery: 'बैटरी (Battery)',
    heading: 'दिशा (Heading)',
    location: 'स्थान (Location)',
    temperature: 'तापमान (Temp)',
    humidity: 'आर्द्रता (Humidity)',
    moisture: 'नमी (Moisture)',
    active: 'सक्रिय (Active)',
    online: 'ऑनलाइन (Online)',
    reset: 'रीसेट (Reset)',
    robot_status: 'रोबोट ऑनलाइन स्थिति',
    robot_live: 'रोबोट लाइव (LIVE)',
    mock_mode: 'सिमुलेशन मोड (Mock)',

    // Leaf Scanner & AI
    crop_context: 'फसल संदर्भ:',
    auto_detect_crop: 'स्वतः पहचानें (कोई भी फसल)',
    capture_scan: 'पत्ता कैप्चर और स्कैन करें',
    resume_cam: 'कैमरा फिर शुरू करें',
    choose_photo: 'फोटो फ़ाइल चुनें',
    flip_cam: 'कैमरा पलटें',
    rexai_title: 'RexAI कृषि बुद्धिमत्ता',
    rexai_sub: 'स्वायत्त न्यूरल इंजन',
    chat_placeholder: 'RexAI से पूछें या कमांड बोलें...',
    ai_status: 'RexAI आर्किटेक्चर द्वारा संचालित',

    // Diagnostics & System
    sys_diag: 'सिस्टम डायग्नोस्टिक्स (Diagnostics)',
    batt_health: 'बैटरी स्वास्थ्य (Health)',
    voltage: 'वोल्टेज (Voltage)',
    cycles: 'साइकिल (Cycles)',
    motor_drv: 'मोटर ड्राइवर (Drivers)',
    sensor_arr: 'सेंसर एरे (Sensors)',
    needs_sync: 'सिंक आवश्यक',
    recent_logs: 'हालिया गतिविधि लॉग',
    loading_logs: 'लॉग लोड हो रहे हैं...',
    net_conn: 'नेटवर्क और कनेक्टिविटी',
    wifi_link: 'प्राथमिक वाईफाई लिंक',
    esp_server: 'ESP32-S3 सर्वर',
    node_ws: 'Node.js वेबसॉकेट',
    cam_feed: 'रोबोट कैमरा फीड',
    cam_offline: 'कैमरा फीड ऑफलाइन',
    refresh_feed: 'फ़ीड ताज़ा करें',

    // Preferences & Modals
    preferences: 'प्राथमिकताएँ और सेटिंग्स',
    select_lang: 'भाषा चुनें (Language)',
    close: 'बंद करें',
    cancel: 'रद्द करें',
    save: 'बदलाव सहेजें',
    lang_updated: 'भाषा {lang} में अपडेट की गई',

    // Login & Admin
    login_title: 'डाइनोरेक्स X1 लॉगिन',
    username: 'यूजरनेम (Username)',
    password: 'पासवर्ड (Password)',
    sign_in: 'साइन इन करें (Sign In)',
    forgot_pw: 'पासवर्ड भूल गए?',
    create_acc: 'खाता बनाएँ (Sign Up)',
    fullname: 'पूरा नाम (Full Name)',
    email: 'ईमेल पता (Email)',
    register: 'पंजीकरण करें (Register)',
    back_to_login: 'लॉगिन पर वापस',
    reset_pw: 'पासवर्ड रीसेट करें',
    send_otp: 'ओटीपी भेजें (OTP)',
    enter_otp: 'ओटीपी दर्ज करें',
    verify_otp: 'ओटीपी सत्यापित करें',
    resend: 'पुनः भेजें',
    new_pw: 'नया पासवर्ड',
    confirm_pw: 'पासवर्ड पुष्टि करें',
    admin_users: 'उपयोगकर्ता अवलोकन',
    live_map: 'लाइव मैप (Map)',
    sys_alerts: 'सिस्टम अलर्ट (Alerts)',
    history: 'इतिहास और लॉग',
    portal_mgmt: 'पोर्टल प्रबंधन',
    admin_panel: 'एडमिन कंट्रोल सेंटर',
    administrator: 'प्रशासक (Admin)'
  },

  mr: {
    // Navigation
    dashboard: 'डॅशबोर्ड (Dashboard)',
    soil_zoning: 'माती विभागणी (Soil Zoning)',
    laser_defense: 'लेसर संरक्षण (Laser Defense)',
    organic_calculator: 'सेंद्रिय खत कॅल्क्युलेटर',
    crop_rotation: 'पीक फेरपालट योजना',
    leaf_scanner: 'पान AI स्कॅनर (Leaf Scanner)',
    weather_irrigation: 'हवामान आणि सिंचन',
    invader_security: 'घुसखोर सुरक्षा (Security)',
    farm_reports: 'शेती अहवाल आणि उत्पन्न',
    farmer_advisory: 'शेतकरी सल्ला (Advisory)',
    farm_analytics: 'शेती विश्लेषण (Analytics)',
    control: 'नियंत्रण मॉड्यूल (Controls)',
    log: 'अहवाल नोंदी (Activity Logs)',
    network: 'नेटवर्क स्थिती (Network)',
    camera: 'कॅमेरा लाईव्ह (Camera Live)',
    diag: 'रोबोट तपासणी (Diagnostics)',
    logout: 'बाहेर पडा (Logout)',

    // Operational Modes & Modules
    farmer_mode: 'शेतकरी मोड (Farmer Mode)',
    delivery_mode: 'डिलिव्हरी मोड (Delivery Mode)',
    campus_tour: 'कॅम्पस टूर (Campus Tour)',
    sel_module: 'कार्यप्रणाली मॉड्यूल निवडा',
    farm_desc: 'माती प्रोफाइल, हवामान डेटा आणि शेती गस्त नोंदी पहा.',
    delivery_desc: 'डिलिव्हरी, मार्ग ट्रॅक करा आणि रोबोट पाठवा.',
    campus_desc: 'व्हॉईस AI सह मार्गदर्शित कॅम्पस टूर सुरू करा.',
    op_mode: 'ऑपरेटिंग मोड',
    manual: 'मॅन्युअल (Manual)',
    line: 'लाइन फॉलो (Line)',
    hybrid: 'हायब्रिड (Hybrid)',
    gps: 'GPS ऑटो (GPS)',
    follow: 'फॉलो-मी (Follow)',
    avoid: 'अडथळा टाळा (Avoid)',

    // Hardware Controls & Driving
    sys_overview: 'सिस्टम आढावा (Overview)',
    hw_controls: 'रोबोटिक टेलिमेट्री आणि रडार',
    manual_drive: 'मॅन्युअल ड्राइव्ह नियंत्रण',
    fwd: 'पुढे (FWD)',
    lft: 'डावे (LFT)',
    stop: 'थांबा (STOP)',
    rgt: 'उजवे (RGT)',
    bck: 'मागे (BCK)',
    ultrasonic: 'अल्ट्रासोनिक रडार (HC-SR04)',
    front_clear: 'समोरील अंतर',
    safe: 'सुरक्षित',
    danger: 'धोका',
    ir_track: 'IR लाईन ट्रॅकिंग',
    left_ir: 'डावा IR सेन्सर',
    right_ir: 'उजवा IR सेन्सर',
    on_path: 'मार्गावर केंद्रित',
    pan_scan: 'पॅन स्कॅन माउंट',
    cur_angle: 'सध्याचा कोन',
    auto_scan: 'ऑटो स्कॅन',
    flight_ctrl: 'फ्लाइट कंट्रोलर (APM 2.8)',
    ch1_steer: 'CH1 स्टीयरिंग',
    ch2_throt: 'CH2 थ्रॉटल',
    mavlink: 'MavLink स्थिती',
    connected: 'जोडलेले (Connected)',

    // Telemetry & Environment
    climate: 'हवामान (Climate)',
    soil_profile: 'माती प्रोफाइल (Soil)',
    farm_patrol: 'शेत गस्त (Patrol)',
    optimal_moisture: 'योग्य ओलावा (Optimal)',
    safe_zone: 'सुरक्षित क्षेत्र (Safe)',
    sector: 'विभाग (Sector)',
    speed: 'वेग (Speed)',
    battery: 'बॅटरी (Battery)',
    heading: 'दिशा (Heading)',
    location: 'स्थान (Location)',
    temperature: 'तापमान (Temp)',
    humidity: 'आर्द्रता (Humidity)',
    moisture: 'ओलावा (Moisture)',
    active: 'सक्रिय (Active)',
    online: 'ऑनलाईन (Online)',
    reset: 'रीसेट (Reset)',
    robot_status: 'रोबोट ऑनलाईन स्थिती',
    robot_live: 'रोबोट लाईव्ह (LIVE)',
    mock_mode: 'सिम्युलेशन मोड (Mock)',

    // Leaf Scanner & AI
    crop_context: 'पीक संदर्भ:',
    auto_detect_crop: 'स्वयं-ओळख (कोणतेही पीक)',
    capture_scan: 'पान कॅप्चर आणि स्कॅन करा',
    resume_cam: 'कॅमेरा पुन्हा सुरू करा',
    choose_photo: 'फोटो फाईल निवडा',
    flip_cam: 'कॅमेरा बदला',
    rexai_title: 'RexAI शेती बुद्धिमत्ता',
    rexai_sub: 'स्वायत्त न्यूरल इंजिन',
    chat_placeholder: 'RexAI ला विचारा किंवा आज्ञा द्या...',
    ai_status: 'RexAI द्वारे समर्थित',

    // Diagnostics & System
    sys_diag: 'सिस्टम तपासणी (Diagnostics)',
    batt_health: 'बॅटरी आरोग्य (Health)',
    voltage: 'व्होल्टेज (Voltage)',
    cycles: 'सायकल्स (Cycles)',
    motor_drv: 'मोटर ड्रायव्हर्स (Drivers)',
    sensor_arr: 'सेन्सर्स अ‍ॅरे (Sensors)',
    needs_sync: 'सिंक आवश्यक',
    recent_logs: 'अलीकडील नोंदी (Logs)',
    loading_logs: 'नोंदी लोड होत आहेत...',
    net_conn: 'नेटवर्क कनेक्टिव्हिटी',
    wifi_link: 'प्राथमिक वायफाय लिंक',
    esp_server: 'ESP32-S3 सर्व्हर',
    node_ws: 'Node.js वेबसॉकेट',
    cam_feed: 'रोबोट कॅमेरा फीड',
    cam_offline: 'कॅमेरा फीड ऑफलाइन',
    refresh_feed: 'फीड ताजी करा',

    // Preferences & Modals
    preferences: 'प्राधान्ये आणि सेटिंग्ज',
    select_lang: 'भाषा निवडा (Language)',
    close: 'बंद करा',
    cancel: 'रद्द करा',
    save: 'बदल जतन करा',
    lang_updated: 'भाषा {lang} अद्यतनित झाली',

    // Login & Admin
    login_title: 'GE-Bot-1 लॉगिन',
    username: 'वापरकर्ता नाव (Username)',
    password: 'पासवर्ड (Password)',
    sign_in: 'साइन इन करा (Sign In)',
    forgot_pw: 'पासवर्ड विसरलात?',
    create_acc: 'खाते तयार करा (Sign Up)',
    fullname: 'पूर्ण नाव (Full Name)',
    email: 'ईमेल पत्ता (Email)',
    register: 'नोंदणी करा (Register)',
    back_to_login: 'लॉगिनवर परत जा',
    reset_pw: 'पासवर्ड रीसेट करा',
    send_otp: 'OTP पाठवा',
    enter_otp: 'OTP प्रविष्ट करा',
    verify_otp: 'तपासा (Verify OTP)',
    resend: 'पुन्हा पाठवा',
    new_pw: 'नवीन पासवर्ड',
    confirm_pw: 'पुष्टी करा',
    admin_users: 'वापरकर्ता विहंगावलोकन',
    live_map: 'लाईव्ह नकाशा (Map)',
    sys_alerts: 'अलर्ट (Alerts)',
    history: 'इतिहास आणि ऑडिट',
    portal_mgmt: 'पोर्टल व्यवस्थापन',
    admin_panel: 'अ‍ॅडमिन नियंत्रण केंद्र',
    administrator: 'प्रशासक (Admin)'
  },

  gu: {
    // Navigation
    dashboard: 'ડેશબોર્ડ (Dashboard)',
    soil_zoning: 'માટી ઝોનિંગ (Soil Zoning)',
    laser_defense: 'લેસર સંરક્ષણ (Laser Defense)',
    organic_calculator: 'ઓર્ગેનિક ખાતર કેલ્ક્યુલેટર',
    crop_rotation: 'પાક પરિભ્રમણ આયોજક',
    leaf_scanner: 'પાંદડા AI સ્કેનર (Leaf Scanner)',
    weather_irrigation: 'હવામાન અને સિંચાઈ',
    invader_security: 'ઘૂસણખોર સુરક્ષા (Security)',
    farm_reports: 'ખેતર અહેવાલ અને ઉપજ',
    farmer_advisory: 'ખેડૂત સલાહ (Advisory)',
    farm_analytics: 'ખેતર વિશ્લેષણ (Analytics)',
    control: 'નિયંત્રણ મોડ્યુલ (Controls)',
    log: 'પ્રવૃત્તિ લૉગ્સ (Activity Logs)',
    network: 'નેટવર્ક સ્થિતિ (Network)',
    camera: 'કેમેરા લાઈવ (Camera Live)',
    diag: 'રોબોટ નિદાન (Diagnostics)',
    logout: 'લૉગ આઉટ (Logout)',

    // Operational Modes & Modules
    farmer_mode: 'ખેડૂત મોડ (Farmer Mode)',
    delivery_mode: 'ડિલિવરી મોડ (Delivery Mode)',
    campus_tour: 'કેમ્પસ ટૂર (Campus Tour)',
    sel_module: 'ઓપરેશનલ મોડ્યુલ પસંદ કરો',
    farm_desc: 'માટી પ્રોફાઇલ, આબોહવા ડેટા અને પેટ્રોલિંગ લૉગ્સ જુઓ.',
    delivery_desc: 'ડિલિવરી અને રૂટ્સ ટ્રૅક કરો, રોબોટ મોકલો.',
    campus_desc: 'વૉઇસ AI સાથે માર્ગદર્શિત કેમ્પસ ટૂર શરૂ કરો.',
    op_mode: 'ઓપરેટિંગ મોડ',
    manual: 'મેન્યુઅલ (Manual)',
    line: 'લાઇન ફોલો (Line)',
    hybrid: 'હાઇબ્રિડ (Hybrid)',
    gps: 'GPS ઓટો (GPS)',
    follow: 'ફૉલો-મી (Follow)',
    avoid: 'અવરોધ ટાળો (Avoid)',

    // Hardware Controls & Driving
    sys_overview: 'સિસ્ટમ ઓવરવ્યૂ (Overview)',
    hw_controls: 'રોબોટિક ટેલિમેટ્રી અને રડાર',
    manual_drive: 'મેન્યુઅલ ડ્રાઇવ નિયંત્રણ',
    fwd: 'આગળ (FWD)',
    lft: 'ડાબે (LFT)',
    stop: 'રોકો (STOP)',
    rgt: 'જમણે (RGT)',
    bck: 'પાછળ (BCK)',
    ultrasonic: 'અલ્ટ્રાસોનિક રડાર (HC-SR04)',
    front_clear: 'આગળનું અંતર',
    safe: 'સુરક્ષિત',
    danger: 'જોખમ',
    ir_track: 'IR લાઇન ટ્રેકિંગ',
    left_ir: 'ડાબો IR સેન્સર',
    right_ir: 'જમણો IR સેન્સર',
    on_path: 'પાથ પર કેન્દ્રિત',
    pan_scan: 'પેન સ્કેન માઉન્ટ',
    cur_angle: 'વર્તમાન કોણ',
    auto_scan: 'ઓટો સ્કેન',
    flight_ctrl: 'ફ્લાઇટ કંટ્રોલર (APM 2.8)',
    ch1_steer: 'CH1 સ્ટીયરીંગ',
    ch2_throt: 'CH2 થ્રોટલ',
    mavlink: 'MavLink સ્થિતિ',
    connected: 'જોડાયેલ (Connected)',

    // Telemetry & Environment
    climate: 'આબોહવા (Climate)',
    soil_profile: 'માટી પ્રોફાઇલ (Soil)',
    farm_patrol: 'ખેતર પેટ્રોલિંગ (Patrol)',
    optimal_moisture: 'શ્રેષ્ઠ ભેજ (Optimal)',
    safe_zone: 'સુરક્ષિત ક્ષેત્ર (Safe)',
    sector: 'સેક્ટર (Sector)',
    speed: 'ગતિ (Speed)',
    battery: 'બેટરી (Battery)',
    heading: 'દિશા (Heading)',
    location: 'સ્થાન (Location)',
    temperature: 'તાપમાન (Temp)',
    humidity: 'ભેજ (Humidity)',
    moisture: 'માટીનો ભેજ',
    active: 'સક્રિય (Active)',
    online: 'ઓનલાઇન (Online)',
    reset: 'રીસેટ (Reset)',
    robot_status: 'રોબોટ ઓનલાઈન સ્થિતિ',
    robot_live: 'રોબોટ લાઈવ (LIVE)',
    mock_mode: 'સિમ્યુલેશન મોડ (Mock)',

    // Leaf Scanner & AI
    crop_context: 'પાક સંદર્ભ:',
    auto_detect_crop: 'આપમેળે શોધો (કોઈપણ પાક)',
    capture_scan: 'પાંદડું કેપ્ચર અને સ્કેન કરો',
    resume_cam: 'કેમેરા ફરી શરૂ કરો',
    choose_photo: 'ફોટો ફાઇલ પસંદ કરો',
    flip_cam: 'કેમેરો ફ્લિપ કરો',
    rexai_title: 'RexAI ખેતર ઇન્ટેલિજન્સ',
    rexai_sub: 'સ્વાયત્ત ન્યુરલ એન્જિન',
    chat_placeholder: 'RexAI ને પૂછો અથવા આદેશ આપો...',
    ai_status: 'RexAI દ્વારા સંચાલિત',

    // Diagnostics & System
    sys_diag: 'સિસ્ટમ નિદાન (Diagnostics)',
    batt_health: 'બેટરી આરોગ્ય (Health)',
    voltage: 'વોલ્ટેજ (Voltage)',
    cycles: 'સાયકલ્સ (Cycles)',
    motor_drv: 'મોટર ડ્રાઇવર્સ (Drivers)',
    sensor_arr: 'સેન્સર્સ એરે (Sensors)',
    needs_sync: 'સિંક જરૂરી',
    recent_logs: 'તાજેતરના લૉગ્સ (Logs)',
    loading_logs: 'લૉગ્સ લોડ થઈ રહ્યાં છે...',
    net_conn: 'નેટવર્ક કનેક્ટિવિટી',
    wifi_link: 'પ્રાથમિક વાઇફાઇ લિંક',
    esp_server: 'ESP32-S3 સર્વર',
    node_ws: 'Node.js વેબસોકેટ',
    cam_feed: 'રોબોટ કેમેરા ફીડ',
    cam_offline: 'કેમેરા ફીડ ઓફલાઇન',
    refresh_feed: 'ફીડ તાજી કરો',

    // Preferences & Modals
    preferences: 'પસંદગીઓ અને સેટિંગ્સ',
    select_lang: 'ભાષા પસંદ કરો (Language)',
    close: 'બંધ કરો',
    cancel: 'રદ કરો',
    save: 'ફેરફારો સાચવો',
    lang_updated: 'ભાષા {lang} માં બદલાઈ ગઈ',

    // Login & Admin
    login_title: 'GE-Bot-1 લૉગિન',
    username: 'વપરાશકર્તા નામ (Username)',
    password: 'પાસવર્ડ (Password)',
    sign_in: 'સાઇન ઇન કરો (Sign In)',
    forgot_pw: 'પાસવર્ડ ભૂલી ગયા?',
    create_acc: 'ખાતું બનાવો (Sign Up)',
    fullname: 'પૂરું નામ (Full Name)',
    email: 'ઈમેલ સરનામું (Email)',
    register: 'નોંધણી કરો (Register)',
    back_to_login: 'લૉગિન પર પાછા જાઓ',
    reset_pw: 'પાસવર્ડ રીસેટ કરો',
    send_otp: 'OTP મોકલો',
    enter_otp: 'OTP દાખલ કરો',
    verify_otp: 'OTP ચકાસો (Verify)',
    resend: 'ફરીથી મોકલો',
    new_pw: 'નવો પાસવર્ડ',
    confirm_pw: 'પુષ્ટિ કરો',
    admin_users: 'વપરાશકર્તા ઝાંખી',
    live_map: 'લાઇવ નકશો (Map)',
    sys_alerts: 'સિસ્ટમ ચેતવણીઓ (Alerts)',
    history: 'ઇતિહાસ અને ઓડિટ',
    portal_mgmt: 'પોર્ટલ મેનેજમેન્ટ',
    admin_panel: 'એડમિન કંટ્રોલ સેન્ટર',
    administrator: 'સંચાલક (Admin)'
  },

  pa: {
    // Navigation
    dashboard: 'ਡੈਸ਼ਬੋਰਡ (Dashboard)',
    soil_zoning: 'ਮਿੱਟੀ ਜ਼ੋਨਿੰਗ (Soil Zoning)',
    laser_defense: 'ਲੇਜ਼ਰ ਰੱਖਿਆ (Laser Defense)',
    organic_calculator: 'ਜੈਵਿਕ ਖਾਦ ਕੈਲਕੁਲੇਟਰ',
    crop_rotation: 'ਫਸਲ ਚੱਕਰ ਯੋਜਨਾਕਾਰ',
    leaf_scanner: 'ਪੱਤਾ AI ਸਕੈਨਰ (Leaf Scanner)',
    weather_irrigation: 'ਮੌਸਮ ਅਤੇ ਸਿੰਚਾਈ',
    invader_security: 'ਘੁਸਪੈਠੀਏ ਸੁਰੱਖਿਆ (Security)',
    farm_reports: 'ਖੇਤੀ ਰਿਪੋਰਟ ਅਤੇ ਝਾੜ',
    farmer_advisory: 'ਕਿਸਾਨ ਸਲਾਹ (Advisory)',
    farm_analytics: 'ਖੇਤ ਵਿਸ਼ਲੇਸ਼ਣ (Analytics)',
    control: 'ਕੰਟਰੋਲ ਮੋਡੀਊਲ (Controls)',
    log: 'ਗਤੀਵਿਧੀ ਲਾਗ (Activity Logs)',
    network: 'ਨੈੱਟਵਰਕ ਸਥਿਤੀ (Network)',
    camera: 'ਕੈਮਰਾ ਲਾਈਵ (Camera Live)',
    diag: 'ਰੋਬੋਟ ਜਾਂਚ (Diagnostics)',
    logout: 'ਲਾਗ ਆਉਟ (Logout)',

    // Operational Modes & Modules
    farmer_mode: 'ਕਿਸਾਨ ਮੋਡ (Farmer Mode)',
    delivery_mode: 'ਡਿਲੀਵਰੀ ਮੋਡ (Delivery Mode)',
    campus_tour: 'ਕੈਂਪਸ ਟੂਰ (Campus Tour)',
    sel_module: 'ਕਾਰਜਸ਼ੀਲ ਮੋਡੀਊਲ ਚੁਣੋ',
    farm_desc: 'ਮਿੱਟੀ ਦੀ ਜਾਣਕਾਰੀ, ਮੌਸਮ ਡੇਟਾ ਅਤੇ ਖੇਤ ਗਸ਼ਤ ਲਾਗ ਦੇਖੋ।',
    delivery_desc: 'ਡਿਲੀਵਰੀ ਅਤੇ ਰੂਟ ਟਰੈਕ ਕਰੋ, ਰੋਬੋਟ ਭੇਜੋ।',
    campus_desc: 'ਆਵਾਜ਼ AI ਨਾਲ ਗਾਈਡਡ ਕੈਂਪਸ ਟੂਰ ਸ਼ੁਰੂ ਕਰੋ।',
    op_mode: 'ਓਪਰੇਟਿੰਗ ਮੋਡ',
    manual: 'ਮੈਨੂਅਲ (Manual)',
    line: 'ਲਾਈਨ ਫਾਲੋ (Line)',
    hybrid: 'ਹਾਈਬ੍ਰਿਡ (Hybrid)',
    gps: 'GPS ਆਟੋ (GPS)',
    follow: 'ਫਾਲੋ-ਮੀ (Follow)',
    avoid: 'ਰੁਕਾਵਟ ਬਚਾਅ (Avoid)',

    // Hardware Controls & Driving
    sys_overview: 'ਸਿਸਟਮ ਸੰਖੇਪ (Overview)',
    hw_controls: 'ਰੋਬੋਟਿਕ ਟੈਲੀਮੈਟਰੀ ਅਤੇ ਰਾਡਾਰ',
    manual_drive: 'ਮੈਨੂਅਲ ਡਰਾਈਵ ਕੰਟਰੋਲ',
    fwd: 'ਅੱਗੇ (FWD)',
    lft: 'ਖੱਬੇ (LFT)',
    stop: 'ਰੁਕੋ (STOP)',
    rgt: 'ਸੱਜੇ (RGT)',
    bck: 'ਪਿੱਛੇ (BCK)',
    ultrasonic: 'ਅਲਟਰਾਸੋਨਿਕ ਰਾਡਾਰ (HC-SR04)',
    front_clear: 'ਸਾਹਮਣੇ ਦੀ ਦੂਰੀ',
    safe: 'ਸੁਰੱਖਿਅਤ',
    danger: 'ਖਤਰਾ',
    ir_track: 'IR ਲਾਈਨ ਟਰੈਕਿੰਗ',
    left_ir: 'ਖੱਬਾ IR ਸੈਂਸਰ',
    right_ir: 'ਸੱਜਾ IR ਸੈਂਸਰ',
    on_path: 'ਰਸਤੇ ਤੇ ਕੇਂਦਰਿਤ',
    pan_scan: 'ਪੈਨ ਸਕੈਨ ਮਾਊਂਟ',
    cur_angle: 'ਮੌਜੂਦਾ ਕੋਣ',
    auto_scan: 'ਆਟੋ ਸਕੈਨ',
    flight_ctrl: 'ਫਲਾਈਟ ਕੰਟਰੋਲਰ (APM 2.8)',
    ch1_steer: 'CH1 ਸਟੀਅਰਿੰਗ',
    ch2_throt: 'CH2 ਥ੍ਰੋਟਲ',
    mavlink: 'MavLink ਸਥਿਤੀ',
    connected: 'ਜੁੜਿਆ ਹੋਇਆ (Connected)',

    // Telemetry & Environment
    climate: 'ਜਲਵਾਯੂ (Climate)',
    soil_profile: 'ਮਿੱਟੀ ਪ੍ਰੋਫਾਈਲ (Soil)',
    farm_patrol: 'ਖੇਤ ਗਸ਼ਤ (Patrol)',
    optimal_moisture: 'ਅਨੁਕੂਲ ਨਮੀ (Optimal)',
    safe_zone: 'ਸੁਰੱਖਿਅਤ ਖੇਤਰ (Safe)',
    sector: 'ਸੈਕਟਰ (Sector)',
    speed: 'ਗਤੀ (Speed)',
    battery: 'ਬੈਟਰੀ (Battery)',
    heading: 'ਦਿਸ਼ਾ (Heading)',
    location: 'ਸਥਾਨ (Location)',
    temperature: 'ਤਾਪਮਾਨ (Temp)',
    humidity: 'ਨਮੀ (Humidity)',
    moisture: 'ਮਿੱਟੀ ਦੀ ਨਮੀ',
    active: 'ਸਰਗਰਮ (Active)',
    online: 'ਔਨਲਾਈਨ (Online)',
    reset: 'ਰੀਸੈੱਟ (Reset)',
    robot_status: 'ਰੋਬੋਟ ਔਨਲਾਈਨ ਸਥਿਤੀ',
    robot_live: 'ਰੋਬੋਟ ਲਾਈਵ (LIVE)',
    mock_mode: 'ਸਿਮੂਲੇਸ਼ਨ ਮੋਡ (Mock)',

    // Leaf Scanner & AI
    crop_context: 'ਫਸਲ ਸੰਦਰਭ:',
    auto_detect_crop: 'ਸਵੈ-ਖੋਜ (ਕੋਈ ਵੀ ਫਸਲ)',
    capture_scan: 'ਪੱਤਾ ਕੈਪਚਰ ਅਤੇ ਸਕੈਨ ਕਰੋ',
    resume_cam: 'ਕੈਮਰਾ ਮੁੜ ਸ਼ੁਰੂ ਕਰੋ',
    choose_photo: 'ਫੋਟੋ ਫ਼ਾਈਲ ਚੁਣੋ',
    flip_cam: 'ਕੈਮਰਾ ਪਲਟੋ',
    rexai_title: 'RexAI ਖੇਤੀਬਾੜੀ ਬੁੱਧੀ',
    rexai_sub: 'ਖੁਦਮੁਖਤਿਆਰ ਨਿਊਰਲ ਇੰਜਨ',
    chat_placeholder: 'RexAI ਨੂੰ ਪੁੱਛੋ ਜਾਂ ਕਮਾਂਡ ਬੋਲੋ...',
    ai_status: 'RexAI ਦੁਆਰਾ ਸੰਚਾਲਿਤ',

    // Diagnostics & System
    sys_diag: 'ਸਿਸਟਮ ਜਾਂਚ (Diagnostics)',
    batt_health: 'ਬੈਟਰੀ ਸਿਹਤ (Health)',
    voltage: 'ਵੋਲਟੇਜ (Voltage)',
    cycles: 'ਚੱਕਰ (Cycles)',
    motor_drv: 'ਮੋਟਰ ਡਰਾਈਵਰ (Drivers)',
    sensor_arr: 'ਸੈਂਸਰ ਐਰੇ (Sensors)',
    needs_sync: 'ਸਿੰਕ ਦੀ ਲੋੜ',
    recent_logs: 'ਤਾਜ਼ਾ ਲਾਗ (Recent Logs)',
    loading_logs: 'ਲਾਗ ਲੋਡ ਹੋ ਰਹੇ ਹਨ...',
    net_conn: 'ਨੈੱਟਵਰਕ ਕਨੈਕਟੀਵਿਟੀ',
    wifi_link: 'ਮੁੱਖ ਵਾਈਫਾਈ ਲਿੰਕ',
    esp_server: 'ESP32-S3 ਸਰਵਰ',
    node_ws: 'Node.js ਵੈੱਬਸਾਕਟ',
    cam_feed: 'ਰੋਬੋਟ ਕੈਮਰਾ ਫੀਡ',
    cam_offline: 'ਕੈਮਰਾ ਫੀਡ ਔਫਲਾਈਨ',
    refresh_feed: 'ਫੀਡ ਤਾਜ਼ਾ ਕਰੋ',

    // Preferences & Modals
    preferences: 'ਤਰਜੀਹਾਂ ਅਤੇ ਸੈਟਿੰਗਾਂ',
    select_lang: 'ਭਾਸ਼ਾ ਚੁਣੋ (Language)',
    close: 'ਬੰਦ ਕਰੋ',
    cancel: 'ਰੱਦ ਕਰੋ',
    save: 'ਤਬਦੀਲੀਆਂ ਸੰਭਾਲੋ',
    lang_updated: 'ਭਾਸ਼ਾ {lang} ਵਿੱਚ ਅਪਡੇਟ ਹੋਈ',

    // Login & Admin
    login_title: 'GE-Bot-1 ਲੌਗਇਨ',
    username: 'ਯੂਜ਼ਰਨਾਮ (Username)',
    password: 'ਪਾਸਵਰਡ (Password)',
    sign_in: 'ਸਾਈਨ ਇਨ ਕਰੋ (Sign In)',
    forgot_pw: 'ਪਾਸਵਰਡ ਭੁੱਲ ਗਏ?',
    create_acc: 'ਖਾਤਾ ਬਣਾਓ (Sign Up)',
    fullname: 'ਪੂਰਾ ਨਾਮ (Full Name)',
    email: 'ਈਮੇਲ ਪਤਾ (Email)',
    register: 'ਰਜਿਸਟਰ ਕਰੋ (Register)',
    back_to_login: 'ਲੌਗਇਨ ਤੇ ਵਾਪਸ ਜਾਓ',
    reset_pw: 'ਪਾਸਵਰਡ ਰੀਸੈੱਟ ਕਰੋ',
    send_otp: 'OTP ਭੇਜੋ',
    enter_otp: 'OTP ਦਰਜ ਕਰੋ',
    verify_otp: 'ਤਸਦੀਕ ਕਰੋ (Verify)',
    resend: 'ਮੁੜ ਭੇਜੋ',
    new_pw: 'ਨਵਾਂ ਪਾਸਵਰਡ',
    confirm_pw: 'ਪੁਸ਼ਟੀ ਕਰੋ',
    admin_users: 'ਯੂਜ਼ਰ ਸਮੀਖਿਆ (Users)',
    live_map: 'ਲਾਈਵ ਨਕਸ਼ਾ (Map)',
    sys_alerts: 'ਸਿਸਟਮ ਚੇਤਾਵਨੀਆਂ (Alerts)',
    history: 'ਇਤਿਹਾਸ ਅਤੇ ਆਡਿਟ',
    portal_mgmt: 'ਪੋਰਟਲ ਪ੍ਰਬੰਧਨ',
    admin_panel: 'ਐਡਮਿਨ ਕੰਟਰੋਲ ਸੈਂਟਰ',
    administrator: 'ਪ੍ਰਬੰਧਕ (Admin)'
  },

  ta: {
    // Navigation
    dashboard: 'கட்டுப்பாட்டகம் (Dashboard)',
    soil_zoning: 'மண் மண்டலங்கள் (Soil Zoning)',
    laser_defense: 'லேசர் பாதுகாப்பு (Laser Defense)',
    organic_calculator: 'இயற்கை உர கணிப்பான்',
    crop_rotation: 'பயிர் சுழற்சி திட்டமிடுபவர்',
    leaf_scanner: 'இலை AI ஸ்கேனர் (Leaf Scanner)',
    weather_irrigation: 'வானிலை & பாசனம் (Irrigation)',
    invader_security: 'ஊடுருவல் பாதுகாப்பு (Security)',
    farm_reports: 'பண்ணை அறிக்கைகள் & மகசூல்',
    farmer_advisory: 'விவசாயி வழிகாட்டுதல் (Advisory)',
    farm_analytics: 'பண்ணை பகுப்பாய்வு (Analytics)',
    control: 'கட்டுப்பாட்டு தொகுதிகள் (Controls)',
    log: 'செயல்பாட்டு பதிவுகள் (Activity Logs)',
    network: 'பிணைய நிலை (Network)',
    camera: 'நேரலை கேமரா (Camera Live)',
    diag: 'ரோபோ நோயறிதல் (Diagnostics)',
    logout: 'வெளியேறு (Logout)',

    // Operational Modes & Modules
    farmer_mode: 'விவசாயி முறை (Farmer Mode)',
    delivery_mode: 'டெலிவரி முறை (Delivery Mode)',
    campus_tour: 'வளாக சுற்றுப்பயணம் (Campus Tour)',
    sel_module: 'செயல்பாட்டு தொகுதியைத் தேர்ந்தெடுக்கவும்',
    farm_desc: 'மண் விவரக்குறிப்பு, காலநிலை மற்றும் ரோந்து பதிவுகளைக் காண்க.',
    delivery_desc: 'டெலிவரிகள் மற்றும் வழிகளைக் கண்காணிக்கவும், ரோபோவை அனுப்பவும்.',
    campus_desc: 'குரல் AI வழிகாட்டுதலுடன் வளாக சுற்றை தொடங்கவும்.',
    op_mode: 'இயக்க முறை (Mode)',
    manual: 'கைமுறை (Manual)',
    line: 'கோடு பின்தொடர் (Line)',
    hybrid: 'கலப்பின முறை (Hybrid)',
    gps: 'GPS தானியங்கி (GPS)',
    follow: 'என்னை பின்தொடர் (Follow)',
    avoid: 'தடையைத் தவிர் (Avoid)',

    // Hardware Controls & Driving
    sys_overview: 'கணினி மேலோட்டம் (Overview)',
    hw_controls: 'ரோபோடிக் டெலிமெட்ரி & ரேடார்',
    manual_drive: 'கைமுறை இயக்கம் (Manual Drive)',
    fwd: 'முன் (FWD)',
    lft: 'இடது (LFT)',
    stop: 'நிறுத்து (STOP)',
    rgt: 'வலது (RGT)',
    bck: 'பின் (BCK)',
    ultrasonic: 'அல்ட்ராசோனிக் ரேடார் (HC-SR04)',
    front_clear: 'முன் இடைவெளி',
    safe: 'பாதுகாப்பானது',
    danger: 'ஆபத்து',
    ir_track: 'IR கோடு கண்காணிப்பு',
    left_ir: 'இடது IR சென்சார்',
    right_ir: 'வலது IR சென்சார்',
    on_path: 'பாதையில் மையப்படுத்தப்பட்டது',
    pan_scan: 'பான் ஸ்கேன் மவுண்ட்',
    cur_angle: 'தற்போதைய கோணம்',
    auto_scan: 'தானியங்கி ஸ்கேன்',
    flight_ctrl: 'ஃப்ளைட் கன்ட்ரோலர் (APM 2.8)',
    ch1_steer: 'CH1 ஸ்டீயரிங்',
    ch2_throt: 'CH2 த்ரோட்டில்',
    mavlink: 'MavLink நிலை',
    connected: 'இணைக்கப்பட்டது (Connected)',

    // Telemetry & Environment
    climate: 'காலநிலை (Climate)',
    soil_profile: 'மண் சுயவிவரம் (Soil)',
    farm_patrol: 'பண்ணை ரோந்து (Patrol)',
    optimal_moisture: 'உகந்த ஈரப்பதம் (Optimal)',
    safe_zone: 'பாதுகாப்பான பகுதி (Safe)',
    sector: 'பிரிவு (Sector)',
    speed: 'வேகம் (Speed)',
    battery: 'பேட்டரி (Battery)',
    heading: 'திசை (Heading)',
    location: 'அமைவிடம் (Location)',
    temperature: 'வெப்பநிலை (Temp)',
    humidity: 'ஈரப்பதம் (Humidity)',
    moisture: 'மண் ஈரப்பதம்',
    active: 'செயலில் (Active)',
    online: 'ஆன்லைன் (Online)',
    reset: 'மீட்டமை (Reset)',
    robot_status: 'ரோபோ ஆன்லைன் நிலை',
    robot_live: 'ரோபோ நேரலை (LIVE)',
    mock_mode: 'உருவகப்படுத்துதல் (Mock)',

    // Leaf Scanner & AI
    crop_context: 'பயிர் சூழல்:',
    auto_detect_crop: 'தானியங்கி கண்டறிதல் (எந்தப் பயிரும்)',
    capture_scan: 'இலையைப் படம் பிடித்து ஸ்கேன் செய்க',
    resume_cam: 'நேரலை கேமராவைத் தொடரவும்',
    choose_photo: 'புகைப்படத்தைத் தேர்ந்தெடுக்கவும்',
    flip_cam: 'கேமராவை மாற்று',
    rexai_title: 'RexAI பண்ணை நுண்ணறிவு',
    rexai_sub: 'தன்னாட்சி நியூரல் என்ஜின்',
    chat_placeholder: 'RexAI இடம் கேட்கவும் அல்லது குரல் கட்டளை...',
    ai_status: 'RexAI மூலம் இயக்கப்படுகிறது',

    // Diagnostics & System
    sys_diag: 'கண்டறிதல் (Diagnostics)',
    batt_health: 'பேட்டரி நலம் (Health)',
    voltage: 'மின்னழுத்தம் (Voltage)',
    cycles: 'சுழற்சிகள் (Cycles)',
    motor_drv: 'மோட்டார் இயக்கிகள் (Drivers)',
    sensor_arr: 'சென்சார் வரிசை (Sensors)',
    needs_sync: 'ஒத்திசைவு தேவை',
    recent_logs: 'சமீபத்திய பதிவுகள் (Logs)',
    loading_logs: 'பதிவுகள் ஏற்றப்படுகின்றன...',
    net_conn: 'பிணைய இணைப்பு',
    wifi_link: 'முதன்மை வைஃபை இணைப்பு',
    esp_server: 'ESP32-S3 சர்வர்',
    node_ws: 'Node.js வெப்சாக்கெட்',
    cam_feed: 'ரோபோ கேமரா ஊட்டம்',
    cam_offline: 'கேமரா ஆஃப்லைனில் உள்ளது',
    refresh_feed: 'புதுப்பிக்கவும்',

    // Preferences & Modals
    preferences: 'விருப்பங்கள் & அமைப்புகள்',
    select_lang: 'மொழியைத் தேர்ந்தெடுக்கவும் (Language)',
    close: 'மூடு',
    cancel: 'ரத்துசெய்',
    save: 'மாற்றங்களைச் சேமி',
    lang_updated: 'மொழி {lang} ஆக மாற்றப்பட்டது',

    // Login & Admin
    login_title: 'GE-Bot-1 உள்நுழைவு',
    username: 'பயனர் பெயர் (Username)',
    password: 'கடவுச்சொல் (Password)',
    sign_in: 'உள்நுழைக (Sign In)',
    forgot_pw: 'கடவுச்சொல் மறந்துவிட்டதா?',
    create_acc: 'கணக்கை உருவாக்கு (Sign Up)',
    fullname: 'முழுப் பெயர் (Full Name)',
    email: 'மின்னஞ்சல் முகவரி (Email)',
    register: 'பதிவு செய்க (Register)',
    back_to_login: 'உள்நுழைவுக்குத் திரும்பு',
    reset_pw: 'கடவுச்சொல்லை மீட்டமைக்கவும்',
    send_otp: 'OTP அனுப்பு',
    enter_otp: 'OTP ஐ உள்ளிடவும்',
    verify_otp: 'சரிபார்க்கவும் (Verify)',
    resend: 'மீண்டும் அனுப்பு',
    new_pw: 'புதிய கடவுச்சொல்',
    confirm_pw: 'உறுதிப்படுத்து',
    admin_users: 'பயனர்கள் மேலோட்டம்',
    live_map: 'நேரலை வரைபடம் (Map)',
    sys_alerts: 'எச்சரிக்கைகள் (Alerts)',
    history: 'வரலாறு மற்றும் தணிக்கை',
    portal_mgmt: 'போர்டல் மேலாண்மை',
    admin_panel: 'நிர்வாகக் கட்டுப்பாட்டு மையம்',
    administrator: 'நிர்வாகி (Admin)'
  },

  te: {
    // Navigation
    dashboard: 'డాష్‌బోర్డ్ (Dashboard)',
    soil_zoning: 'నేల జోనింగ్ (Soil Zoning)',
    laser_defense: 'లేజర్ రక్షణ (Laser Defense)',
    organic_calculator: 'సేంద్రీయ ఎరువుల కాలిక్యులేటర్',
    crop_rotation: 'పంట మార్పిడి ప్రణాళిక',
    leaf_scanner: 'ఆకు AI స్కానర్ (Leaf Scanner)',
    weather_irrigation: 'వాతావరణం & సాగునీరు',
    invader_security: 'చొరబాటుదారుల భద్రత (Security)',
    farm_reports: 'వ్యవసాయ నివేదికలు & దిగుబడి',
    farmer_advisory: 'రైతు సలహా (Advisory)',
    farm_analytics: 'వ్యవసాయ విశ్లేషణ (Analytics)',
    control: 'నియంత్రణ మాడ్యూల్స్ (Controls)',
    log: 'కార్యాచరణ లాగ్‌లు (Activity Logs)',
    network: 'నెట్‌వర్క్ స్థితి (Network)',
    camera: 'లైవ్ కెమెరా (Camera Live)',
    diag: 'రోబోట్ నిర్ధారణ (Diagnostics)',
    logout: 'లాగ్ అవుట్ (Logout)',

    // Operational Modes & Modules
    farmer_mode: 'రైతు మోడ్ (Farmer Mode)',
    delivery_mode: 'డెలివరీ మోడ్ (Delivery Mode)',
    campus_tour: 'క్యాంపస్ టూర్ (Campus Tour)',
    sel_module: 'కార్యాచరణ మాడ్యూల్‌ను ఎంచుకోండి',
    farm_desc: 'నేల సమాచారం, వాతావరణ డేటా మరియు గస్తీ లాగ్‌లను చూడండి.',
    delivery_desc: 'డెలివరీలు మరియు మార్గాలను ట్రాక్ చేయండి, రోబోట్‌ను పంపండి.',
    campus_desc: 'వాయిస్ AI తో మార్గదర్శక క్యాంపస్ పర్యటనను ప్రారంభించండి.',
    op_mode: 'ఆపరేటింగ్ మోడ్',
    manual: 'మాన్యువల్ (Manual)',
    line: 'లైన్ ఫాలో (Line)',
    hybrid: 'హైబ్రిడ్ (Hybrid)',
    gps: 'GPS ఆటో (GPS)',
    follow: 'ఫాలో-మీ (Follow)',
    avoid: 'అడ్డంకి నివారణ (Avoid)',

    // Hardware Controls & Driving
    sys_overview: 'సిస్టమ్ అవలోకనం (Overview)',
    hw_controls: 'రోబోటిక్ టెలిమెట్రీ & రాడార్',
    manual_drive: 'మాన్యువల్ డ్రైవ్ నియంత్రణ',
    fwd: 'ముందుకు (FWD)',
    lft: 'ఎడమ (LFT)',
    stop: 'ఆపు (STOP)',
    rgt: 'కుడి (RGT)',
    bck: 'వెనుకకు (BCK)',
    ultrasonic: 'అల్ట్రాసోనిక్ రాడార్ (HC-SR04)',
    front_clear: 'ముందు దూరం',
    safe: 'సురక్షితం',
    danger: 'ప్రమాదం',
    ir_track: 'IR లైన్ ట్రాకింగ్',
    left_ir: 'ఎడమ IR సెన్సార్',
    right_ir: 'కుడి IR సెన్సార్',
    on_path: 'మార్గంలో కేంద్రీకృతం',
    pan_scan: 'పాన్ స్కాన్ మౌంట్',
    cur_angle: 'ప్రస్తుత కోణం',
    auto_scan: 'ఆటో స్కాన్',
    flight_ctrl: 'ఫ్లైట్ కంట్రోలర్ (APM 2.8)',
    ch1_steer: 'CH1 స్టీరింగ్',
    ch2_throt: 'CH2 థ్రోటల్',
    mavlink: 'MavLink స్థితి',
    connected: 'కనెక్ట్ చేయబడింది (Connected)',

    // Telemetry & Environment
    climate: 'వాతావరణం (Climate)',
    soil_profile: 'నేల ప్రొఫైల్ (Soil)',
    farm_patrol: 'వ్యవసాయ గస్తీ (Patrol)',
    optimal_moisture: 'సరైన తేమ (Optimal)',
    safe_zone: 'సురక్షిత ప్రాంతం (Safe)',
    sector: 'సెక్టార్ (Sector)',
    speed: 'వేగం (Speed)',
    battery: 'బ్యాటరీ (Battery)',
    heading: 'దిశ (Heading)',
    location: 'స్థానం (Location)',
    temperature: 'ఉష్ణోగ్రత (Temp)',
    humidity: 'తేమ (Humidity)',
    moisture: 'నేల తేమ',
    active: 'చురుకుగా (Active)',
    online: 'ఆన్‌లైన్ (Online)',
    reset: 'రీసెట్ (Reset)',
    robot_status: 'రోబోట్ ఆన్‌లైన్ స్థితి',
    robot_live: 'రోబోట్ లైవ్ (LIVE)',
    mock_mode: 'సిమ్యులేషన్ మోడ్ (Mock)',

    // Leaf Scanner & AI
    crop_context: 'పంట సందర్భం:',
    auto_detect_crop: 'ఆటో-గుర్తింపు (ఏ పంటైనా)',
    capture_scan: 'ఆకును క్యాప్చర్ చేసి స్కాన్ చేయండి',
    resume_cam: 'లైవ్ కెమెరాను కొనసాగించండి',
    choose_photo: 'ఫోటో ఫైల్‌ను ఎంచుకోండి',
    flip_cam: 'కెమెరా మార్చండి',
    rexai_title: 'RexAI వ్యవసాయ మేధస్సు',
    rexai_sub: 'స్వయంప్రతిపత్తి న్యూరల్ ఇంజిన్',
    chat_placeholder: 'RexAI ని అడగండి లేదా ఆదేశం ఇవ్వండి...',
    ai_status: 'RexAI ద్వారా ఆధారితం',

    // Diagnostics & System
    sys_diag: 'సిస్టమ్ నిర్ధారణ (Diagnostics)',
    batt_health: 'బ్యాటరీ ఆరోగ్యం (Health)',
    voltage: 'వోల్టేజ్ (Voltage)',
    cycles: 'సైకిల్స్ (Cycles)',
    motor_drv: 'మోటార్ డ్రైవర్లు (Drivers)',
    sensor_arr: 'సెన్సార్ల శ్రేణి (Sensors)',
    needs_sync: 'సింక్ అవసరం',
    recent_logs: 'ఇటీవలి లాగ్‌లు (Logs)',
    loading_logs: 'లాగ్‌లు లోడ్ అవుతున్నాయి...',
    net_conn: 'నెట్‌వర్క్ కనెక్టివిటీ',
    wifi_link: 'ప్రధాన వైఫై లింక్',
    esp_server: 'ESP32-S3 సర్వర్',
    node_ws: 'Node.js వెబ్‌సాకెట్',
    cam_feed: 'రోబోట్ కెమెరా ఫీడ్',
    cam_offline: 'కెమెరా ఫీడ్ ఆఫ్‌లైన్',
    refresh_feed: 'ఫీడ్‌ను రిఫ్రెష్ చేయండి',

    // Preferences & Modals
    preferences: 'ప్రాధాన్యతలు & సెట్టింగ్‌లు',
    select_lang: 'భాషను ఎంచుకోండి (Language)',
    close: 'మూసివేయి',
    cancel: 'రద్దు చేయండి',
    save: 'మార్పులను సేవ్ చేయండి',
    lang_updated: 'భాష {lang} కు మారింది',

    // Login & Admin
    login_title: 'GE-Bot-1 లాగిన్',
    username: 'వినియోగదారు పేరు (Username)',
    password: 'పాస్‌వర్డ్ (Password)',
    sign_in: 'లాగిన్ చేయండి (Sign In)',
    forgot_pw: 'పాస్‌వర్డ్ మర్చిపోయారా?',
    create_acc: 'ఖాతా సృష్టించండి (Sign Up)',
    fullname: 'పూర్తి పేరు (Full Name)',
    email: 'ఇమెయిల్ చిరునామా (Email)',
    register: 'నమోదు చేయండి (Register)',
    back_to_login: 'లాగిన్‌కు తిరిగి వెళ్లు',
    reset_pw: 'పాస్‌వర్డ్ రీసెట్ చేయండి',
    send_otp: 'OTP పంపండి',
    enter_otp: 'OTP నమోదు చేయండి',
    verify_otp: 'ధృవీకరించండి (Verify)',
    resend: 'మళ్లీ పంపండి',
    new_pw: 'కొత్త పాస్‌వర్డ్',
    confirm_pw: 'నిర్ధారించండి',
    admin_users: 'వినియోగదారుల అవలోకనం',
    live_map: 'లైవ్ మ్యాప్ (Map)',
    sys_alerts: 'సిస్టమ్ హెచ్చరికలు (Alerts)',
    history: 'చరిత్ర మరియు ఆడిట్',
    portal_mgmt: 'పోర్టల్ నిర్వహణ',
    admin_panel: 'అడ్మిన్ కంట్రోల్ సెంటర్',
    administrator: 'నిర్వాహకుడు (Admin)'
  },

  bn: {
    // Navigation
    dashboard: 'ড্যাশবোর্ড (Dashboard)',
    soil_zoning: 'মাটি জোনিং (Soil Zoning)',
    laser_defense: 'লেজার প্রতিরক্ষা (Laser Defense)',
    organic_calculator: 'জৈব সার ক্যালকুলেটর',
    crop_rotation: 'ফসল আবর্তন পরিকল্পনাকারী',
    leaf_scanner: 'পাতা AI স্ক্যানার (Leaf Scanner)',
    weather_irrigation: 'আবহাওয়া ও সেচ (Irrigation)',
    invader_security: 'অনুপ্রবেশকারী নিরাপত্তা (Security)',
    farm_reports: 'খামার রিপোর্ট ও ফলন',
    farmer_advisory: 'কৃষক পরামর্শ (Advisory)',
    farm_analytics: 'খামার বিশ্লেষণ (Analytics)',
    control: 'নিয়ন্ত্রণ মডিউল (Controls)',
    log: 'কার্যকলাপ লগ (Activity Logs)',
    network: 'নেটওয়ার্ক স্থিতি (Network)',
    camera: 'লাইভ ক্যামেরা (Camera Live)',
    diag: 'রোবট নির্ণয় (Diagnostics)',
    logout: 'প্রস্থান (Logout)',

    // Operational Modes & Modules
    farmer_mode: 'কৃষক মোড (Farmer Mode)',
    delivery_mode: 'ডেলিভারি মোড (Delivery Mode)',
    campus_tour: 'ক্যাম্পাস ট্যুর (Campus Tour)',
    sel_module: 'অপারেশনাল মডিউল নির্বাচন করুন',
    farm_desc: 'মাটির প্রোফাইল, জলবায়ু ডেটা এবং খামার টহল লগ দেখুন।',
    delivery_desc: 'ডেলিভারি এবং রুট ট্র্যাক করুন, রোবট পাঠান।',
    campus_desc: 'ভয়েস AI দিয়ে নির্দেশিত ক্যাম্পাস ট্যুর শুরু করুন।',
    op_mode: 'অপারেটিং মোড',
    manual: 'ম্যানুয়াল (Manual)',
    line: 'লাইন ফলো (Line)',
    hybrid: 'হাইব্রিড (Hybrid)',
    gps: 'GPS অটো (GPS)',
    follow: 'ফলো-মি (Follow)',
    avoid: 'বাধা পরিহার (Avoid)',

    // Hardware Controls & Driving
    sys_overview: 'সিস্টেম ওভারভিউ (Overview)',
    hw_controls: 'রোবোটিক টেলিমেট্রি ও রাডার',
    manual_drive: 'ম্যানুয়াল ড্রাইভ নিয়ন্ত্রণ',
    fwd: 'সামনে (FWD)',
    lft: 'বামে (LFT)',
    stop: 'থামো (STOP)',
    rgt: 'ডানে (RGT)',
    bck: 'পিছনে (BCK)',
    ultrasonic: 'অতিস্বনক রাডার (HC-SR04)',
    front_clear: 'সামনের দূরত্ব',
    safe: 'নিরাপদ',
    danger: 'বিপদ',
    ir_track: 'IR লাইন ট্র্যাকিং',
    left_ir: 'বাম IR সেন্সর',
    right_ir: 'ডান IR সেন্সর',
    on_path: 'পথে কেন্দ্রিক',
    pan_scan: 'প্যান স্ক্যান মাউন্ট',
    cur_angle: 'বর্তমান কোণ',
    auto_scan: 'অটো স্ক্যান',
    flight_ctrl: 'ফ্লাইট কন্ট্রোলার (APM 2.8)',
    ch1_steer: 'CH1 স্টিয়ারিং',
    ch2_throt: 'CH2 থ্রোটল',
    mavlink: 'MavLink স্থিতি',
    connected: 'সংযুক্ত (Connected)',

    // Telemetry & Environment
    climate: 'জলবায়ু (Climate)',
    soil_profile: 'মাটির প্রোফাইল (Soil)',
    farm_patrol: 'খামার টহল (Patrol)',
    optimal_moisture: 'সর্বোত্তম আর্দ্রতা (Optimal)',
    safe_zone: 'নিরাপদ অঞ্চল (Safe)',
    sector: 'সেক্টর (Sector)',
    speed: 'গতি (Speed)',
    battery: 'ব্যাটারি (Battery)',
    heading: 'দিক (Heading)',
    location: 'অবস্থান (Location)',
    temperature: 'তাপমাত্রা (Temp)',
    humidity: 'আর্দ্রতা (Humidity)',
    moisture: 'মাটির আর্দ্রতা',
    active: 'সক্রিয় (Active)',
    online: 'অনলাইন (Online)',
    reset: 'রিসেট (Reset)',
    robot_status: 'রোবট অনলাইন স্থিতি',
    robot_live: 'রোবট লাইভ (LIVE)',
    mock_mode: 'সিমুলেশন মোড (Mock)',

    // Leaf Scanner & AI
    crop_context: 'ফসলের প্রসঙ্গ:',
    auto_detect_crop: 'স্বতঃ-শনাক্তকরণ (যেকোনো ফসল)',
    capture_scan: 'পাতা ক্যাপচার ও স্ক্যান করুন',
    resume_cam: 'লাইভ ক্যামেরা পুনরায় চালু করুন',
    choose_photo: 'ফটো ফাইল নির্বাচন করুন',
    flip_cam: 'ক্যামেরা উল্টান',
    rexai_title: 'RexAI খামার বুদ্ধিমত্তা',
    rexai_sub: 'স্বায়ত্তশাসিত নিউরাল ইঞ্জিন',
    chat_placeholder: 'RexAI কে জিজ্ঞাসা করুন বা ভয়েস কমান্ড দিন...',
    ai_status: 'RexAI দ্বারা চালিত',

    // Diagnostics & System
    sys_diag: 'সিস্টেম নির্ণয় (Diagnostics)',
    batt_health: 'ব্যাটারি স্বাস্থ্য (Health)',
    voltage: 'ভোল্টেজ (Voltage)',
    cycles: 'সাইকেল (Cycles)',
    motor_drv: 'মোটর ড্রাইভার (Drivers)',
    sensor_arr: 'সেন্সর অ্যারে (Sensors)',
    needs_sync: 'সিঙ্ক প্রয়োজন',
    recent_logs: 'সাম্প্রতিক লগ (Recent Logs)',
    loading_logs: 'লগ লোড হচ্ছে...',
    net_conn: 'নেটওয়ার্ক সংযোগ',
    wifi_link: 'প্রাথমিক ওয়াইফাই লিঙ্ক',
    esp_server: 'ESP32-S3 সার্ভার',
    node_ws: 'Node.js ওয়েবসকেট',
    cam_feed: 'রোবট ক্যামেরা ফিড',
    cam_offline: 'ক্যামেরা ফিড অফলাইন',
    refresh_feed: 'ফিড রিফ্রেশ করুন',

    // Preferences & Modals
    preferences: 'পছন্দ ও সেটিংস',
    select_lang: 'ভাষা নির্বাচন (Language)',
    close: 'বন্ধ করুন',
    cancel: 'বাতিল করুন',
    save: 'পরিবর্তন সংরক্ষণ করুন',
    lang_updated: 'ভাষা {lang} এ আপডেট হয়েছে',

    // Login & Admin
    login_title: 'GE-Bot-1 লগইন',
    username: 'ব্যবহারকারীর নাম (Username)',
    password: 'পাসওয়ার্ড (Password)',
    sign_in: 'সাইন ইন করুন (Sign In)',
    forgot_pw: 'পাসওয়ার্ড ভুলে গেছেন?',
    create_acc: 'অ্যাকাউন্ট তৈরি করুন (Sign Up)',
    fullname: 'পুরো নাম (Full Name)',
    email: 'ইমেল ঠিকানা (Email)',
    register: 'নিবন্ধন করুন (Register)',
    back_to_login: 'লগইনে ফিরে যান',
    reset_pw: 'পাসওয়ার্ড রিসেট করুন',
    send_otp: 'OTP পাঠান',
    enter_otp: 'OTP কোড লিখুন',
    verify_otp: 'যাচাই করুন (Verify)',
    resend: 'পুনরায় পাঠান',
    new_pw: 'নতুন পাসওয়ার্ড',
    confirm_pw: 'নিশ্চিত করুন',
    admin_users: 'ব্যবহারকারী পর্যালোচনা',
    live_map: 'লাইভ মানচিত্র (Map)',
    sys_alerts: 'সিস্টেম সতর্কতা (Alerts)',
    history: 'ইতিহাস ও নিরীক্ষা',
    portal_mgmt: 'পোর্টাল পরিচালনা',
    admin_panel: 'অ্যাডমিন কন্ট্রোল সেন্টার',
    administrator: 'প্রশাসক (Admin)'
  }
};

// ── Smart DOM Phrase Replacement Mapping ─────────────────────
// Enables automatic zero-latency translation of UI text even without explicit data-i18n attributes
const PHRASE_DICTIONARY = [
  { en: 'Dashboard', key: 'dashboard' },
  { en: 'Field Soil & Zoning', key: 'soil_zoning' },
  { en: 'Soil Zoning', key: 'soil_zoning' },
  { en: 'Laser Weed & Pest', key: 'laser_defense' },
  { en: 'Laser Defense', key: 'laser_defense' },
  { en: 'Organic Fertilizer (P25)', key: 'organic_calculator' },
  { en: 'Organic Calculator', key: 'organic_calculator' },
  { en: 'Next Crop AI', key: 'crop_rotation' },
  { en: 'Crop Rotation Planner', key: 'crop_rotation' },
  { en: 'Crop Rotation', key: 'crop_rotation' },
  { en: 'Foliar AI Scanner', key: 'leaf_scanner' },
  { en: 'Leaf Scanner', key: 'leaf_scanner' },
  { en: 'Weather & Irrigation', key: 'weather_irrigation' },
  { en: 'Perimeter Security', key: 'invader_security' },
  { en: 'Invader Security', key: 'invader_security' },
  { en: 'Farm Patrol Report', key: 'farm_reports' },
  { en: 'Farm Reports & Yield', key: 'farm_reports' },
  { en: 'Farm Reports', key: 'farm_reports' },
  { en: 'Farmer Advisory', key: 'farmer_advisory' },
  { en: 'Farm Analytics', key: 'farm_analytics' },
  { en: 'Analytics', key: 'farm_analytics' },
  { en: 'Control Modules', key: 'control' },
  { en: 'Activity Log', key: 'log' },
  { en: 'Activity Logs', key: 'log' },
  { en: 'Network Status', key: 'network' },
  { en: 'Network & Connectivity', key: 'net_conn' },
  { en: 'Camera Live', key: 'camera' },
  { en: 'Robot Diagnostics', key: 'diag' },
  { en: 'Diagnostics', key: 'sys_diag' },
  { en: 'Logout', key: 'logout' },
  { en: 'Robot Online Status', key: 'robot_status' },
  { en: 'Farmer Mode', key: 'farmer_mode' },
  { en: 'Delivery Mode', key: 'delivery_mode' },
  { en: 'Campus Tour', key: 'campus_tour' },
  { en: 'Campus Guide', key: 'campus_tour' },
  { en: 'Climate', key: 'climate' },
  { en: 'Soil Profile', key: 'soil_profile' },
  { en: 'Farm Patrol', key: 'farm_patrol' },
  { en: 'Optimal Moisture', key: 'optimal_moisture' },
  { en: 'Safe Zone', key: 'safe_zone' },
  { en: 'Operating Mode', key: 'op_mode' },
  { en: 'Manual Drive Override', key: 'manual_drive' },
  { en: 'Ultrasonic Radar (HC-SR04)', key: 'ultrasonic' },
  { en: 'Front Clearance', key: 'front_clear' },
  { en: 'IR Line Tracking', key: 'ir_track' },
  { en: 'Left IR array', key: 'left_ir' },
  { en: 'Right IR array', key: 'right_ir' },
  { en: 'On Path Centered', key: 'on_path' },
  { en: 'Pan Scan Mount', key: 'pan_scan' },
  { en: 'Auto Scan', key: 'auto_scan' },
  { en: 'Capture & Scan Leaf', key: 'capture_scan' },
  { en: 'Resume Live Camera', key: 'resume_cam' },
  { en: 'Choose Photo File', key: 'choose_photo' },
  { en: 'Flip Camera', key: 'flip_cam' },
  { en: 'Crop Context:', key: 'crop_context' },
  { en: 'Select Operational Module', key: 'sel_module' },
  { en: 'Select Language', key: 'select_lang' },
  { en: 'Close', key: 'close' },
  { en: 'Cancel', key: 'cancel' },
  { en: 'Reset', key: 'reset' },
  { en: 'Active', key: 'active' },
  { en: 'Safe', key: 'safe' },
  { en: 'Online', key: 'online' },
  { en: 'Battery Health', key: 'batt_health' },
  { en: 'Motor Drivers', key: 'motor_drv' },
  { en: 'Sensors Array', key: 'sensor_arr' },
  { en: 'RexAI Intelligence', key: 'rexai_title' },
  { en: 'Sign In', key: 'sign_in' },
  { en: 'Register', key: 'register' },
  { en: 'Forgot Password?', key: 'forgot_pw' },
  { en: 'Create Account', key: 'create_acc' }
];

// ── Headless Google Translate Integration (Full Page Deep Translation) ──
function initHeadlessGoogleTranslate() {
  if (window._googleTranslateInitStarted) return;
  window._googleTranslateInitStarted = true;

  // 1. Add style to suppress third-party toolbar and banners
  const style = document.createElement('style');
  style.id = 'dynorex-gt-style';
  style.innerHTML = `
    .goog-te-banner-frame, .goog-te-banner-frame.skiptranslate { display: none !important; }
    body { top: 0px !important; position: static !important; }
    .goog-tooltip, .goog-tooltip:hover { display: none !important; }
    #goog-gt-tt, .goog-te-balloon-frame { display: none !important; }
    .goog-te-gadget { display: none !important; }
    font { background-color: transparent !important; box-shadow: none !important; }
    #google_translate_element { display: none !important; }
  `;
  document.head.appendChild(style);

  // 2. Hidden container
  let container = document.getElementById('google_translate_element');
  if (!container) {
    container = document.createElement('div');
    container.id = 'google_translate_element';
    container.style.display = 'none';
    document.body.appendChild(container);
  }

  // 3. Callback
  window.googleTranslateElementInit = function() {
    try {
      new window.google.translate.TranslateElement({
        pageLanguage: 'en',
        includedLanguages: 'en,hi,mr,gu,pa,ta,te,bn',
        autoDisplay: false
      }, 'google_translate_element');

      // Sync language after init
      const current = localStorage.getItem('dyno_lang') || 'en';
      if (current !== 'en') triggerGoogleTranslate(current);
    } catch(e) {
      // Offline fallback
    }
  };

  // 4. Inject Google Translate script
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  script.async = true;
  document.head.appendChild(script);
}

function triggerGoogleTranslate(lang) {
  try {
    if (lang === 'en') {
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=' + window.location.hostname + '; path=/;';
    } else {
      document.cookie = `googtrans=/en/${lang}; path=/;`;
      document.cookie = `googtrans=/en/${lang}; domain=${window.location.hostname}; path=/;`;
    }

    const select = document.querySelector('.goog-te-combo');
    if (select) {
      select.value = lang;
      select.dispatchEvent(new Event('change'));
    }
  } catch(e) { }
}

// ── Apply High-Speed Native Translations ─────────────────────
function applyTranslations(lang) {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  if (!dict) return;

  // 1. Explicit data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    let val = dict[key] || TRANSLATIONS.en[key];
    if (!val) return;

    if (el.tagName === 'INPUT' && el.hasAttribute('placeholder')) {
      el.setAttribute('placeholder', val);
      return;
    }

    const icon = el.querySelector('i');
    if (icon) {
      const iconHTML = icon.outerHTML;
      el.innerHTML = iconHTML + ' ' + val;
    } else {
      el.textContent = val;
    }
  });

  // 2. Intelligent phrase walker for buttons, card headers, and navigation
  const walkerElements = document.querySelectorAll(
    '.nav-btn, .sec-title, .cc-title, .ic-title, .adv-title, .stat-label, .action-btn, .btn, .hud-tag'
  );

  walkerElements.forEach(el => {
    // Store original english text once
    if (!el.hasAttribute('data-orig-text')) {
      // Extract text content excluding icon
      const clone = el.cloneNode(true);
      clone.querySelectorAll('i, svg, img, span.sim-badge').forEach(n => n.remove());
      const rawText = clone.textContent.trim();
      if (rawText) el.setAttribute('data-orig-text', rawText);
    }

    const origText = el.getAttribute('data-orig-text');
    if (!origText) return;

    // Find phrase match
    const match = PHRASE_DICTIONARY.find(p => p.en.toLowerCase() === origText.toLowerCase());
    if (match && dict[match.key]) {
      const translated = dict[match.key];
      const icon = el.querySelector('i');
      const badge = el.querySelector('.sim-badge');
      
      let newHtml = '';
      if (icon) newHtml += icon.outerHTML + ' ';
      newHtml += `<span>${translated}</span>`;
      if (badge) newHtml += ' ' + badge.outerHTML;
      
      el.innerHTML = newHtml;
    } else if (lang === 'en') {
      const icon = el.querySelector('i');
      const badge = el.querySelector('.sim-badge');
      let resetHtml = '';
      if (icon) resetHtml += icon.outerHTML + ' ';
      resetHtml += `<span>${origText}</span>`;
      if (badge) resetHtml += ' ' + badge.outerHTML;
      el.innerHTML = resetHtml;
    }
  });

  // 3. Update active state in language modal buttons
  document.querySelectorAll('#lang-modal button').forEach(btn => {
    const isThis = btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`'${lang}'`);
    if (isThis) {
      btn.style.borderColor = 'var(--primary, #0284c7)';
      btn.style.background = 'rgba(2, 132, 199, 0.15)';
    } else {
      btn.style.borderColor = 'var(--border, rgba(255,255,255,0.1))';
      btn.style.background = 'transparent';
    }
  });
}

// ── Set Language Across the Entire System ────────────────────
function setLanguage(lang) {
  localStorage.setItem('dyno_lang', lang);
  
  // Close modal
  const m = document.getElementById('lang-modal');
  if (m) m.style.display = 'none';

  // 1. Instant local dictionary translation
  applyTranslations(lang);

  // 2. Trigger headless Google Translate for 100% full-site translation
  triggerGoogleTranslate(lang);

  // 3. Toast notification
  const langNames = {
    en: 'English',
    hi: 'हिंदी (Hindi)',
    mr: 'मराठी (Marathi)',
    gu: 'ગુજરાતી (Gujarati)',
    pa: 'ਪੰਜਾਬੀ (Punjabi)',
    ta: 'தமிழ் (Tamil)',
    te: 'తెలుగు (Telugu)',
    bn: 'বাংলা (Bengali)'
  };
  const targetName = langNames[lang] || lang.toUpperCase();
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const msg = (dict.lang_updated || TRANSLATIONS.en.lang_updated).replace('{lang}', targetName);
  
  if (typeof showToast === 'function') {
    showToast(msg, 'success');
  }
}

// ── Auto-apply saved language on load and dynamic render ─────
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('dyno_lang') || 'en';
  applyTranslations(saved);

  // Initialize deep translator
  initHeadlessGoogleTranslate();

  // Re-apply after short delays to catch asynchronously rendered widgets
  setTimeout(() => applyTranslations(saved), 400);
  setTimeout(() => applyTranslations(saved), 1200);
  setTimeout(() => applyTranslations(saved), 2500);
});

// Export globally
window.TRANSLATIONS = TRANSLATIONS;
window.applyTranslations = applyTranslations;
window.setLanguage = setLanguage;
