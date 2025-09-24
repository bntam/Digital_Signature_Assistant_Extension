// Background service worker for BV Phuyen extension

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openDashboard') {
    chrome.tabs.create({
      url: message.url
    }).then(tab => {
      console.log('Medical dashboard opened in new tab:', tab.id);
      
      // Store session data from main tab for the dashboard to use
      if (message.sessionData) {
        console.log('Background: Storing session data for dashboard:', {
          hasUuid: !!message.sessionData.uuid,
          hasSmartca: !!message.sessionData.smartca
        });
        
        chrome.storage.local.set({
          'extractedSessionData': message.sessionData,
          'sessionDataTimestamp': Date.now()
        });
      }
    });
  }
  
  // Handle requests to extract data from BV Phuyen tabs
  if (message.action === 'extractDataFromMainTab') {
    extractDataFromBVPhuyenTab(sendResponse);
    return true; // Keep message channel open for async response
  }
  
  // Handle SmartCA trigger request
  if (message.action === 'triggerSmartCAOnMainTab') {
    triggerSmartCAOnBVPhuyenTab(sendResponse);
    return true; // Keep message channel open for async response
  }
  
  // Handle SmartCA sessionStorage updates from main tab
  if (message.action === 'smartcaUpdated') {
    console.log('🔄 Background: SmartCA data updated from tab:', sender.tab?.id);
    console.log('📊 SmartCA data details:', {
      hasData: !!message.smartcaData,
      length: message.smartcaData ? message.smartcaData.length : 0,
      timestamp: message.timestamp
    });
    
    // Store updated SmartCA data for extension tabs to access
    chrome.storage.local.set({
      'smartcaSessionData': message.smartcaData,
      'smartcaUpdateTimestamp': message.timestamp
    }).then(() => {
      console.log('✅ SmartCA data stored in chrome.storage.local');
      
      // Immediately notify all extension tabs about SmartCA update
      notifyExtensionTabsSmartCAUpdate(message.smartcaData, message.timestamp);
    }).catch((error) => {
      console.error('❌ Failed to store SmartCA data:', error);
    });
    
    sendResponse({ success: true, timestamp: message.timestamp });
    return true; // Keep message channel open
  }
  
  // Handle SmartCA cleared notification
  if (message.action === 'smartcaCleared') {
    console.log('🗑️ Background: SmartCA data cleared, notifying extension tabs...');
    
    // Clear stored SmartCA data
    chrome.storage.local.remove(['smartcaSessionData', 'smartcaUpdateTimestamp']).then(() => {
      console.log('✅ SmartCA data cleared from chrome.storage.local');
      
      // Notify all extension tabs about SmartCA clearing
      notifyExtensionTabsSmartCAUpdate(null, new Date().toISOString());
    });
    
    sendResponse({ success: true, timestamp: new Date().toISOString() });
    return true; // Keep message channel open
  }
});

// Function to find and extract data from BV Phuyen tab
async function extractDataFromBVPhuyenTab(sendResponse) {
  try {
    // Find BV Phuyen tab
    const tabs = await chrome.tabs.query({
      url: 'https://bvphuyen.vncare.vn/*'
    });
    
    if (tabs.length === 0) {
      sendResponse({ 
        success: false, 
        error: 'No BV Phuyen tab found. Please open https://bvphuyen.vncare.vn/ first.' 
      });
      return;
    }
    
    const bvTab = tabs[0];
    console.log('Background: Found BV Phuyen tab:', bvTab.id);
    
    // Send message to content script on BV Phuyen tab to extract data
    chrome.tabs.sendMessage(bvTab.id, { action: 'extractSessionData' }, (response) => {
      if (chrome.runtime.lastError) {
        sendResponse({ 
          success: false, 
          error: 'Could not communicate with BV Phuyen tab: ' + chrome.runtime.lastError.message 
        });
        return;
      }
      
      if (response && response.success) {
        console.log('Background: Successfully extracted data from main tab');
        sendResponse({ success: true, data: response.data });
      } else {
        sendResponse({ 
          success: false, 
          error: 'Failed to extract data from BV Phuyen tab' 
        });
      }
    });
    
  } catch (error) {
    console.error('Background: Error extracting data from main tab:', error);
    sendResponse({ 
      success: false, 
      error: error.message 
    });
  }
}

