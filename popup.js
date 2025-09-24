// Popup script for BV Phuyen extension

document.addEventListener('DOMContentLoaded', function() {
    console.log('Popup loaded');
    
    // Elements
    const openDashboardBtn = document.getElementById('openDashboardBtn');
    const refreshStatusBtn = document.getElementById('refreshStatusBtn');
    const connectionStatus = document.getElementById('connectionStatus');
    const currentDomain = document.getElementById('currentDomain');
    const lastUpdate = document.getElementById('lastUpdate');

    // Initialize popup
    init();

    // Event listeners
    if (openDashboardBtn) {
        openDashboardBtn.addEventListener('click', openDashboard);
    }

    if (refreshStatusBtn) {
        refreshStatusBtn.addEventListener('click', refreshStatus);
    }

    // Initialize popup state
    function init() {
        checkCurrentTab();
        updateLastUpdateTime();
    }

    // Open medical dashboard
    function openDashboard() {
        const dashboardUrl = chrome.runtime.getURL('medical-dashboard.html');
        chrome.tabs.create({ url: dashboardUrl }, (tab) => {
            console.log('Dashboard opened:', tab.id);
            window.close(); // Close popup
        });
    }

    // Refresh status
    function refreshStatus() {
        if (refreshStatusBtn) {
            refreshStatusBtn.disabled = true;
            refreshStatusBtn.innerHTML = '<span class="icon loading">🔄</span> Đang kiểm tra...';
        }

        checkCurrentTab();
        
        setTimeout(() => {
            if (refreshStatusBtn) {
                refreshStatusBtn.disabled = false;
                refreshStatusBtn.innerHTML = '<span class="icon">🔄</span> Làm mới';
            }
        }, 2000);
    }

    // Check current tab
    function checkCurrentTab() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs && tabs[0]) {
                const tab = tabs[0];
                const url = new URL(tab.url);
                
                if (currentDomain) {
                    currentDomain.textContent = url.hostname;
                }

                // Check if on target domain
                if (url.hostname.includes('bvphuyen.vncare.vn')) {
                    updateConnectionStatus(true, 'Trên domain mục tiêu');
                } else {
                    updateConnectionStatus(false, 'Không trên domain BV Phuyen');
                }
            }
        });
    }

    // Update connection status
    function updateConnectionStatus(isConnected, message) {
        if (!connectionStatus) return;

        connectionStatus.textContent = message;
        
        if (isConnected) {
            connectionStatus.className = 'status-value connected';
        } else {
            connectionStatus.className = 'status-value error';
        }
    }

    // Update last update time
    function updateLastUpdateTime() {
        if (lastUpdate) {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
            });
            lastUpdate.textContent = timeStr;
        }
    }
});
