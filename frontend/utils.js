// Global Frontend Utilities

// Toast UI Popups
function showToast(msg, type = 'info') {
    let toastContainer = document.getElementById('toast-container');
    
    // If no toast container, create one automatically
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.position = 'fixed';
        toastContainer.style.top = '20px';
        toastContainer.style.right = '20px';
        toastContainer.style.zIndex = '9999';
        toastContainer.style.display = 'flex';
        toastContainer.style.flexDirection = 'column';
        toastContainer.style.gap = '10px';
        toastContainer.style.pointerEvents = 'none';
        document.body.appendChild(toastContainer);
    }
    
    const box = document.createElement('div');
    const colors = { info: '#3b82f6', success: '#22c55e', warning: '#f59e0b', danger: '#ef4444' };
    const icons = { info: 'fa-info-circle', success: 'fa-check-circle', warning: 'fa-triangle-exclamation', danger: 'fa-circle-xmark' };
    const isDarkMode = document.body.classList.contains('dark-mode');
    const bgColor = isDarkMode ? '#1e293b' : 'white';
    const textColor = isDarkMode ? '#f8fafc' : '#0f172a';
    const shadowColor = isDarkMode ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.15)';
    
    box.style.background = bgColor; 
    box.style.borderLeft = `4px solid ${colors[type]}`; 
    box.style.padding = '16px 20px'; 
    box.style.borderRadius = '8px'; 
    box.style.boxShadow = `0 10px 25px ${shadowColor}`; 
    box.style.display = 'flex'; 
    box.style.alignItems = 'center'; 
    box.style.gap = '12px'; 
    box.style.minWidth = '250px'; 
    box.style.transform = 'translateX(120%)'; 
    box.style.transition = '0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'; 
    box.style.pointerEvents = 'auto';
    box.innerHTML = `<i class="fa-solid ${icons[type]}" style="color:${colors[type]}; font-size:1.2rem;"></i><div style="font-weight:600; color:${textColor}; font-size:0.9rem;">${msg}</div>`;
    
    toastContainer.appendChild(box);
    setTimeout(() => box.style.transform = 'translateX(0)', 10);
    setTimeout(() => { 
        box.style.transform = 'translateX(120%)'; 
        setTimeout(() => box.remove(), 400); 
    }, 4000);
}

// Override native UI popups
window.alert = function(msg) { showToast(msg, 'warning'); };

