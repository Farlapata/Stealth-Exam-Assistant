// Background service worker for Gemini Clipboard Assistant

let notificationTabId = null;

// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'word-counter',
    title: 'Count Words',
    contexts: ['selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'word-counter' && info.selectionText) {
    handleWordCount(info.selectionText);
  }
});

// Update badge with tab count on startup and when tabs change
updateBadge();
chrome.tabs.onCreated.addListener(updateBadge);
chrome.tabs.onRemoved.addListener(updateBadge);
chrome.tabs.onUpdated.addListener(updateBadge);

// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'word-counter',
    title: 'Count Words',
    contexts: ['selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'word-counter' && info.selectionText) {
    handleWordCount(info.selectionText);
  }
});

async function updateBadge() {
  try {
    const tabs = await chrome.tabs.query({});
    chrome.action.setBadgeText({ text: tabs.length.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#667eea' });
  } catch (error) {
    console.error('Error updating badge:', error);
  }
}

// Listen for keyboard command
chrome.commands.onCommand.addListener((command) => {
  console.log('Command received:', command);
  if (command === 'process-clipboard') {
    addLog('⌨️ Ctrl+Shift+Y pressed', 'info');
    handleClipboardProcess();
  } else if (command.startsWith('preset-')) {
    const presetNum = command.split('-')[1];
    addLog(`📋 Ctrl+Shift+${presetNum} pressed`, 'info');
    handlePresetCopy(presetNum);
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'manualTrigger') {
    addLog('🧪 Manual test triggered from popup', 'info');
    handleClipboardProcess().then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
  
  if (request.action === 'processWithGemini') {
    addLog(`Processing text (${request.text.length} chars)`, 'info');
    processTextWithAI(request.text)
      .then(result => {
        addLog('✓ API success', 'success');
        sendResponse({ success: true, text: result });
      })
      .catch(error => {
        addLog(`✗ Error: ${error.message}`, 'error');
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the message channel open for async response
  }
});

async function setupOffscreenDocument() {
  try {
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT']
    });
    
    if (existingContexts.length > 0) {
      addLog('✓ Offscreen document already exists', 'info');
      return;
    }
    
    addLog('📄 Creating offscreen document...', 'info');
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['CLIPBOARD'],
      justification: 'Read and write clipboard for AI processing'
    });
    addLog('✓ Offscreen document created', 'success');
  } catch (error) {
    addLog(`❌ Offscreen setup failed: ${error.message}`, 'error');
    throw error;
  }
}

async function readClipboard() {
  // Try to read from active tab using content script injection
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      throw new Error('No active tab');
    }
    
    addLog(`📝 Injecting clipboard reader into tab...`, 'info');
    
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: async () => {
        try {
          return await navigator.clipboard.readText();
        } catch (error) {
          return { error: error.message };
        }
      }
    });
    
    if (results && results[0] && results[0].result) {
      if (results[0].result.error) {
        throw new Error(results[0].result.error);
      }
      return results[0].result;
    }
    
    throw new Error('No result from clipboard read');
    
  } catch (error) {
    addLog(`❌ Direct read failed: ${error.message}, trying offscreen...`, 'info');
    return await readClipboardOffscreen();
  }
}

async function readClipboardOffscreen() {
  await setupOffscreenDocument();
  
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: 'readClipboard' },
      (response) => {
        if (chrome.runtime.lastError) {
          addLog(`❌ Runtime error: ${chrome.runtime.lastError.message}`, 'error');
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        if (response && response.success) {
          addLog(`✓ Got text from offscreen: "${response.text.substring(0, 50)}..."`, 'info');
          resolve(response.text);
        } else {
          reject(new Error(response?.error || 'Failed to read clipboard'));
        }
      }
    );
  });
}

async function writeClipboard(text) {
  // Try to write to active tab using content script injection
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      throw new Error('No active tab');
    }
    
    addLog(`📝 Injecting clipboard writer into tab...`, 'info');
    
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: async (textToWrite) => {
        try {
          await navigator.clipboard.writeText(textToWrite);
          return { success: true };
        } catch (error) {
          return { error: error.message };
        }
      },
      args: [text]
    });
    
    if (results && results[0] && results[0].result) {
      if (results[0].result.error) {
        throw new Error(results[0].result.error);
      }
      return;
    }
    
    throw new Error('No result from clipboard write');
    
  } catch (error) {
    addLog(`❌ Direct write failed: ${error.message}, trying offscreen...`, 'info');
    return await writeClipboardOffscreen(text);
  }
}

