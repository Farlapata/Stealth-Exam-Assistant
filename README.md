# Gemini Clipboard Assistant - Chrome Extension

A simple Chrome extension that processes your clipboard text using Google's Gemini AI with a keyboard shortcut.

## Features

- **Quick Access**: Press `Ctrl+Shift+G` (or `Cmd+Shift+G` on Mac) to process clipboard text
- **AI-Powered**: Uses Gemini API to improve and refine your text
- **Seamless**: Automatically copies the result back to clipboard
- **Visual Feedback**: Shows notifications for each step

## Setup Instructions

### 1. Get Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### 2. Install the Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `gemini-clipboard-extension` folder
5. The extension icon should appear in your toolbar

### 3. Configure the Extension

1. Click the extension icon in Chrome toolbar
2. Paste your Gemini API key
3. Click "Save"

### 4. Convert SVG Icons to PNG (Required)

Chrome extensions need PNG icons. You can convert the SVG files using:
- Online tools like [CloudConvert](https://cloudconvert.com/svg-to-png)
- Or use any image editor (GIMP, Photoshop, etc.)

Convert these files:
- `icons/icon16.svg` → `icons/icon16.png`
- `icons/icon48.svg` → `icons/icon48.png`
- `icons/icon128.svg` → `icons/icon128.png`

## How to Use

1. Copy any text to your clipboard (Ctrl+C)
2. Press `Ctrl+Shift+G` (Windows/Linux) or `Cmd+Shift+G` (Mac)
3. Wait a few seconds for Gemini to process the text
4. The improved text is now in your clipboard
5. Paste it anywhere (Ctrl+V)

## Keyboard Shortcuts

- `Ctrl+Shift+G` (Windows/Linux)
- `Cmd+Shift+G` (Mac)

You can customize the shortcut:
1. Go to `chrome://extensions/shortcuts`
2. Find "Gemini Clipboard Assistant"
3. Set your preferred key combination

## Customization

You can modify the Gemini prompt in `background.js`:

```javascript
text: `Please improve and refine the following text:\n\n${text}`
```

Change this to any prompt you want, such as:
- `Summarize this text:`
- `Translate this to Spanish:`
- `Fix grammar and spelling:`
- `Make this more professional:`

## Files Structure

```
gemini-clipboard-extension/
├── manifest.json        # Extension configuration
├── background.js        # Background service worker
├── content.js          # Content script for clipboard access
├── popup.html          # Extension popup UI
├── popup.css           # Popup styles
├── popup.js            # Popup functionality
├── icons/              # Extension icons
│   ├── icon16.svg/png
│   ├── icon48.svg/png
│   └── icon128.svg/png
└── README.md           # This file
```

## Troubleshooting

**Extension doesn't work:**
- Make sure you've saved your API key
- Check that clipboard permissions are granted
- Try reloading the extension

**API errors:**
- Verify your API key is correct
- Check your internet connection
- Ensure you have API quota remaining

**Keyboard shortcut doesn't work:**
- Check chrome://extensions/shortcuts
- Make sure the shortcut isn't conflicting with another extension
- Try setting a different key combination

## Privacy

- Your API key is stored locally in Chrome's sync storage
- Text is sent to Google's Gemini API for processing
- No data is stored or logged by this extension

## License

Free to use and modify for personal or commercial projects.
