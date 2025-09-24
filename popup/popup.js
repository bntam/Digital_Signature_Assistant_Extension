// Popup JavaScript
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Popup loaded');
    
    // Get DOM elements
    const connectionStatus = document.getElementById('connectionStatus');
    const currentDomain = document.getElementById('currentDomain');
    const lastUpdate = document.getElementById('lastUpdate');
    const openDashboardBtn = document.getElementById('openDashboardBtn');
    const refreshStatusBtn = document.getElementById('refreshStatusBtn');
    
    // Check current tab domain
    async function checkCurrentTab() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab) {
                const url = new URL(tab.url);
                currentDomain.textContent = url.hostname;
                
                // Check if we're on the target domain
                if (url.hostname.includes('bvphuyen.vncare.vn')) {
                    currentDomain.classList.add('connected');
                    return true;
                } else {
                    currentDomain.classList.remove('connected');
                    return false;
                }
            }
        } catch (error) {
            console.error('Error checking current tab:', error);
            currentDomain.textContent = 'Lỗi';
            return false;
        }
    }
    
    // Check connection status
    async function checkConnectionStatus() {
        connectionStatus.textContent = 'Đang kiểm tra...';
        connectionStatus.className = 'status-value loading';
        
        const isTargetDomain = await checkCurrentTab();
        
        if (isTargetDomain) {
            connectionStatus.textContent = 'Sẵn sàng';
            connectionStatus.className = 'status-value connected';
        } else {
            connectionStatus.textContent = 'Không trên domain mục tiêu';
            connectionStatus.className = 'status-value error';
        }
        
        // Update last update time
        const now = new Date();
        lastUpdate.textContent = now.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // Open medical dashboard
    function openDashboard() {
        const dashboardUrl = chrome.runtime.getURL('medical-dashboard.html');
        chrome.tabs.create({ url: dashboardUrl });
        window.close(); // Close popup
    }
    
    // Event listeners
    openDashboardBtn.addEventListener('click', openDashboard);
    refreshStatusBtn.addEventListener('click', () => {
        refreshStatusBtn.classList.add('loading');
        checkConnectionStatus().then(() => {
            refreshStatusBtn.classList.remove('loading');
        });
    });
    
    // Initial status check
    await checkConnectionStatus();
});
