// DynoRex X1 - Offline Multilingual Translation Engine
const TRANSLATIONS = {
  en: {
    dashboard: 'Dashboard', control: 'Control Modules', log: 'Activity Log',
    network: 'Network Status', camera: 'Camera Live', diag: 'Robot Diagnostics', logout: 'Logout',
    online: 'Online', reset: 'Reset', farmer_mode: 'Farmer Mode', delivery_mode: 'Delivery Mode', campus_tour: 'Campus Tour',
    sys_overview: 'System Overview', hw_controls: 'Robotic Hardware Controls',
    climate: 'Climate', soil_profile: 'Soil Profile', farm_patrol: 'Farm Patrol',
    optimal_moisture: 'Optimal Moisture', safe_zone: 'Safe Zone', sector: 'Sector',
    op_mode: 'Operating Mode', manual: 'Manual', line: 'Line', hybrid: 'Hybrid', gps: 'GPS', follow: 'Follow', avoid: 'Avoid',
    sys_exec: 'System executing', manual_drive: 'Manual Drive Override',
    fwd: 'FWD', lft: 'LFT', stop: 'STOP', rgt: 'RGT', bck: 'BCK',
    ultrasonic: 'Ultrasonic Radar (HC-SR04)', front_clear: 'Front Clearance', safe: 'Safe',
    ir_track: 'IR Line Tracking', left_ir: 'Left IR array', right_ir: 'Right IR array', on_path: 'On Path Centered',
    pan_scan: 'Pan Scan Mount', cur_angle: 'Current Angle', auto_scan: 'Auto Scan',
    flight_ctrl: 'Flight Controller (APM 2.8)', ch1_steer: 'CH1 Steering', ch2_throt: 'CH2 Throttle', mavlink: 'MavLink Status', connected: 'CONNECTED',
    sel_module: 'Select Operational Module', farm_module: 'Farm Module', logistics: 'Logistics Module', nav_module: 'Navigation Module',
    farm_desc: 'View soil profile, climate data, and farm patrol logs.', delivery_desc: 'Track deliveries, routes, and dispatch the robot.', campus_desc: 'Start guided campus tours with voice AI.', campus_tours: 'Campus Tours',
    recent_logs: 'Activity Logs', loading_logs: 'Loading logs...',
    net_conn: 'Connectivity', wifi_link: 'Primary WiFi Link', excellent: 'Excellent', esp_server: 'ESP32-S3 Server', responding: 'Responding', node_ws: 'Node.js WebSocket',
    cam_feed: 'Robot Camera Feed', cam_offline: 'Camera Feed Offline', cam_desc: 'Enable the camera module via hardware setup to view stream.', refresh_feed: 'Refresh Feed',
    sys_diag: 'Diagnostics', batt_health: 'Battery Health', optimal: 'Optimal', voltage: 'Voltage', cycles: 'Cycles', motor_drv: 'Motor Drivers', active: 'Active', l298n: 'L298N Normal', temp: 'Temp', sensor_arr: 'Sensors Array', needs_sync: 'Needs Sync', ir_ultra: 'IR/Ultrasonic ready',
    robot_status: 'Robot Online Status', rexai_title: 'RexAI Intelligence', rexai_sub: 'Fine-tuned Model Engine', chat_placeholder: 'Type a command or tap mic...',
    preferences: 'Preferences', select_lang: 'Select Language', close: 'Close',
    detected: 'DETECTED', speed: 'Speed', battery: 'Battery', heading: 'Heading', location: 'Location',
    admin_users: 'Users Overview', live_map: 'Live Map', sys_alerts: 'System Alerts', history: 'History', portal_mgmt: 'Portal Management', admin_panel: 'Admin Control Center', administrator: 'Administrator',
    login_title: 'GE-Bot-1 Login', username: 'Username', password: 'Password', sign_in: 'Sign In', forgot_pw: 'Forgot Password?', create_acc: 'Create Account',
    fullname: 'Full Name', email: 'Email', register: 'Register', back_to_login: 'Back to Login', reset_pw: 'Reset Password', send_otp: 'Send OTP',
    enter_otp: 'Enter OTP Code', verify_otp: 'Verify OTP', resend: 'Resend', new_pw: 'New Password', confirm_pw: 'Confirm Password',
    lang_updated: 'Language updated to {lang}', ai_status: 'Powered by RexAI Architecture'
  },
  hi: {
    dashboard: 'डैशबोर्ड (Dashboard)', control: 'नियंत्रण मॉड्यूल (Control)', log: 'गतिविधि लॉग (Logs)',
    network: 'नेटवर्क स्थिति (Network)', camera: 'कैमरा लाइव (Camera)', diag: 'रोबोट निदान (Diagnostics)', logout: 'लॉग आउट (Logout)',
    online: 'ऑनलाइन (Online)', reset: 'रीसेट (Reset)', farmer_mode: 'किसान मोड (Farmer)', delivery_mode: 'डिलीवरी मोड (Delivery)', campus_tour: 'कैम्पस टूर (Campus)',
    sys_overview: 'सिस्टम अवलोकन (System Overview)', hw_controls: 'रोबोटिक हार्डवेयर नियंत्रण (Hardware Controls)',
    climate: 'जलवायु (Climate)', soil_profile: 'मिट्टी प्रोफ़ाइल (Soil)', farm_patrol: 'खेत गश्त (Patrol)',
    optimal_moisture: 'इष्टतम नमी', safe_zone: 'सुरक्षित क्षेत्र', sector: 'सेक्टर',
    op_mode: 'ऑपरेटिंग मोड (Operating Mode)', manual: 'मैनुअल (Manual)', line: 'लाइन (Line)', hybrid: 'हाइब्रिड (Hybrid)', gps: 'GPS', follow: 'फॉलो (Follow)', avoid: 'अवॉइड (Avoid)',
    sys_exec: 'सिस्टम चल रहा है', manual_drive: 'मैनुअल ड्राइव (Manual Drive)',
    fwd: 'आगे (FWD)', lft: 'बाएं (LFT)', stop: 'रुको (STOP)', rgt: 'दाएं (RGT)', bck: 'पीछे (BCK)',
    ultrasonic: 'अल्ट्रासोनिक रडार (HC-SR04)', front_clear: 'सामने की दूरी (Front Clearance)', safe: 'सुरक्षित',
    ir_track: 'IR लाइन ट्रैकिंग (IR Tracking)', left_ir: 'बायां IR सेंसर', right_ir: 'दायां IR सेंसर', on_path: 'पथ पर केंद्रित',
    pan_scan: 'पैन स्कैन माउंट (Pan Scan)', cur_angle: 'वर्तमान कोण', auto_scan: 'ऑটো स्कैन',
    flight_ctrl: 'फ्लाइट कंट्रोलर (APM 2.8)', ch1_steer: 'CH1 स्टीयरिंग', ch2_throt: 'CH2 थ्रॉटल', mavlink: 'MavLink स्थिति', connected: 'जुड़ा हुआ',
    sel_module: 'ऑपरेशनल मॉड्यूल चुनें (Select Module)', farm_module: 'खेत मॉड्यूल (Farm)', logistics: 'लॉजिस्टिक्स (Logistics)', nav_module: 'नेविगेशन (Navigation)',
    recent_logs: 'हालिया गतिविधि लॉग (Logs)', net_conn: 'नेटवर्क और कनेक्टिविटी (Network)', cam_feed: 'कॅमेरा फीड (Camera)',
    sys_diag: 'सिस्टम डायग्नोस्टिक्स (Diagnostics)', batt_health: 'बैटरी स्वास्थ्य (Battery)', motor_drv: 'मोटर ड्राइवर (Motors)', sensor_arr: 'सेंसर एरे (Sensors)', 
    preferences: 'प्राथमिकताएँ (Preferences)', select_lang: 'भाषा चुनें (Language)', close: 'बंद करें',
    admin_users: 'उपयोगकर्ता अवलोकन (Users)', live_map: 'लाइव मैप (Map)', sys_alerts: 'सिस्टम अलर्ट (Alerts)', history: 'इतिहास (History)', portal_mgmt: 'पोर्टल प्रबंधन (Portal)', admin_panel: 'एडमिन कंट्रोल सेंटर (Admin)', administrator: 'प्रशासक (Admin)',
    login_title: 'डाइनोरेक्स X1 लॉगिन (Login)', username: 'यूजरनेम (Username)', password: 'पासवर्ड (Password)', sign_in: 'साइन इन (Sign In)', forgot_pw: 'पासवर्ड भूल गए?', create_acc: 'खाता बनाएँ (Create)',
    fullname: 'पूरा नाम (Full Name)', email: 'ईमेल (Email)', register: 'पंजीकरण (Register)', back_to_login: 'लॉगिन पर वापस', reset_pw: 'पासवर्ड रीसेट (Reset)', send_otp: 'ओटीपी भेजें (OTP)',
    enter_otp: 'ओटीपी कोड (OTP Code)', verify_otp: 'सत्यापित (Verify)', resend: 'पुनः भेजें (Resend)', new_pw: 'नया पासवर्ड (New PW)', confirm_pw: 'पुष्टि करें (Confirm)',
    lang_updated: 'भाषा {lang} में अपडेट की गई', ai_status: 'RexAI आर्किटेक्चर द्वारा संचालित (RexAI)', rexai_title: 'RexAI इंटेलिजेंस', rexai_sub: 'AI इंजन'
  },
  mr: {
    dashboard: 'डॅशबोर्ड (Dashboard)', control: 'नियंत्रण (Control)', log: 'अहवाल (Logs)',
    network: 'नेटवर्क (Network)', camera: 'कॅमेरा (Camera)', diag: 'तपासणी (Diagnostics)', logout: 'बाहेर पडा (Logout)',
    online: 'ऑनलाइन (Online)', reset: 'रीसेट (Reset)', farmer_mode: 'शेतकरी मोड (Farmer)', delivery_mode: 'डिलिव्हरी मोड (Delivery)',
    sys_overview: 'सिस्टम आढावा (System Overview)', hw_controls: 'हार्डवेअर नियंत्रण (Controls)',
    op_mode: 'ऑपरेटिंग मोड (Operating Mode)', manual: 'मॅन्युअल (Manual)', line: 'लाइन (Line)', hybrid: 'हायब्रिड (Hybrid)', gps: 'GPS', follow: 'फॉलो (Follow)', avoid: 'टाळा (Avoid)',
    manual_drive: 'मॅन्युअल ड्राइव्ह (Manual Drive)',
    fwd: 'पुढे (FWD)', lft: 'डावे (LFT)', stop: 'थांबा (STOP)', rgt: 'उजवे (RGT)', bck: 'मागे (BCK)',
    recent_logs: 'अलीकडील अहवाल (Logs)', preferences: 'प्राधान्ये (Preferences)', select_lang: 'भाषा निवडा (Language)', close: 'बंद (Close)',
    admin_users: 'वापरकर्ता आढावा (Users)', live_map: 'लाईव्ह नकाशा (Map)', sys_alerts: 'अलर्ट (Alerts)', history: 'इतिहास (History)',
    login_title: 'लॉगिन (Login)', username: 'वापरकर्ता नाव (Username)', password: 'पासवर्ड (Password)', sign_in: 'साइन इन (Sign In)', forgot_pw: 'पासवर्ड विसरलात?', create_acc: 'खाते तयार करा',
    fullname: 'पूर्ण नाव (Full Name)', email: 'ईमेल (Email)', register: 'नोंदणी (Register)', back_to_login: 'परत जा', reset_pw: 'पासवर्ड रीसेट (Reset)', send_otp: 'OTP पाठवा (Send OTP)',
    verify_otp: 'तपासा (Verify)', resend: 'पुन्हा पाठवा (Resend)', new_pw: 'नवीन पासवर्ड (New PW)', confirm_pw: 'पुष्टी करा',
    lang_updated: 'भाषा {lang} अद्यतनित केली', ai_status: 'RexAI द्वारा संचालित', rexai_title: 'RexAI इंटेलिजेंस', rexai_sub: 'AI इंजिन'
  },
  gu: {
    dashboard: 'ડેશબોર્ડ (Dashboard)', control: 'નિયંત્રણ (Control)', log: 'લૉગ્સ (Logs)',
    network: 'નેટવર્ક (Network)', camera: 'કેમેરા (Camera)', diag: 'નિદાન (Diagnostics)', logout: 'લૉગ આઉટ (Logout)',
    online: 'ઓનલાઇન (Online)', reset: 'રીસેટ (Reset)', farmer_mode: 'ખેડૂત મોડ (Farmer)', delivery_mode: 'ડિલિવરી મોડ (Delivery)',
    sys_overview: 'સિસ્ટમ ઓવરવ્યૂ (System Overview)', hw_controls: 'હાર્ડવેર નિયંત્રણ (Controls)',
    op_mode: 'ઓપરેટિંગ મોડ (Operating Mode)', manual: 'મેન્યુઅલ (Manual)', line: 'લાઇન (Line)', hybrid: 'હાઇબ્રિડ (Hybrid)', gps: 'GPS', follow: 'ફૉલો (Follow)', avoid: 'ટાળો (Avoid)',
    manual_drive: 'મેન્યુઅલ ડ્રાઇવ (Manual Drive)',
    fwd: 'આગળ (FWD)', lft: 'ડાબે (LFT)', stop: 'રોકો (STOP)', rgt: 'જમણે (RGT)', bck: 'પાછળ (BCK)',
    recent_logs: 'લૉગ્સ (Activity Logs)', preferences: 'પસંદગીઓ (Preferences)', select_lang: 'ભાષા પસંદ કરો (Language)', close: 'બંધ (Close)',
    admin_users: 'વપરાશકર્તા ઓવરવ્યૂ (Users)', live_map: 'લાઇવ નકશો (Map)', sys_alerts: 'એલર્ટ (Alerts)', history: 'ઇતિહાસ (History)',
    login_title: 'લોગિન (Login)', username: 'વપરાશકર્તા નામ (Username)', password: 'પાસવર્ડ (Password)', sign_in: 'સાઇન ઇન (Sign In)', forgot_pw: 'પાસવર્ડ ભૂલી ગયા?',
    fullname: 'પૂરું નામ (Full Name)', email: 'ઈમેલ (Email)', register: 'રજીસ્ટર (Register)', back_to_login: 'પાછા જાઓ', reset_pw: 'રીસેટ કરો (Reset)', send_otp: 'OTP મોકલો',
    verify_otp: 'ચકાસો (Verify)', resend: 'ફરીથી મોકલો (Resend)', new_pw: 'નવો પાસવર્ડ (New PW)', confirm_pw: 'પુષ્ટિ કરો',
    lang_updated: 'ભાષા {lang} માં અપડેટ થઈ', ai_status: 'RexAI દ્વારા સંચાલિત', rexai_title: 'RexAI ઇન્ટેલિજન્સ', rexai_sub: 'AI એન્જિન'
  },
  pa: {
    dashboard: 'ਡੈਸ਼ਬੋਰਡ (Dashboard)', control: 'ਕੰਟਰੋਲ (Control)', log: 'ਲਾਗ (Logs)',
    network: 'ਨੈੱਟਵਰਕ (Network)', camera: 'ਕੈਮਰਾ (Camera)', diag: 'ਤਸ਼ਖੀਸ (Diagnostics)', logout: 'ਲਾਗ ਆਉਟ (Logout)',
    online: 'ਔਨਲਾਈਨ (Online)', reset: 'ਰੀਸੈੱਟ (Reset)',
    sys_overview: 'ਸਿਸਟਮ ਸੰਖੇਪ (System Overview)', hw_controls: 'ਕੰਟਰੋਲ (Hardware Controls)',
    op_mode: 'ਓਪਰੇਟਿੰਗ ਮੋਡ (Operating Mode)', manual: 'ਮੈਨੂਅਲ (Manual)', line: 'ਲਾਈਨ (Line)',
    fwd: 'ਅੱਗੇ (FWD)', lft: 'ਖੱਬੇ (LFT)', stop: 'ਰੁਕੋ (STOP)', rgt: 'ਸੱਜੇ (RGT)', bck: 'ਪਿੱਛੇ (BCK)',
    recent_logs: 'ਲਾਗ (Activity Logs)', preferences: 'ਤਰਜੀਹਾਂ (Preferences)', select_lang: 'ਭਾਸ਼ਾ ਚੁਣੋ (Language)', close: 'ਬੰਦ (Close)',
    admin_users: 'ਯੂਜ਼ਰ ਸੰਖੇਪ (Users)', live_map: 'ਨਕਸ਼ਾ (Live Map)', sys_alerts: 'ਅਲਰਟ (Alerts)', history: 'ਇਤਿਹਾਸ (History)',
    login_title: 'ਲੌਗਿਨ (Login)', username: 'ਯੂਜ਼ਰਨਾਮ (Username)', password: 'ਪਾਸਵਰਡ (Password)', sign_in: 'ਸਾਈਨ ਇਨ (Sign In)',
    lang_updated: 'ਭਾਸ਼ਾ {lang} ਅਪਡੇਟ ਹੋ ਗਈ', ai_status: 'RexAI ਦੁਆਰਾ ਸੰਚਾਲਿਤ', rexai_title: 'RexAI ਬੁੱਧੀ', rexai_sub: 'AI ਇੰਜਨ'
  },
  ta: {
    dashboard: 'கட்டுப்பாட்டகம் (Dashboard)', control: 'கட்டுப்பாடு (Control)', log: 'பதிவுகள் (Logs)',
    network: 'பிணையம் (Network)', camera: 'கேமரா (Camera)', diag: 'கண்டறிதல் (Diagnostics)', logout: 'வெளியேறு (Logout)',
    online: 'ஆன்லைன் (Online)', reset: 'மீட்டமை (Reset)',
    sys_overview: 'மேலோட்டம் (System Overview)', hw_controls: 'கட்டுப்பாடுகள் (Hardware Controls)',
    op_mode: 'இயக்க முறை (Operating Mode)', manual: 'கைமுறை (Manual)', line: 'கோடு (Line)',
    fwd: 'முன் (FWD)', lft: 'இடது (LFT)', stop: 'நிறுத்து (STOP)', rgt: 'வலது (RGT)', bck: 'பின் (BCK)',
    recent_logs: 'பதிவுகள் (Activity Logs)', preferences: 'விருப்பங்கள் (Preferences)', select_lang: 'மொழி தேர்வு (Language)', close: 'மூடு (Close)',
    admin_users: 'பயனர் மேலோட்டம் (Users)', live_map: 'வரைபடம் (Map)', sys_alerts: 'எச்சரிக்கைகள் (Alerts)', history: 'வரலாறு (History)',
    login_title: 'உள்நுழைவு (Login)', username: 'பயனர் பெயர் (Username)', password: 'கடவுச்சொல் (Password)', sign_in: 'உள்நுழைக (Sign In)',
    lang_updated: 'மொழி {lang} மாற்றப்பட்டது', ai_status: 'RexAI மூலம் இயக்கப்படுகிறது', rexai_title: 'RexAI நுண்ணறிவு', rexai_sub: 'AI என்ஜின்'
  },
  te: {
    dashboard: 'డాష్‌బోర్డ్ (Dashboard)', control: 'నియంత్రణ (Control)', log: 'లాగ్‌లు (Logs)',
    network: 'నెట్‌వర్క్ (Network)', camera: 'కెమెరా (Camera)', diag: 'నిర్ధారణ (Diagnostics)', logout: 'లాగ్ అవుట్ (Logout)',
    online: 'ఆన్‌లైన్ (Online)', reset: 'రీసెట్ (Reset)',
    sys_overview: 'అవలోకనం (System Overview)', hw_controls: 'హార్డ్‌వేర్ (Hardware Controls)',
    op_mode: 'ఆపరేటింగ్ మెడ్ (Operating Mode)', manual: 'మాన్యువల్ (Manual)', line: 'లైన్ (Line)',
    fwd: 'ముందుకు (FWD)', lft: 'ఎడమ (LFT)', stop: 'ఆపు (STOP)', rgt: 'కుడి (RGT)', bck: 'వెనుకకు (BCK)',
    recent_logs: 'లాగ్‌లు (Activity Logs)', preferences: 'ప్రాధాన్యతలు (Preferences)', select_lang: 'భాష ఎంచుకోండి (Language)', close: 'మూసివేయి (Close)',
    admin_users: 'యూజర్లు (Users)', live_map: 'మ్యాప్ (Map)', sys_alerts: 'అలర్ట్‌లు (Alerts)', history: 'చరిత్ర (History)',
    login_title: 'లాగిన్ (Login)', username: 'యూజర్ పేరు (Username)', password: 'పాస్‌వర్డ్ (Password)', sign_in: 'లాగిన్ (Sign In)',
    lang_updated: 'భాష {lang} మారింది', ai_status: 'RexAI ద్వారా ఆధారితం', rexai_title: 'RexAI మేధస్సు', rexai_sub: 'AI ఇంజిన్'
  },
  bn: {
    dashboard: 'ড্যাশবোর্ড (Dashboard)', control: 'নিয়ন্ত্রণ (Control)', log: 'লগ (Logs)',
    network: 'নেটওয়ার্ক (Network)', camera: 'ক্যামেরা (Camera)', diag: 'নির্ণয় (Diagnostics)', logout: 'প্রস্থান (Logout)',
    online: 'অনলাইন (Online)', reset: 'রিসেট (Reset)',
    sys_overview: 'ওভারভিউ (System Overview)', hw_controls: 'হার্ডওয়্যার (Hardware Controls)',
    op_mode: 'অপারেটিং মোড (Operating Mode)', manual: 'ম্যানুয়াল (Manual)', line: 'লাইন (Line)',
    fwd: 'সামনে (FWD)', lft: 'বামে (LFT)', stop: 'থামো (STOP)', rgt: 'ডানে (RGT)', bck: 'পিছনে (BCK)',
    recent_logs: 'লগ (Activity Logs)', preferences: 'পছন্দসমূহ (Preferences)', select_lang: 'ভাষা নির্বাচন (Language)', close: 'বন্ধ (Close)',
    admin_users: 'ব্যবহারকারী (Users)', live_map: 'ম্যাপ (Map)', sys_alerts: 'সতর্কতা (Alerts)', history: 'ইতিহাস (History)',
    login_title: 'লগইন (Login)', username: 'ইউজারনেম (Username)', password: 'পাসওয়ার্ড (Password)', sign_in: 'সাইন ইন (Sign In)',
    lang_updated: 'ভাষা {lang} এ আপডেট হয়েছে', ai_status: 'RexAI দ্বারা চালিত', rexai_title: 'RexAI বুদ্ধিমত্তা', rexai_sub: 'AI ইঞ্জিন'
  }
};

