// ---- InkChat: client-side AI chat UI (no database, no backend) ----
// All state lives in localStorage. Calls the Anthropic Messages API directly.

const STORAGE_KEY = "inkchat_conversations";
const API_KEY_STORAGE = "inkchat_api_key";

const messagesEl = document.getElementById("messages");
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const historyList = document.getElementById("historyList");
const newChatBtn = document.getElementById("newChatBtn");
const chatTitle = document.getElementById("chatTitle");
const apiKeyInput = document.getElementById("apiKeyInput");
const modelSelect = document.getElementById("modelSelect");

let conversations = loadConversations();
let activeId = null;

// ---------- Storage helpers ----------
function loadConversations() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveConversations() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
}

function getActiveConversation() {
  return conversations.find(c => c.id === activeId);
}

// ---------- Init ----------
(function init() {
  const savedKey = localStorage.getItem(API_KEY_STORAGE);
  if (savedKey) apiKeyInput.value = savedKey;

  apiKeyInput.addEventListener("change", () => {
    localStorage.setItem(API_KEY_STORAGE, apiKeyInput.value.trim());
  });

  renderHistory();

  if (conversations.length) {
    setActiveConversation(conversations[0].id);
  } else {
    startNewConversation();
  }
})();

newChatBtn.addEventListener("click", startNewConversation);

function startNewConversation() {
  const convo = {
    id: crypto.randomUUID(),
    title: "New conversation",
    messages: [] // {role: "user"|"assistant", content: "..."}
  };
  conversations.unshift(convo);
  saveConversations();
  renderHistory();
  setActiveConversation(convo.id);
}

function setActiveConversation(id) {
  activeId = id;
  const convo = getActiveConversation();
  chatTitle.textContent = convo.title;
  renderMessages();
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = "";
  conversations.forEach(c => {
    const li = document.createElement("li");
    li.textContent = c.title;
    li.className = c.id === activeId ? "active" : "";
    li.addEventListener("click", () => setActiveConversation(c.id));
    historyList.appendChild(li);
  });
}

function renderMessages() {
  const convo = getActiveConversation();
  messagesEl.innerHTML = "";

  if (!convo.messages.length) {
    messagesEl.innerHTML = `
      <div class="empty-state">
        <p class="empty-title">Start the conversation</p>
        <p class="empty-sub">Ask anything — your messages stay in this browser only.</p>
      </div>`;
    return;
  }

  convo.messages.forEach(m => appendMessageBubble(m.role, m.content));
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function appendMessageBubble(role, content, extraClass = "") {
  const div = document.createElement("div");
  div.className = `msg ${role === "user" ? "user" : "ai"} ${extraClass}`.trim();
  div.textContent = content;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return div;
}

// ---------- Sending messages ----------
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = userInput.value.trim();
  if (!text) return;

  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    alert("Please enter your Anthropic API key in the sidebar first.");
    return;
  }

  const convo = getActiveConversation();

  // Clear empty state on first message
  if (!convo.messages.length) messagesEl.innerHTML = "";

  convo.messages.push({ role: "user", content: text });
  appendMessageBubble("user", text);
  userInput.value = "";
  autoResize();

  if (convo.title === "New conversation") {
    convo.title = text.slice(0, 40) + (text.length > 40 ? "…" : "");
    chatTitle.textContent = convo.title;
  }
  saveConversations();
  renderHistory();

  setSending(true);
  const thinkingEl = appendMessageBubble("ai", "Thinking...", "thinking");

  try {
    const reply = await callClaude(convo.messages, apiKey, modelSelect.value);
    thinkingEl.remove();
    appendMessageBubble("ai", reply);
    convo.messages.push({ role: "assistant", content: reply });
    saveConversations();
  } catch (err) {
    thinkingEl.remove();
    appendMessageBubble("ai", `Error: ${err.message}`, "error");
  } finally {
    setSending(false);
  }
});

// Enter to send, Shift+Enter for newline
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    chatForm.requestSubmit();
  }
});
userInput.addEventListener("input", autoResize);

function autoResize() {
  userInput.style.height = "auto";
  userInput.style.height = Math.min(userInput.scrollHeight, 160) + "px";
}

function setSending(isSending) {
  sendBtn.disabled = isSending;
  userInput.disabled = isSending;
}

// ---------- Anthropic API call ----------
async function callClaude(messageHistory, apiKey, model) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: messageHistory.map(m => ({ role: m.role, content: m.content }))
    })
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody?.error?.message || `Request failed (${response.status})`);
  }

  const data = await response.json();
  const textBlock = data.content.find(b => b.type === "text");
  return textBlock ? textBlock.text : "(no response)";
}