// =============================================
// GE-Bot-1 PWA & INSTALL PROMPT MANAGER
// =============================================
(function initPWA() {
    // 1. Ensure Favicon & Manifest are present
    const ensureHeadLink = (rel, href, type = '') => {
        if (!document.querySelector(`link[rel="${rel}"]`)) {
            const link = document.createElement('link');
            link.rel = rel;
            link.href = href;
            if (type) link.type = type;
            document.head.appendChild(link);
        }
    };

    ensureHeadLink('icon', '/assets/logo.png', 'image/png');
    ensureHeadLink('apple-touch-icon', '/assets/logo.png');
    ensureHeadLink('manifest', '/manifest.json');

    // 2. Register Service Worker for Chrome PWA Installability
    if ('serviceWorker' in navigator && (window.location.protocol === 'http:' || window.location.protocol === 'https:')) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('[PWA] ServiceWorker registered:', reg.scope))
                .catch(err => console.warn('[PWA] ServiceWorker registration failed:', err));
        });
    }

    // 3. Capture Native Chrome Install Prompt
    window.deferredPrompt = null;

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isStandalone) {
        console.log('[PWA] Running in standalone PWA mode');
        return; // Already running as an installed PWA
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        window.deferredPrompt = e;
        console.log('[PWA] beforeinstallprompt captured');
        showPWAInstallPrompt();
    });

    window.addEventListener('appinstalled', () => {
        console.log('[PWA] App successfully installed');
        showToast('GE-Bot-1 App installed successfully!', 'success');
        const banner = document.getElementById('pwa-install-banner');
        if (banner) banner.remove();
        window.deferredPrompt = null;
    });

    // Global Install Trigger Function
    window.triggerPWAInstall = async function() {
        if (window.deferredPrompt) {
            window.deferredPrompt.prompt();
            const { outcome } = await window.deferredPrompt.userChoice;
            console.log('[PWA] User choice:', outcome);
            if (outcome === 'accepted') {
                showToast('Installing GE-Bot-1...', 'success');
                const banner = document.getElementById('pwa-install-banner');
                if (banner) banner.remove();
            }
            window.deferredPrompt = null;
        } else {
            // Chrome desktop address bar or browser menu guidance
            showToast('To install: click the Install icon (⊕) in Chrome\'s address bar or Chrome Menu (⋮) → "Install GE-Bot-1"', 'info');
        }
    };

    function showPWAInstallPrompt() {
        // Prevent duplicate banners or if previously dismissed
        if (localStorage.getItem('pwa_prompt_dismissed') === 'true') return;
        if (document.getElementById('pwa-install-banner')) return;

        const banner = document.createElement('div');
        banner.id = 'pwa-install-banner';
        banner.style.cssText = `
            position: fixed;
            bottom: 16px;
            right: 16px;
            z-index: 999;
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(37, 99, 235, 0.25);
            box-shadow: 0 16px 36px rgba(0, 0, 0, 0.16);
            border-radius: 16px;
            padding: 12px 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            max-width: 380px;
            animation: pwaSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            font-family: -apple-system, BlinkMacSystemFont, 'Outfit', 'Segoe UI', Roboto, sans-serif;
            color: #0f172a;
        `;

        banner.innerHTML = `
            <style>
                @keyframes pwaSlideUp {
                    from { transform: translateY(40px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                body.dark-mode #pwa-install-banner {
                    background: rgba(30, 41, 59, 0.98) !important;
                    border-color: rgba(59, 130, 246, 0.3) !important;
                    color: #f8fafc !important;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4) !important;
                }
                #pwa-btn-install:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
                }
                @media (max-width: 600px) {
                    #pwa-install-banner {
                        left: 12px !important;
                        right: 12px !important;
                        bottom: 12px !important;
                        max-width: calc(100% - 24px) !important;
                        padding: 10px 14px !important;
                    }
                }
            </style>
            <img src="/assets/logo.png" alt="GE-Bot-1" style="width: 40px; height: 40px; border-radius: 50%; object-fit: contain; box-shadow: 0 4px 10px rgba(34,197,94,0.3); border: 2px solid #22c55e; flex-shrink: 0;">
            <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 800; font-size: 0.92rem; line-height: 1.2; display: flex; align-items: center; gap: 6px;">
                    GE-Bot-1
                    <span style="font-size: 0.65rem; background: #dbeafe; color: #1d4ed8; padding: 2px 8px; border-radius: 12px; font-weight: 700;">APP</span>
                </div>
                <div style="font-size: 0.76rem; color: #64748b; margin-top: 2px; line-height: 1.25;">Fast standalone access & offline telemetry</div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <button id="pwa-btn-install" onclick="window.triggerPWAInstall()" style="
                    background: linear-gradient(135deg, #2563eb, #1d4ed8);
                    color: white;
                    border: none;
                    padding: 8px 14px;
                    border-radius: 10px;
                    font-weight: 700;
                    font-size: 0.82rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    transition: 0.2s;
                    white-space: nowrap;
                ">
                    <i class="fa-solid fa-download" style="font-size: 0.8rem;"></i> Install
                </button>
                <button onclick="localStorage.setItem('pwa_prompt_dismissed', 'true'); document.getElementById('pwa-install-banner')?.remove()" style="
                    background: transparent;
                    border: none;
                    color: #94a3b8;
                    cursor: pointer;
                    font-size: 1.1rem;
                    padding: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                " title="Dismiss">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        `;

        document.body.appendChild(banner);
    }

    // Auto-show install prompt after 3.5 seconds if supported and not dismissed
    setTimeout(() => {
        if (window.deferredPrompt && localStorage.getItem('pwa_prompt_dismissed') !== 'true') {
            showPWAInstallPrompt();
        }
    }, 3500);
})();


