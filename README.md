<h1 align="center">
  <table align="center">
    <tr>
      <td>
        <img src="icon.png" alt="VU Empire Genie" width="64"/>
      </td>
      <td style="vertical-align: middle; padding-left: 10px;">
        VU Empire Genie
      </td>
    </tr>
  </table>
</h1>

A browser extension that augments the Virtual University (VU) learning experience by providing AI-powered assistance for discussion boards (GDB), quizzes, and lecture interactions. The extension integrates with Google's Generative Language (Gemini) API to generate helpful responses and automate common LMS tasks.

**Status:** Production-ready prototype

**Key files:** `manifest.json`, `background.js`, `content.js`, `popup.html`, `popup.js`, `options.html`, `options.js`

**Table of contents**
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation (User)](#installation-user)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Development](#development)
- [Security & Privacy](#security--privacy)
- [Contributing](#contributing)
- [License](#license)

## Features

- GDB (Graded Discussion Board) assistant: extract GDB prompts and generate a well-structured academic response formatted for easy copy-paste into CKEditor.
- Quiz helper: analyze quiz questions and options, return a suggested correct answer with a short explanation.
- Lecture actions: mark lectures as viewed / automate simple interactions where supported by the LMS UI.
- Editor auto-fill: automatically insert AI-generated content into page editors (CKEditor) on supported VU pages.
- Clipboard & highlight utilities: copy generated content, highlight answers on the page, or auto-select answers when available.

## Prerequisites

- A Chromium-based browser (Google Chrome, Microsoft Edge, Brave, etc.)
- A valid Google Cloud Generative Language (Gemini) API key. The extension will call the Gemini endpoint shown in `popup.js` which requires an API key with appropriate access.

Note: This extension uses Manifest V3 (`manifest.json`).

## Installation (User)

1. Open `chrome://extensions/` (or `edge://extensions/`) in your Chromium-based browser.
2. Enable **Developer mode** (top-right).
3. Click **Load unpacked** and select the repository folder (the root folder containing `manifest.json`).
4. The extension `VU Empire Genie` should appear in your toolbar.

## Quick start

1. Click the extension icon and open the popup.
2. Select the desired action (GDB, Quiz, Lecture) depending on the current VU LMS page.
3. If this is your first run, open the extension `Options` page (right-click the extension → `Options`) and paste your Gemini API key into the field, then click **Save**.
4. Navigate to a supported VU page (for example: `https://vulms.vu.edu.pk/GDB/StudentMessage.aspx` for GDB) and use the popup to generate or apply content.

## Configuration

- API key storage: `options.js` saves your Gemini API key using `chrome.storage.sync` under the key `geminiApiKey`.
- Host permissions and content script matches are declared in `manifest.json` and are scoped to `https://vulms.vu.edu.pk/*` and the Gemini API host.

## Development

Files of interest:

- `manifest.json` — extension metadata and permissions.
- `background.js` — service worker for background tasks.
- `content.js` — page-level script injected into VU pages to extract or manipulate page content.
- `popup.html` / `popup.js` — the extension popup UI and main interaction logic.
- `options.html` / `options.js` — UI to store the Gemini API key.

Local development tips:

- Edit source files and reload the extension via `chrome://extensions/` → `Reload`.
- Use `console` logs in `popup.js` / `content.js` and the background service worker to debug. Open the extension background service worker and the page console for messages.

Suggested workflow:

1. Make changes to `popup.js` or `content.js`.
2. Reload the extension from `chrome://extensions/`.
3. Reproduce the scenario in the VU LMS page and watch developer tools for errors.

## Security & Privacy

- The extension sends data (prompts and extracted page content) to the Google Generative Language API endpoint configured in `popup.js`.
- You must provide your own Gemini API key; the extension stores the key in `chrome.storage.sync` for convenience.
- Avoid using a key with broad permissions or a production billing account if you are testing — consider using a dedicated project and quota limits.
- Do not share sensitive personal data through the extension. The extension does not intentionally persist user content beyond what is necessary to call the API and autofill editor fields.

## Contributing

Contributions are welcome. Suggested process:

1. Open an issue describing the bug or feature request.
2. Fork the repository and create a feature branch.
3. Implement the change, test locally by loading the unpacked extension, and ensure no console errors.
4. Submit a pull request with a clear description of the change.

If you plan to add features that change the permissions or hosts in `manifest.json`, note those changes clearly in your PR.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## Contact

Maintainer: Zaheer Ahmed Khan

For questions or support, open an issue in this repository.
