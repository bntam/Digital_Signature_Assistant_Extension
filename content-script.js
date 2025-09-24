// Content script for BV Phuyen extension
// This script runs on pages matching https://bvphuyen.vncare.vn/*

(function() {
  'use strict';

  // Check if we're on the target domain
  if (!window.location.hostname.includes('bvphuyen.vncare.vn')) {
    return;
  }

  console.log('BV Phuyen Extension: Content script loaded');

  // Create and inject the status icon
  function createStatusIcon() {
    // Remove existing icon if present
    const existingIcon = document.querySelector('.bv-status-icon');
    if (existingIcon) {
      existingIcon.remove();
    }

    // Create the status icon
    const statusIcon = document.createElement('div');
    statusIcon.className = 'bv-status-icon';
    statusIcon.title = 'Click để mở Phần mềm hỗ trợ chữ ký số nhanh';
    
    // Add tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'bv-status-tooltip';
    tooltip.textContent = 'Digital Signature Assistant Extension';
    statusIcon.appendChild(tooltip);

    // Add click event to open new tab
    statusIcon.addEventListener('click', openMedicalDashboard);

    // Inject into page
    document.body.appendChild(statusIcon);
    
    console.log('BV Phuyen Extension: Status icon created');
  }

  // Function to extract session data from current tab
  function extractSessionData() {
    const sessionData = {
      uuid: null,
      smartca: null,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    // Extract SmartCA data from sessionStorage
    try {
      const smartcaData = sessionStorage.getItem('hisl2_smartca');
      if (smartcaData) {
        sessionData.smartca = JSON.parse(smartcaData);
        console.log('✅ SmartCA data extracted from sessionStorage');
      }
    } catch (error) {
      console.warn('⚠️ Failed to extract SmartCA data:', error);
    }

    try {
      // Extract UUID from page source (RestInfo object in HTML)
      sessionData.uuid = extractUuidFromPageSource();
      if (sessionData.uuid) {
        console.log('Content Script: UUID extracted from page source:', sessionData.uuid.substring(0, 30) + '...');
      }

      // Extract SmartCA session from sessionStorage
      const smartcaSession = sessionStorage.getItem('hisl2_smartca');
      if (smartcaSession && smartcaSession !== 'null' && smartcaSession !== 'undefined') {
        sessionData.smartca = smartcaSession;
        console.log('Content Script: SmartCA session extracted from sessionStorage');
      }

      console.log('Content Script: Extracted session data:', {
        hasUuid: !!sessionData.uuid,
        hasSmartca: !!sessionData.smartca,
        url: sessionData.url
      });

    } catch (error) {
      console.error('Content Script: Error extracting session data:', error);
    }

    return sessionData;
  }

  // Function to extract UUID from page source HTML
  function extractUuidFromPageSource() {
    try {
      // Method 1: Try to get from RestInfo object (if available in window)
      if (window.RestInfo && window.RestInfo.uuid) {
        console.log('Content Script: UUID found in window.RestInfo');
        return window.RestInfo.uuid;
      }

      // Method 2: Try to get from uuid variable (if available in window)  
      if (window.uuid) {
        console.log('Content Script: UUID found in window.uuid');
        return window.uuid;
      }

      // Method 3: Parse HTML source to extract UUID from script tags
      const htmlContent = document.documentElement.outerHTML;
      
      // Look for RestInfo object definition
      const restInfoMatch = htmlContent.match(/var\s+RestInfo\s*=\s*{[^}]*uuid:\s*['"]([^'"]+)['"]/);
      if (restInfoMatch && restInfoMatch[1]) {
        console.log('Content Script: UUID extracted from RestInfo script block');
        return restInfoMatch[1];
      }

      // Look for standalone uuid variable
      const uuidMatch = htmlContent.match(/var\s+uuid\s*=\s*['"]([^'"]+)['"]/);
      if (uuidMatch && uuidMatch[1]) {
        console.log('Content Script: UUID extracted from uuid variable');
        return uuidMatch[1];
      }

      // Look for uuid in any script tag
      const scriptUuidMatch = htmlContent.match(/uuid:\s*['"]([^'"]+)['"]/);
      if (scriptUuidMatch && scriptUuidMatch[1]) {
        console.log('Content Script: UUID extracted from script tag');
        return scriptUuidMatch[1];
      }

      console.warn('Content Script: UUID not found in page source');
      return null;

    } catch (error) {
      console.error('Content Script: Error extracting UUID from page source:', error);
      return null;
    }
  }

  // Function to trigger SmartCA login if needed
  function triggerSmartCALogin() {
    try {
      const smartcaIcon = document.getElementById('smartcaicon');
      if (smartcaIcon) {
        console.log('Content Script: Clicking smartcaicon to trigger SmartCA login');
        smartcaIcon.click();
        return true;
      } else {
        console.warn('Content Script: smartcaicon not found on page');
        return false;
      }
    } catch (error) {
      console.error('Content Script: Error clicking smartcaicon:', error);
      return false;
    }
  }

  // Function to open medical dashboard in new tab
  function openMedicalDashboard() {
    // First extract session data from current tab
    const sessionData = extractSessionData();
    
    const dashboardUrl = chrome.runtime.getURL('medical-dashboard.html');
    chrome.runtime.sendMessage({
      action: 'openDashboard',
      url: dashboardUrl,
      sessionData: sessionData // Pass extracted session data
    });
  }

  // Function to monitor SmartCA sessionStorage changes
  function setupSmartCAMonitor() {
    let lastSmartCAData = sessionStorage.getItem('hisl2_smartca');
    console.log('🔍 SmartCA Monitor - Initial state:', {
      hasSmartCA: !!lastSmartCAData,
      length: lastSmartCAData ? lastSmartCAData.length : 0
    });
    
    // Enhanced monitoring with multiple approaches for better reliability
    
    // Method 1: Storage event listener (most reliable for cross-tab changes)
    window.addEventListener('storage', (e) => {
      if (e.key === 'hisl2_smartca' || e.key === null) {
        console.log('🔄 Storage event detected for hisl2_smartca:', {
          key: e.key,
          oldValue: e.oldValue ? 'EXISTS' : 'NULL',
          newValue: e.newValue ? 'EXISTS' : 'NULL'
        });
        
        // Get current value from sessionStorage
        const currentSmartCAData = sessionStorage.getItem('hisl2_smartca');
        if (currentSmartCAData !== lastSmartCAData) {
          notifySmartCAChange(currentSmartCAData);
          lastSmartCAData = currentSmartCAData;
        }
      }
    });
    
    // Method 2: Enhanced setInterval with reduced frequency but better detection
    const monitorInterval = setInterval(() => {
      try {
        const currentSmartCAData = sessionStorage.getItem('hisl2_smartca');
        
        // Only log when there's actually a change to reduce noise
        if (currentSmartCAData !== lastSmartCAData) {
          console.log('� SmartCA sessionStorage CHANGED! Details:', {
            before: lastSmartCAData ? 'EXISTS' : 'NULL',
            after: currentSmartCAData ? 'EXISTS' : 'NULL',
            beforeLength: lastSmartCAData ? lastSmartCAData.length : 0,
            afterLength: currentSmartCAData ? currentSmartCAData.length : 0,
            timestamp: new Date().toISOString()
          });
          
          notifySmartCAChange(currentSmartCAData);
          lastSmartCAData = currentSmartCAData;
        }
      } catch (error) {
        console.error('❌ Error monitoring SmartCA sessionStorage:', error);
      }
    }, 1000); // Reduced to 1 second for faster detection
    
    // Method 3: Custom event listener for SmartCA changes (if the app fires custom events)
    document.addEventListener('smartcaUpdated', (e) => {
      console.log('🔄 Custom smartcaUpdated event detected:', e.detail);
      const currentSmartCAData = sessionStorage.getItem('hisl2_smartca');
      if (currentSmartCAData !== lastSmartCAData) {
        notifySmartCAChange(currentSmartCAData);
        lastSmartCAData = currentSmartCAData;
      }
    });
    
    // Method 4: Override sessionStorage.setItem to catch direct modifications
    const originalSetItem = sessionStorage.setItem;
    sessionStorage.setItem = function(key, value) {
      const result = originalSetItem.apply(this, arguments);
      
      if (key === 'hisl2_smartca') {
        console.log('🔄 Direct sessionStorage.setItem detected for hisl2_smartca');
        // Use setTimeout to ensure the value is actually set
        setTimeout(() => {
          const currentSmartCAData = sessionStorage.getItem('hisl2_smartca');
          if (currentSmartCAData !== lastSmartCAData) {
            notifySmartCAChange(currentSmartCAData);
            lastSmartCAData = currentSmartCAData;
          }
        }, 10);
      }
      
      return result;
    };
    
    // Helper function to notify about SmartCA changes
    function notifySmartCAChange(currentSmartCAData) {
      if (currentSmartCAData && currentSmartCAData !== 'null') {
        console.log('📡 Sending smartcaUpdated message to background...');
        
        // Send updated SmartCA data to extension
        chrome.runtime.sendMessage({
          action: 'smartcaUpdated',
          smartcaData: currentSmartCAData,
          timestamp: new Date().toISOString()
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('❌ Error sending smartcaUpdated:', chrome.runtime.lastError);
          } else {
            console.log('✅ SmartCA data sent to extension, response:', response);
          }
        });
        
      } else {
        console.log('📡 Sending smartcaCleared message to background...');
        
        // SmartCA data was removed/cleared
        chrome.runtime.sendMessage({
          action: 'smartcaCleared',
          timestamp: new Date().toISOString()
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('❌ Error sending smartcaCleared:', chrome.runtime.lastError);
          } else {
            console.log('🗑️ SmartCA cleared notification sent, response:', response);
          }
        });
      }
    }
    
    console.log('🔍 SmartCA sessionStorage monitor started with enhanced detection methods');
    
    // Also add manual check function for debugging
    window.debugSmartCAMonitor = () => {
      const data = sessionStorage.getItem('hisl2_smartca');
      console.log('🐛 Manual SmartCA check:', {
        hasData: !!data,
        length: data ? data.length : 0,
        preview: data ? data.substring(0, 100) + '...' : 'NULL'
      });
    };
  }

  // Initialize the extension
  function init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', createStatusIcon);
    } else {
      createStatusIcon();
    }

    // Also create icon when page is fully loaded (in case of dynamic content)
    window.addEventListener('load', createStatusIcon);
    
    // Setup SmartCA sessionStorage monitoring
    setupSmartCAMonitor();
  }

  // Check if user is authenticated (look for JWT token or session indicators)
  function checkAuthentication() {
    // Look for common authentication indicators
    const hasAuthToken = document.cookie.includes('JSESSIONID') || 
                        localStorage.getItem('authToken') || 
                        sessionStorage.getItem('authToken');
    
    return hasAuthToken;
  }

  // Update icon status based on authentication
  function updateIconStatus() {
    const icon = document.querySelector('.bv-status-icon');
    if (!icon) return;

    if (checkAuthentication()) {
      icon.className = 'bv-status-icon success';
      icon.title = 'Authenticated - Click to open Medical Dashboard';
    } else {
      icon.className = 'bv-status-icon';
      icon.title = 'Click to open Medical Dashboard';
    }
  }

  // Listen for authentication changes
  function setupAuthenticationListener() {
    // Monitor for login/logout events
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      return originalFetch.apply(this, args).then(response => {
        // Update status after API calls that might change auth state
        setTimeout(updateIconStatus, 500);
        return response;
      });
    };

    // Monitor storage changes
    window.addEventListener('storage', updateIconStatus);
    
    // Initial status check
    setTimeout(updateIconStatus, 1000);
  }

  // Listen for messages from extension (dashboard or popup)
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Content Script: Received message:', message);
    
    if (message.action === 'extractSessionData') {
      const sessionData = extractSessionData();
      sendResponse({ success: true, data: sessionData });
      return true; // Keep channel open for async response
    }
    
    if (message.action === 'triggerSmartCA') {
      const success = triggerSmartCALogin();
      
      // Wait a bit then re-extract data after SmartCA login attempt
      setTimeout(() => {
        const updatedSessionData = extractSessionData();
        sendResponse({ 
          success: success, 
          triggered: success,
          data: updatedSessionData 
        });
      }, 2000); // Wait 2 seconds for SmartCA to process
      
      return true; // Keep channel open for async response
    }
    
    return false;
  });

  // Start the extension
  init();
  setupAuthenticationListener();

})();
