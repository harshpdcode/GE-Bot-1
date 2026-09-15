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

