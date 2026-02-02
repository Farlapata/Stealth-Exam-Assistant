// Content script for clipboard operations

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'readAndProcess') {
    readClipboardAndProcess();
  }
});

async function readClipboardAndProcess() {
  try {
    // Read from clipboard
    const text = await navigator.clipboard.readText();
    
    if (!text) {
      showNotification('Clipboard is empty', 'error');
      return;
    }
    
    showNotification('Processing with Gemini...', 'info');
    
    // Send to background script for processing
    chrome.runtime.sendMessage(
      { action: 'processWithGemini', text: text },
      async (response) => {
        if (response.success) {
          // Write the result back to clipboard
          await navigator.clipboard.writeText(response.text);
          showNotification('✓ Processed! Ready to paste', 'success');
        } else {
          showNotification(`Error: ${response.error}`, 'error');
        }
      }
    );
  } catch (error) {
    showNotification(`Error reading clipboard: ${error.message}`, 'error');
  }
}

function showNotification(message, type = 'info') {
  // Remove any existing notifications
  const existing = document.getElementById('gemini-clipboard-notification');
  if (existing) {
    existing.remove();
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.id = 'gemini-clipboard-notification';
  notification.textContent = message;
  
  // Style the notification
  const colors = {
    info: '#2196F3',
    success: '#4CAF50',
    error: '#f44336'
  };
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${colors[type]};
    color: white;
    padding: 15px 20px;
    border-radius: 5px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    z-index: 999999;
    font-family: Arial, sans-serif;
    font-size: 14px;
    max-width: 300px;
    animation: slideIn 0.3s ease-out;
  `;
  
  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(notification);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideIn 0.3s ease-out reverse';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