async function writeClipboardOffscreen(text) {
  await setupOffscreenDocument();
  
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: 'writeClipboard', text: text },
      (response) => {
        if (response && response.success) {
          resolve();
        } else {
          reject(new Error(response?.error || 'Failed to write clipboard'));
        }
      }
    );
  });
}

async function handleClipboardProcess() {
  try {
    addLog('🚀 Starting clipboard process...', 'info');
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      addLog('❌ No active tab found', 'error');
      await writeClipboard('Error: No active tab found');
      return;
    }
    
    notificationTabId = tab.id;
    addLog(`✓ Active tab: ${tab.title}`, 'info');
    
    // Read clipboard
    addLog('📋 Reading clipboard...', 'info');
    let text;
    try {
      text = await readClipboard();
    } catch (error) {
      addLog(`❌ Clipboard read failed: ${error.message}`, 'error');
      await writeClipboard(`Error: Could not read clipboard - ${error.message}`);
      return;
    }
    
    if (!text || text.trim() === '') {
      addLog('⚠️ Clipboard is empty', 'error');
      await writeClipboard('Error: Clipboard is empty');
      return;
    }
    
    addLog(`✓ Read ${text.length} characters`, 'success');
    
    // Process with AI (Gemini or Groq)
    let result;
    try {
      result = await processTextWithAI(text);
    } catch (error) {
      addLog(`❌ AI API failed: ${error.message}`, 'error');
      await writeClipboard(`Error: ${error.message}`);
      return;
    }
    
    // Write result to clipboard
    addLog('📋 Writing answer to clipboard...', 'info');
    try {
      await writeClipboard(result);
      addLog('✅ Complete! Answer copied to clipboard', 'success');
    } catch (error) {
      addLog(`❌ Clipboard write failed: ${error.message}`, 'error');
      // Even if write fails, log it but don't throw
    }
    
  } catch (error) {
    addLog(`❌ Unexpected error: ${error.message}`, 'error');
    try {
      await writeClipboard(`Error: ${error.message}`);
    } catch (e) {
      // Ignore clipboard write errors in error handler
    }
  }
}

async function handlePresetCopy(presetNum) {
  try {
    addLog(`📋 Loading preset ${presetNum}...`, 'info');
    
    const result = await chrome.storage.sync.get(['presets']);
    const presetKey = `preset${presetNum}`;
    
    if (!result.presets || !result.presets[presetKey]) {
      addLog(`⚠️ Preset ${presetNum} is empty`, 'error');
      return;
    }
    
    const presetText = result.presets[presetKey];
    
    if (!presetText.trim()) {
      addLog(`⚠️ Preset ${presetNum} is empty`, 'error');
      return;
    }
    
    addLog(`✓ Copying preset ${presetNum} (${presetText.length} chars)`, 'info');
    await writeClipboard(presetText);
    addLog(`✅ Preset ${presetNum} copied to clipboard`, 'success');
    
  } catch (error) {
    addLog(`❌ Failed to copy preset ${presetNum}: ${error.message}`, 'error');
  }
}

async function handleWordCount(text) {
  try {
    addLog('🔢 Counting words...', 'info');
    
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    const charCount = text.length;
    
    const result = `Words: ${wordCount}`;
    
    addLog(`✓ Counted: ${wordCount} words, ${charCount} chars`, 'success');
    await writeClipboard(result);
    addLog('✅ Word count copied to clipboard', 'success');
    
  } catch (error) {
    addLog(`❌ Failed to count words: ${error.message}`, 'error');
  }
}

async function processTextWithAI(text) {
  // Get selected provider from storage
  const result = await chrome.storage.sync.get(['selectedProvider']);
  const provider = result.selectedProvider || 'gemini';
  
  if (provider === 'groq') {
    return await processTextWithGroq(text);
  } else {
    return await processTextWithGemini(text);
  }
}

async function processTextWithGemini(text) {
  // Model priority order: cheapest/highest throughput first
  const modelPriority = [
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash-lite',
    'gemini-2.5-flash',
    'gemini-2.0-flash-exp',
    'gemini-2.5-pro',
    'gemini-3-pro-preview'
  ];
  
  // Get API key and current model from storage
  const result = await chrome.storage.sync.get(['geminiApiKey', 'geminiModel']);
  const apiKey = result.geminiApiKey;
  let currentModel = result.geminiModel || 'gemini-2.5-flash-lite';
  
  if (!apiKey) {
    throw new Error('Please set your Gemini API key in the extension popup');
  }
  
  // Find starting index in priority list
  let startIndex = modelPriority.indexOf(currentModel);
  if (startIndex === -1) startIndex = 0;
  
  // Try models in order starting from current
  for (let i = startIndex; i < modelPriority.length; i++) {
    const model = modelPriority[i];
    
    try {
      addLog(`🤖 Calling Gemini API (${model})...`, 'info');
      
      const response = await callGeminiAPI(apiKey, model, text);
      
      // Success! Update stored model if we switched
      if (model !== currentModel) {
        await chrome.storage.sync.set({ geminiModel: model });
        addLog(`✓ Switched to ${model}`, 'success');
      }
      
      return response;
      
    } catch (error) {
      // Check if it's a rate limit error
      if (isRateLimitError(error)) {
        addLog(`⚠️ ${model} rate limited, trying next model...`, 'error');
        
        // If this is the last model, throw error
        if (i === modelPriority.length - 1) {
          throw new Error('All models are rate limited. Please try again later.');
        }
        
        // Continue to next model
        continue;
      }
      
      // If it's not a rate limit error, throw it
      throw error;
    }
  }
  
  throw new Error('All models failed');
}

