// Popup script for Tab Counter (disguised AI assistant)

let clickCount = 0;
let clickTimer = null;

document.addEventListener('DOMContentLoaded', () => {
  const coverInterface = document.getElementById('coverInterface');
  const hiddenInterface = document.getElementById('hiddenInterface');
  const clickTrigger = document.getElementById('clickTrigger');
  const hideBtn = document.getElementById('hideBtn');
  
  // Tab counter functionality
  updateTabStats();
  
  // Hidden unlock mechanism - click total tabs 5 times
  clickTrigger.addEventListener('click', () => {
    clickCount++;
    
    if (clickTimer) {
      clearTimeout(clickTimer);
    }
    
    if (clickCount >= 5) {
      // Unlock!
      coverInterface.style.display = 'none';
      hiddenInterface.style.display = 'block';
      clickCount = 0;
      loadHiddenInterface();
    } else {
      // Reset counter after 2 seconds
      clickTimer = setTimeout(() => {
        clickCount = 0;
      }, 2000);
    }
  });
  
  // Hide settings button
  if (hideBtn) {
    hideBtn.addEventListener('click', () => {
      coverInterface.style.display = 'block';
      hiddenInterface.style.display = 'none';
    });
  }
  
  // Refresh button
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', updateTabStats);
  }
});

async function updateTabStats() {
  try {
    const tabs = await chrome.tabs.query({});
    const windows = await chrome.windows.getAll();
    
    document.getElementById('totalTabs').textContent = tabs.length;
    document.getElementById('totalWindows').textContent = windows.length;
    
    // Update badge with tab count
    chrome.action.setBadgeText({ text: tabs.length.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#667eea' });
    
    // Display tab list
    const tabList = document.getElementById('tabList');
    tabList.innerHTML = tabs.slice(0, 10).map(tab => `
      <div class="tab-item">
        <img class="tab-favicon" src="${tab.favIconUrl || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22><rect width=%2216%22 height=%2216%22 fill=%22%23ddd%22/></svg>'}" onerror="this.style.display='none'">
        <div class="tab-title">${tab.title}</div>
      </div>
    `).join('');
    
    if (tabs.length > 10) {
      tabList.innerHTML += `<div class="tab-item" style="text-align: center; color: #999;">...and ${tabs.length - 10} more</div>`;
    }
  } catch (error) {
    console.error('Error updating tab stats:', error);
  }
}

function loadHiddenInterface() {
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const clearLogBtn = document.getElementById('clearLogBtn');
  const testBtn = document.getElementById('testBtn');
  const savePresetsBtn = document.getElementById('savePresetsBtn');
  const modelSelect = document.getElementById('modelSelect');
  const saveModelBtn = document.getElementById('saveModelBtn');
  const status = document.getElementById('status');
  
  // Load existing API key
  chrome.storage.sync.get(['geminiApiKey'], (result) => {
    if (result.geminiApiKey) {
      apiKeyInput.value = result.geminiApiKey;
    }
  });
  
  // Load selected model
  chrome.storage.sync.get(['geminiModel'], (result) => {
    if (result.geminiModel) {
      modelSelect.value = result.geminiModel;
    } else {
      modelSelect.value = 'gemini-2.5-flash-lite';
    }
  });
  
  // Load presets
  loadPresets();
  
  // Load activity log
  loadActivityLog();
  
  // Save API key
  saveBtn.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      showStatus('Please enter an API key', 'error');
      return;
    }
    
    chrome.storage.sync.set({ geminiApiKey: apiKey }, () => {
      showStatus('API key saved successfully!', 'success');
      addLogEntry('API key saved', 'success');
    });
  });
  
  // Save presets
  savePresetsBtn.addEventListener('click', () => {
    const presets = {};
    for (let i = 1; i <= 3; i++) {
      const text = document.getElementById(`preset${i}`).value;
      presets[`preset${i}`] = text;
    }
    
    chrome.storage.sync.set({ presets }, () => {
      showStatus('Presets saved successfully!', 'success');
      addLogEntry('Presets saved', 'success');
    });
  });
  
  // Save model
  saveModelBtn.addEventListener('click', () => {
    const model = modelSelect.value;
    chrome.storage.sync.set({ geminiModel: model }, () => {
      showStatus('Model saved successfully!', 'success');
      addLogEntry(`Model changed to ${model}`, 'success');
    });
  });
  
  // Test button
  testBtn.addEventListener('click', () => {
    addLogEntry('🧪 Test button clicked', 'info');
    chrome.runtime.sendMessage({ action: 'manualTrigger' }, (response) => {
      if (chrome.runtime.lastError) {
        addLogEntry(`Error: ${chrome.runtime.lastError.message}`, 'error');
      }
    });
  });
  
  // Clear log
  clearLogBtn.addEventListener('click', () => {
    chrome.storage.local.set({ activityLog: [] }, () => {
      loadActivityLog();
    });
  });
  
  // Allow Enter key to save
  apiKeyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      saveBtn.click();
    }
  });
  
  function showStatus(message, type) {
    status.textContent = message;
    status.className = `status ${type}`;
    
    setTimeout(() => {
      status.className = 'status';
    }, 3000);
  }
  
  function loadActivityLog() {
    chrome.storage.local.get(['activityLog'], (result) => {
      const log = result.activityLog || [];
      const container = document.getElementById('logContainer');
      
      if (log.length === 0) {
        container.innerHTML = '<div class="log-empty">No activity yet. Press Ctrl+Shift+Y to test.</div>';
      } else {
        container.innerHTML = log.slice(-10).reverse().map(entry => `
          <div class="log-entry ${entry.type}">
            <div class="log-time">${entry.time}</div>
            <div class="log-message">${entry.message}</div>
          </div>
        `).join('');
      }
    });
  }
  
  function addLogEntry(message, type) {
    chrome.storage.local.get(['activityLog'], (result) => {
      const log = result.activityLog || [];
      const now = new Date();
      const timeStr = now.toLocaleTimeString();
      
      log.push({
        time: timeStr,
        message: message,
        type: type
      });
      
      // Keep only last 50 entries
      if (log.length > 50) {
        log.shift();
      }
      
      chrome.storage.local.set({ activityLog: log }, () => {
        loadActivityLog();
      });
    });
  }
  
  // Listen for log updates from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'addLog') {
      loadActivityLog();
    }
  });
  
  // Refresh log every 2 seconds when hidden interface is open
  setInterval(() => {
    const hiddenInterface = document.getElementById('hiddenInterface');
    if (hiddenInterface && hiddenInterface.style.display !== 'none') {
      loadActivityLog();
    }
  }, 2000);
}

function loadPresets() {
  chrome.storage.sync.get(['presets'], (result) => {
    if (result.presets) {
      for (let i = 1; i <= 3; i++) {
        const presetKey = `preset${i}`;
        const textarea = document.getElementById(presetKey);
        if (textarea && result.presets[presetKey]) {
          textarea.value = result.presets[presetKey];
        }
      }
    }
  });
}
