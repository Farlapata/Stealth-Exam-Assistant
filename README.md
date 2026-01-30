# 👻 Stealth Exam Assistant (Disguised as "Tab Counter")

[![GitHub License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/Farlapata/Stealth-Exam-Assistant/blob/main/LICENSE)
[![Chrome Manifest V3](https://img.shields.io/badge/Manifest-V3-orange?style=flat-square&logo=google-chrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Gemini AI](https://img.shields.io/badge/AI-Gemini-8E75B2?style=flat-square&logo=googlegemini&logoColor=white)](https://aistudio.google.com/)
[![Profile](https://img.shields.io/badge/Developer-Farlapata-purple?style=flat-square&logo=github&logoColor=white)](https://github.com/Farlapata)

**Stealth Exam Assistant** is a high-performance productivity tool that operates entirely under the radar. It presents itself as a simple "Tab Counter" to maintain a professional workspace, while hiding a powerful AI engine and note-injection system.

---

## 🎭 The Disguise
To any observer or proctoring software, this is a **Tab Counter**. It displays live statistics of your open windows and tabs, making it look like a standard productivity utility.

### 🗝️ The "Secret Knock"
The hidden AI suite is locked behind a stealth trigger:
1. Open the extension popup.
2. **Click the "Total Tabs" number box 5 times rapidly.**
3. The "Tab Counter" UI will vanish, revealing the **AI Configuration & Preset Menu**.

---

## 🔥 Key Features

### 1. The AI Ghost Loop (`Ctrl + Shift + Y`)
Get answers without ever leaving your assessment tab. This prevents "Tab Switching" flags in proctored environments like Canvas, Proctorio, or Respondus.
* **Copy (`Ctrl + C`)** a question or prompt.
* **Trigger (`Ctrl + Shift + Y`)**: The background worker sends the text to Gemini AI.
* **The Result:** The AI's response **instantly replaces your clipboard**.
* **Paste (`Ctrl + V`)**: You never left the page, and no windows were opened.

### 2. Instant Note Injection (`Ctrl + Shift + 1-3`)
Store your "cheat sheets," formulas, or essay structures before the exam starts.
* **Pre-load** up to 3 blocks of text in the hidden menu.
* **Recall** them instantly using `Ctrl + Shift + 1`, `2`, or `3`.
* This immediately loads your pre-set notes into your clipboard for instant pasting.

### 3. Smart Model Fallback
The engine is built for reliability. If a specific Gemini model is rate-limited or busy, it automatically cycles through a priority list (**Flash-Lite ➔ Flash ➔ Pro**) until a response is secured.

---

## 🔑 Setup & API Key
The assistant requires a **Google Gemini API Key** to function.
1. Visit **[Google AI Studio](https://aistudio.google.com/app/apikey)** to generate a free key.
2. Open the extension, perform the **5-click secret knock**, and paste your key.
3. Save your **Presets** (exam notes) in the hidden slots.

---

## 🚀 Installation

1. **Download** this repository as a ZIP and extract it.
2. Navigate to `chrome://extensions/` in your browser.
3. Toggle **Developer mode** (top right).
4. Click **Load unpacked** and select the extension folder.
5. **Pin** the 📊 icon to your browser bar.

---

## 🛠 Technical Specifications
* **Manifest V3:** Fully compliant with modern Chrome security standards.
* **Offscreen Document:** Uses a hidden "proxy" document to handle clipboard operations (since V3 service workers cannot touch the system clipboard directly).
* **Language:** Pure Vanilla JavaScript, HTML5, and CSS3.

---

## 📋 Project Information

| Section | Detail |
| :--- | :--- |
| **Author** | [Farlapata](https://github.com/Farlapata) |
| **Bug Tracker** | [GitHub Issues](https://github.com/Farlapata/Stealth-Exam-Assistant/issues) |
| **Known Issues** | Shortcuts only trigger if the browser is the active OS window. |
| **Build/Run** | No build required. Runs on native Chromium code. |
| **Test Suite** | Use the "Test Clipboard Processing" button in the secret menu. |

---
## ⚖️ Legal
By using this tool, you agree to the [DISCLAIMER.md](./DISCLAIMER.md). This software is for educational purposes only.
