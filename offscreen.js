// Offscreen document for clipboard access

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'readClipboard') {
    readClipboardText()
      .then(text => {
        console.log('Clipboard read result:', text, 'Length:', text ? text.length : 0);
        sendResponse({ success: true, text: text });
      })
      .catch(error => {
        console.error('Clipboard read error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
  
  if (request.action === 'writeClipboard') {
    writeClipboardText(request.text)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

async function readClipboardText() {
  try {
    // First try the modern clipboard API
    const text = await navigator.clipboard.readText();
    console.log('Modern API read:', text);
    return text || '';
  } catch (error) {
    console.error('Modern API failed:', error);
    
    // Fallback: create a contenteditable div and paste into it
    const div = document.createElement('div');
    div.contentEditable = 'true';
    div.style.position = 'fixed';
    div.style.top = '-9999px';
    div.style.left = '-9999px';
    document.body.appendChild(div);
    
    div.focus();
    
    return new Promise((resolve, reject) => {
      // Listen for paste event
      const pasteHandler = (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        console.log('Paste event got:', text);
        document.body.removeChild(div);
        resolve(text || '');
      };
      
      div.addEventListener('paste', pasteHandler, { once: true });
      
      // Trigger paste
      setTimeout(() => {
        const result = document.execCommand('paste');
        console.log('execCommand paste result:', result);
        
        if (!result) {
          div.removeEventListener('paste', pasteHandler);
          document.body.removeChild(div);
          reject(new Error('Paste command failed. Try copying text again.'));
        }
      }, 50);
    });
  }
}

async function writeClipboardText(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '0';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  
  textarea.select();
  textarea.setSelectionRange(0, 99999);
  
  try {
    // Try modern API first
    await navigator.clipboard.writeText(text);
    document.body.removeChild(textarea);
  } catch (error) {
    // Fallback to execCommand
    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (!successful) {
        throw new Error('Copy command failed');
      }
    } catch (e) {
      document.body.removeChild(textarea);
      throw new Error('Cannot write to clipboard');
    }
  }
}

// Keep the document active
setInterval(() => {
  // Ping to keep alive
}, 20000);