async function processTextWithGroq(text) {
  // Get API key and current model from storage
  const result = await chrome.storage.sync.get(['groqApiKey', 'groqModel']);
  const apiKey = result.groqApiKey;
  const model = result.groqModel || 'openai/gpt-oss-120b';
  
  if (!apiKey) {
    throw new Error('Please set your Groq API key in the extension popup');
  }
  
  try {
    addLog(`🤖 Calling Groq API (${model})...`, 'info');
    const response = await callGroqAPI(apiKey, model, text);
    return response;
  } catch (error) {
    throw error;
  }
}

function isRateLimitError(error) {
  const message = error.message.toLowerCase();
  return message.includes('rate limit') || 
         message.includes('429') || 
         message.includes('quota') ||
         message.includes('resource_exhausted') ||
         message.includes('too many requests');
}

async function callGroqAPI(apiKey, model, text) {
  // Get custom instructions from storage
  const storageData = await chrome.storage.sync.get(['customInstructions']);
  const customInstructions = storageData.customInstructions || '';
  
  const url = 'https://api.groq.com/openai/v1/chat/completions';
  
  let systemPrompt = `You are a helpful academic assistant. Provide responses at a B2 academic level (CEFR), appropriate for a 14-year-old student. Use formal but accessible language. Avoid slang, casual expressions, and em-dashes.

IMPORTANT: 
- If the user asks to "rewrite", "improve", "fix", "expand", "make better", or similar requests about text they've provided, provide the FULL rewritten version professionally.
- For simple questions without text to rewrite, keep answers to ONE sentence unless more detail is needed.
- Always maintain formal, professional tone suitable for school assignments.`;
  
  // Add custom instructions if provided
  if (customInstructions) {
    systemPrompt += `\n\nADDITIONAL INSTRUCTIONS: ${customInstructions}`;
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 1,
      max_tokens: 8192,
      top_p: 1,
      stream: false
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Groq API error: ${errorData.error?.message || 'Unknown error'}`);
  }
  
  const data = await response.json();
  
  // Extract the generated text
  const generatedText = data.choices?.[0]?.message?.content;
  
  if (!generatedText) {
    throw new Error('No response from Groq API');
  }
  
  return generatedText;
}

async function callGeminiAPI(apiKey, model, text) {
  // Get custom instructions from storage
  const storageData = await chrome.storage.sync.get(['customInstructions']);
  const customInstructions = storageData.customInstructions || '';
  
  // Call Gemini API with selected model
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  // Build the system prompt
  let systemPrompt = 'You are a helpful academic assistant. Provide responses at a B2 academic level (CEFR), appropriate for a 14-year-old student. Use formal but accessible language. Avoid slang, casual expressions, and em-dashes.\n\nIMPORTANT: \n- If the user asks to "rewrite", "improve", "fix", "expand", "make better", or similar requests about text they\'ve provided, provide the FULL rewritten version professionally.\n- For simple questions without text to rewrite, keep answers to ONE sentence unless more detail is needed.\n- Always maintain formal, professional tone suitable for school assignments.';
  
  // Add custom instructions if provided
  if (customInstructions) {
    systemPrompt += `\n\nADDITIONAL INSTRUCTIONS: ${customInstructions}`;
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `${systemPrompt}\n\n${text}`
        }]
      }]
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Gemini API error: ${errorData.error?.message || 'Unknown error'}`);
  }
  
  const data = await response.json();
  
  // Extract the generated text
  const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!generatedText) {
    throw new Error('No response from Gemini API');
  }
  
  return generatedText;
}

function addLog(message, type) {
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
    
    chrome.storage.local.set({ activityLog: log });
    
    // Notify popup to refresh
    chrome.runtime.sendMessage({ action: 'addLog' }).catch(() => {
      // Popup might not be open, ignore error
    });
  });
}
