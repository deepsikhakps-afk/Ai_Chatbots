# InkChat — Chat UI with AI

A lightweight, database-free chat interface that talks directly to the Anthropic Claude API from the browser. Built for an MCA-level academic project: no backend server, no SQL — all state (conversations, API key) lives in the browser's `localStorage`.

## Features

- Clean, ChatGPT-style two-pane layout (conversation sidebar + chat area)
- Multiple conversations, each saved locally with auto-generated titles
- Persists chat history and API key across page reloads via `localStorage`
- Calls the Anthropic Messages API directly from client-side JavaScript
- Enter to send, Shift+Enter for a new line, auto-resizing input box
- Responsive layout (sidebar collapses on mobile)
- Clear error handling if the API key is missing or the request fails

## Tech Stack

- HTML5, CSS3 (no framework, no build step)
- Vanilla JavaScript (ES6+, `fetch`, `localStorage`, `crypto.randomUUID`)
- Anthropic Messages API (`https://api.anthropic.com/v1/messages`)

No database, no server-side code, no npm install required.

## Project Structure

```
chat-ui-ai/
├── index.html        # App shell: sidebar + chat area markup
├── css/
│   └── style.css      # All styling (dark theme, responsive)
├── js/
│   └── app.js          # Conversation state, localStorage, API calls
└── README.md
```

## Setup & Running

1. Download/clone this folder.
2. Open `index.html` directly in a browser, **or** serve it locally (recommended, since some browsers restrict `fetch` from `file://` origins):
   ```bash
   cd chat-ui-ai
   python -m http.server 8000
   ```
   Then visit `http://localhost:8000`.
3. Get an API key from the [Anthropic Console](https://console.anthropic.com/) and paste it into the "Anthropic API Key" field in the sidebar.
4. Start chatting — type a message and press Enter.

## Important Notes on API Key Security

This project calls the Anthropic API **directly from the browser** for simplicity and to keep the "no database/no backend" requirement. This means:

- The API key is stored in the browser's `localStorage` and sent with every request header — fine for local demos/coursework, **not safe for a public deployment**.
- For a production app, the API key should never live in client-side code; instead, route requests through a small server-side proxy that holds the key securely.
- The request includes the `anthropic-dangerous-direct-browser-access: true` header, which is required by Anthropic specifically to allow (and flag) this direct-from-browser pattern.

## How It Works

1. User types a message → it's appended to the active conversation's message array and rendered as a bubble.
2. The full message history for that conversation is sent to the Anthropic API (`model`, `max_tokens`, `messages`).
3. The API's text response is parsed out of the `content` array and rendered as an AI bubble.
4. The updated conversation (including the new AI reply) is saved back to `localStorage`.

## Possible Extensions

- Streaming responses (token-by-token) instead of waiting for the full reply
- System prompt / persona picker per conversation
- Markdown rendering for AI responses (code blocks, lists)
- Export conversation as `.txt` or `.pdf`
- Dark/light theme toggle

## License

Free to use for academic/educational purposes.