// Apply translations to all elements with data-i18n attribute
function applyTranslations(lang) {
  const dict = TRANSLATIONS[lang];
  if (!dict) return;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    let val = dict[key] || (TRANSLATIONS.en[key] || '');
    if (!val) return;
    
    // Handle input placeholders
    if (el.tagName === 'INPUT' && el.hasAttribute('placeholder')) {
      el.setAttribute('placeholder', val);
      return;
    }

    // Preserve the first <i> icon inside the element
    const icon = el.querySelector('i');
    if (icon) {
      const iconHTML = icon.outerHTML;
      el.innerHTML = iconHTML + ' ' + val;
    } else {
      el.textContent = val;
    }
  });
}

function setLanguage(lang) {
  localStorage.setItem('dyno_lang', lang);
  const m = document.getElementById('lang-modal');
  if (m) m.style.display = 'none';
  applyTranslations(lang);
  
  let msg = (TRANSLATIONS[lang].lang_updated || TRANSLATIONS.en.lang_updated).replace('{lang}', lang.toUpperCase());
  if (typeof showToast === 'function') showToast(msg, 'success');
}

// Auto-apply saved language on every page load
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('dyno_lang') || 'en';
  if (saved !== 'en') {
    applyTranslations(saved);
    // Re-apply after short delays to catch elements rendered by other scripts
    setTimeout(() => applyTranslations(saved), 500);
    setTimeout(() => applyTranslations(saved), 1500);
  }
});