// Function to trigger SmartCA on BV Phuyen tab
async function triggerSmartCAOnBVPhuyenTab(sendResponse) {
  try {
    // Find BV Phuyen tab
    const tabs = await chrome.tabs.query({
      url: 'https://bvphuyen.vncare.vn/*'
    });
    
    if (tabs.length === 0) {
      sendResponse({ 
        success: false, 
        error: 'No BV Phuyen tab found. Please open https://bvphuyen.vncare.vn/ first.' 
      });
      return;
    }
    
    const bvTab = tabs[0];
    console.log('Background: Triggering SmartCA on BV Phuyen tab:', bvTab.id);
    
    // Switch to the BV Phuyen tab first
    chrome.tabs.update(bvTab.id, { active: true });
    chrome.windows.update(bvTab.windowId, { focused: true });
    
    // Send message to trigger SmartCA
    chrome.tabs.sendMessage(bvTab.id, { action: 'triggerSmartCA' }, (response) => {
      if (chrome.runtime.lastError) {
        sendResponse({ 
          success: false, 
          error: 'Could not communicate with BV Phuyen tab: ' + chrome.runtime.lastError.message 
        });
        return;
      }
      
      if (response) {
        console.log('Background: SmartCA trigger response:', response);
        sendResponse(response);
      } else {
        sendResponse({ 
          success: false, 
          error: 'No response from SmartCA trigger' 
        });
      }
    });
    
  } catch (error) {
    console.error('Background: Error triggering SmartCA:', error);
    sendResponse({ 
      success: false, 
      error: error.message 
    });
  }
}

// Function to notify extension tabs about SmartCA updates
async function notifyExtensionTabsSmartCAUpdate(smartcaData, timestamp) {
  try {
    // Find all extension dashboard tabs
    const allTabs = await chrome.tabs.query({});
    console.log(`🔍 Background: Found ${allTabs.length} total tabs`);
    
    const extensionTabs = allTabs.filter(tab => 
      tab.url && tab.url.includes('medical-dashboard.html')
    );
    
    console.log(`📡 Background: Found ${extensionTabs.length} extension tabs:`, 
      extensionTabs.map(tab => ({ id: tab.id, url: tab.url }))
    );
    
    if (extensionTabs.length === 0) {
      console.log('📭 No extension tabs found to notify - storing data for future tabs');
      return;
    }
    
    const updateMessage = {
      action: 'smartcaDataUpdated',
      smartcaData: smartcaData,
      timestamp: timestamp || new Date().toISOString()
    };
    
    // Send message to each extension tab with Promise-based approach
    const notifications = extensionTabs.map(tab => 
      new Promise((resolve) => {
        try {
          console.log(`📤 Sending SmartCA update to tab ${tab.id}...`);
          
          chrome.tabs.sendMessage(tab.id, updateMessage, (response) => {
            if (chrome.runtime.lastError) {
              console.error(`❌ Failed to send to tab ${tab.id}:`, chrome.runtime.lastError.message);
              resolve({ tabId: tab.id, success: false, error: chrome.runtime.lastError.message });
            } else {
              console.log(`✅ SmartCA update sent to tab ${tab.id}, response:`, response);
              resolve({ tabId: tab.id, success: true, response: response });
            }
          });
          
        } catch (error) {
          console.warn(`⚠️ Exception sending to tab ${tab.id}:`, error);
          resolve({ tabId: tab.id, success: false, error: error.message });
        }
      })
    );
    
    // Wait for all notifications to complete
    const results = await Promise.all(notifications);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`📊 Background: SmartCA notification summary - Success: ${successful}, Failed: ${failed}`);
    
    if (failed > 0) {
      console.warn('❌ Some notifications failed:', results.filter(r => !r.success));
    }
    
  } catch (error) {
    console.error('❌ Error notifying extension tabs:', error);
  }
}

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Open medical dashboard when extension icon is clicked
  const dashboardUrl = chrome.runtime.getURL('medical-dashboard.html');
  chrome.tabs.create({
    url: dashboardUrl
  });
});

console.log('BV Phuyen Extension: Background script loaded');
