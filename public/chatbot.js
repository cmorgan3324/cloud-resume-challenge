(function () {
  "use strict";

  // Configuration
  const STORAGE_KEY = "arcChatState:v1";
  const BROADCAST_CHANNEL = "arcChat";
  const MAX_HISTORY_LENGTH = 20;
  const MAX_RETRIES = 2;
  const BASE_DELAY = 1000;

  let chatState = {
    sessionId: null,
    history: [],
    lastUsed: Date.now(),
    isOpen: false,
  };

  let elements = {};
  let broadcastChannel;
  let apiUrl = "";
  let isRequestInFlight = false;

  // Utility functions
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  const debouncedSaveState = debounce(saveState, 500);

  function loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        chatState = { ...chatState, ...parsed };

        // Clean old history
        if (chatState.history.length > MAX_HISTORY_LENGTH) {
          chatState.history = chatState.history.slice(-MAX_HISTORY_LENGTH);
        }
      }
    } catch (error) {
      console.warn("Failed to load chat state:", error);
    }
  }

  function saveState() {
    try {
      chatState.lastUsed = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chatState));
    } catch (error) {
      console.warn("Failed to save chat state:", error);
    }
  }

  function broadcastUpdate(type, data) {
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage({ type, data, timestamp: Date.now() });
      } catch (error) {
        console.warn("Failed to broadcast update:", error);
      }
    }
  }

  function setupBroadcastChannel() {
    if (typeof BroadcastChannel !== "undefined") {
      broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL);
      broadcastChannel.onmessage = (event) => {
        const { type, data } = event.data;

        switch (type) {
          case "messageAdded":
            if (data.sessionId === chatState.sessionId) {
              chatState.history = data.history;
              renderMessages();
              debouncedSaveState();
            }
            break;
          case "stateSync":
            if (data.lastUsed > chatState.lastUsed) {
              chatState = { ...chatState, ...data };
              renderMessages();
              updateToggleState();
            }
            break;
        }
      };
    }
  }

  async function loadConfig() {
    try {
      const response = await fetch("/public/chatbot.config.json");
      if (response.ok) {
        const config = await response.json();
        apiUrl = config.apiUrl;
        console.log("✅ Chatbot config loaded:", { apiUrl });
      } else {
        // Fallback for local testing
        console.warn("Config file not found, using local mock API");
        apiUrl = "http://localhost:3000";
      }
    } catch (error) {
      console.warn(
        "Failed to load chatbot config, using local mock API:",
        error
      );
      apiUrl = "http://localhost:3000";
    }
  }

  function createElements() {
    // Create styles
    const style = document.createElement("style");
    style.textContent = `
      .vibe-chat-toggle {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 84px;
        /* matches ICON_SIZE */
        height: 84px;
        /* matches ICON_SIZE */
        padding: 0;
        border: 0;
        border-radius: 50%;
        background: transparent;
        cursor: pointer;
        z-index: 1000;
        display: grid;
        place-items: center;
        transition: transform 0.15s ease;
      }
      
      .vibe-chat-toggle:hover { transform: scale(1.04); }
      .vibe-chat-toggle:active { transform: scale(0.98); }
      
      .arc-btn-img {
        width: 100%;
        height: 100%;
        display: block;
        border-radius: 50%;
        /* keep it round even if the asset has background */
        image-rendering: auto;
        /* keep it crisp, let browser choose best sampling */
      }
      
      /* Neon bloom around the exact image (does not alter the pixels of the icon) */
      .vibe-chat-toggle::after {
        content: "";
        position: absolute;
        inset: -10px;
        /* spread glow slightly beyond the icon edge */
        border-radius: 50%;
        pointer-events: none;
        opacity: 0.85;
        /* layered radial glows, purple bias per your latest image */
        background:
          radial-gradient(60% 60% at 40% 35%, rgba(177, 0, 255, 0.38), transparent 60%),
          radial-gradient(55% 55% at 65% 60%, rgba(31, 160, 255, 0.26), transparent 65%);
        filter: blur(12px);
        transition: opacity .2s ease, filter .2s ease, transform .2s ease;
      }
      
      .vibe-chat-toggle:hover::after {
        opacity: 1;
        filter: blur(14px) brightness(1.05);
        transform: scale(1.03);
      }
      
      /* Subtle breathing animation, but only if user allows motion */
      @media (prefers-reduced-motion: no-preference) {
        .vibe-chat-toggle::after {
          animation: arcPulse 2.6s ease-in-out infinite;
        }
        @keyframes arcPulse {
          0%, 100% { filter: blur(12px) brightness(1.00); }
          50%      { filter: blur(16px) brightness(1.08); }
        }
      }
      
      .vibe-chat-panel {
        position: fixed;
        bottom: 90px;
        right: 20px;
        width: 350px;
        height: 500px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        z-index: 1001;
        display: none;
        flex-direction: column;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .vibe-chat-panel.open {
        display: flex;
      }
      
      .vibe-chat-header {
        background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
        color: white;
        padding: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .vibe-chat-title {
        font-weight: 600;
        font-size: 16px;
        margin: 0;
      }
      
      .vibe-chat-controls {
        display: flex;
        gap: 8px;
      }
      
      .vibe-chat-btn {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 28px;
        height: 28px;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
      }
      
      .vibe-chat-btn:hover {
        background: rgba(255, 255, 255, 0.3);
      }
      
      .vibe-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .vibe-chat-message {
        max-width: 85%;
        padding: 12px 16px;
        border-radius: 18px;
        font-size: 14px;
        line-height: 1.4;
        word-wrap: break-word;
      }
      
      .vibe-chat-message.user {
        align-self: flex-end;
        background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
        color: white;
      }
      
      .vibe-chat-message.assistant {
        align-self: flex-start;
        background: #f1f3f4;
        color: #333;
        position: relative;
      }
      
      .vibe-chat-message.assistant .copy-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        background: none;
        border: none;
        color: #666;
        cursor: pointer;
        font-size: 12px;
        opacity: 0;
        transition: opacity 0.2s;
      }
      
      .vibe-chat-message.assistant:hover .copy-btn {
        opacity: 1;
      }
      
      .vibe-chat-typing {
        align-self: flex-start;
        background: #f1f3f4;
        color: #666;
        font-style: italic;
        animation: pulse 1.5s infinite;
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }
      
      .vibe-chat-input-area {
        padding: 16px;
        border-top: 1px solid #e0e0e0;
      }
      
      .vibe-chat-input {
        width: 100%;
        min-height: 40px;
        max-height: 120px;
        padding: 12px 50px 12px 16px;
        border: 1px solid #ddd;
        border-radius: 20px;
        resize: none;
        font-family: inherit;
        font-size: 14px;
        outline: none;
        box-sizing: border-box;
      }
      
      .vibe-chat-input:focus {
        border-color: #8b5cf6;
      }
      
      .vibe-chat-send {
        position: absolute;
        right: 24px;
        bottom: 28px;
        background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
        border: none;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }
      
      .vibe-chat-send:hover:not(:disabled) {
        transform: scale(1.1);
      }
      
      .vibe-chat-send:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .vibe-chat-error {
        background: #fee;
        color: #c33;
        border: 1px solid #fcc;
        padding: 12px;
        border-radius: 8px;
        margin: 8px 0;
        font-size: 13px;
      }
      
      .vibe-chat-retry {
        background: #8b5cf6;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        margin-top: 8px;
      }
      
      @media (max-width: 480px) {
        .vibe-chat-panel {
          bottom: 90px;
          right: 10px;
          left: 10px;
          width: auto;
          height: 400px;
        }
        
        .vibe-chat-toggle {
          bottom: 15px;
          right: 15px;
        }
      }
    `;
    document.head.appendChild(style);

    // Create toggle button
    const ICON_SIZE = 84; // button size on screen (px). Tweak if you want bigger/smaller.
    const toggle = document.createElement("button");
    toggle.className = "vibe-chat-toggle";
    toggle.setAttribute("aria-label", "Open A.R.C. – AI Resume Companion");
    
    // Exact image, no redraw — pixel-perfect replica
    toggle.innerHTML = `
      <picture>
        <source srcset="/arc-button-768.png 768w, /arc-button-512.png 512w, /arc-button-256.png 256w" type="image/png" />
        <img
          class="arc-btn-img"
          decoding="async"
          alt=""
          width="${ICON_SIZE}" height="${ICON_SIZE}"
          src="/arc-button-512.png"
          srcset="/arc-button-768.png 768w, /arc-button-512.png 512w, /arc-button-256.png 256w"
          sizes="${ICON_SIZE}px"
        />
      </picture>
    `;
    toggle.onclick = toggleChat; // keep your existing handler

    // Create chat panel
    const panel = document.createElement("div");
    panel.className = "vibe-chat-panel";
    panel.innerHTML = `
      <div class="vibe-chat-header">
        <h3 class="vibe-chat-title">A.R.C. - AI Resume Companion</h3>
        <div class="vibe-chat-controls">
          <button class="vibe-chat-btn" onclick="clearChat()" title="Clear chat">🗑️</button>
          <button class="vibe-chat-btn" onclick="toggleChat()" title="Minimize">−</button>
        </div>
      </div>
      <div class="vibe-chat-messages" id="vibe-chat-messages"></div>
      <div class="vibe-chat-input-area" style="position: relative;">
        <textarea 
          id="vibe-chat-input" 
          class="vibe-chat-input" 
          placeholder="Greetings! Ask me about Cory's expertise, achievements, or availability..."
          rows="1"
        ></textarea>
        <button id="vibe-chat-send" class="vibe-chat-send">→</button>
      </div>
    `;

    document.body.appendChild(toggle);
    document.body.appendChild(panel);

    // Store element references
    elements = {
      toggle,
      panel,
      messages: document.getElementById("vibe-chat-messages"),
      input: document.getElementById("vibe-chat-input"),
      send: document.getElementById("vibe-chat-send"),
    };

    // Setup event listeners
    setupEventListeners();
  }

  function setupEventListeners() {
    // Input handling
    elements.input.addEventListener("input", handleInputChange);
    elements.input.addEventListener("keydown", handleKeyDown);
    elements.send.addEventListener("click", sendMessage);

    // Global escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && chatState.isOpen) {
        toggleChat();
      }
    });

    // Auto-resize textarea
    function handleInputChange() {
      elements.input.style.height = "auto";
      elements.input.style.height =
        Math.min(elements.input.scrollHeight, 120) + "px";
    }

    function handleKeyDown(e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    }
  }

  function toggleChat() {
    chatState.isOpen = !chatState.isOpen;
    updateToggleState();
    debouncedSaveState();
    broadcastUpdate("stateSync", chatState);

    if (chatState.isOpen) {
      elements.input.focus();
    }
  }

  function updateToggleState() {
    if (chatState.isOpen) {
      elements.panel.classList.add("open");
      elements.toggle.innerHTML = "×";
      elements.toggle.setAttribute("aria-label", "Close A.R.C.");
      elements.toggle.style.fontSize = "40px";
      elements.toggle.style.fontWeight = "300";
    } else {
      elements.panel.classList.remove("open");
      elements.toggle.innerHTML = `
        <picture>
          <source srcset="/arc-button-768.png 768w, /arc-button-512.png 512w, /arc-button-256.png 256w" type="image/png" />
          <img
            class="arc-btn-img"
            decoding="async"
            alt=""
            width="84" height="84"
            src="/arc-button-512.png"
            srcset="/arc-button-768.png 768w, /arc-button-512.png 512w, /arc-button-256.png 256w"
            sizes="84px"
          />
        </picture>
      `;
      elements.toggle.setAttribute(
        "aria-label",
        "Open A.R.C. - AI Resume Companion"
      );
    }
  }

  function clearChat() {
    chatState.history = [];
    chatState.sessionId = null;
    renderMessages();
    debouncedSaveState();
    broadcastUpdate("stateSync", chatState);
  }

  function renderMessages() {
    elements.messages.innerHTML = "";

    if (chatState.history.length === 0) {
      const welcome = document.createElement("div");
      welcome.className = "vibe-chat-message assistant";
      welcome.innerHTML = `
        Hello! I'm A.R.C., Cory's AI Resume Companion. I can tell you about his AWS expertise, projects, skills, and availability. What interests you?
        <button class="copy-btn" onclick="copyToClipboard(this)" title="Copy message">📋</button>
      `;
      elements.messages.appendChild(welcome);
    } else {
      chatState.history.forEach((message) => {
        const messageEl = document.createElement("div");
        messageEl.className = `vibe-chat-message ${message.role}`;

        if (message.role === "assistant") {
          messageEl.innerHTML = `
            ${message.content}
            <button class="copy-btn" onclick="copyToClipboard(this)" title="Copy message">📋</button>
          `;
        } else {
          messageEl.textContent = message.content;
        }

        elements.messages.appendChild(messageEl);
      });
    }

    elements.messages.scrollTop = elements.messages.scrollHeight;
  }

  function showTypingIndicator() {
    const typing = document.createElement("div");
    typing.className = "vibe-chat-message vibe-chat-typing";
    typing.textContent = "Processing your inquiry...";
    typing.id = "typing-indicator";
    elements.messages.appendChild(typing);
    elements.messages.scrollTop = elements.messages.scrollHeight;
  }

  function hideTypingIndicator() {
    const typing = document.getElementById("typing-indicator");
    if (typing) {
      typing.remove();
    }
  }

  function showError(message, retryable = false) {
    const error = document.createElement("div");
    error.className = "vibe-chat-error";
    error.innerHTML = `
      ${message}
      ${
        retryable
          ? '<button class="vibe-chat-retry" onclick="retryLastMessage()">Try Again</button>'
          : ""
      }
    `;
    elements.messages.appendChild(error);
    elements.messages.scrollTop = elements.messages.scrollHeight;
  }

  async function sendMessage() {
    const message = elements.input.value.trim();
    if (!message || isRequestInFlight) return;

    // Add user message
    chatState.history.push({ role: "user", content: message });
    elements.input.value = "";
    elements.input.style.height = "auto";

    renderMessages();
    showTypingIndicator();

    isRequestInFlight = true;
    elements.send.disabled = true;

    try {
      const response = await sendWithRetry({
        sessionId: chatState.sessionId,
        messages: chatState.history,
      });

      hideTypingIndicator();

      if (response.sessionId && !chatState.sessionId) {
        chatState.sessionId = response.sessionId;
      }

      chatState.history.push(response.message);
      renderMessages();

      broadcastUpdate("messageAdded", {
        sessionId: chatState.sessionId,
        history: chatState.history,
      });
    } catch (error) {
      hideTypingIndicator();
      console.error("Chat error details:", {
        message: error.message,
        stack: error.stack,
        retryable: error.retryable,
        apiUrl: apiUrl,
      });
      showError(
        error.retryable
          ? "I encountered a temporary issue. Please try again."
          : `I apologize, but I was unable to process your request. Error: ${error.message}`,
        error.retryable
      );
    } finally {
      isRequestInFlight = false;
      elements.send.disabled = false;
      debouncedSaveState();
    }
  }

  async function sendWithRetry(payload, maxRetries = MAX_RETRIES) {
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(`${apiUrl}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Request failed", {
            cause: { retryable: data.retryable !== false },
          });
        }

        return data;
      } catch (error) {
        lastError = error;

        const isRetryable =
          error.cause?.retryable !== false &&
          (error.name === "TypeError" || // Network error
            error.status >= 500);

        if (!isRetryable || attempt === maxRetries - 1) {
          error.retryable = isRetryable;
          throw error;
        }

        const delay = BASE_DELAY * Math.pow(2, attempt) + Math.random() * 1000;
        await sleep(delay);
      }
    }

    throw lastError;
  }

  function retryLastMessage() {
    // Remove the last user message and try again
    if (
      chatState.history.length > 0 &&
      chatState.history[chatState.history.length - 1].role === "user"
    ) {
      const lastMessage = chatState.history.pop();
      elements.input.value = lastMessage.content;
      renderMessages();
      sendMessage();
    }
  }

  function copyToClipboard(button) {
    const message = button.parentElement.textContent.replace("📋", "").trim();
    navigator.clipboard
      .writeText(message)
      .then(() => {
        button.textContent = "✓";
        setTimeout(() => {
          button.textContent = "📋";
        }, 2000);
      })
      .catch(() => {
        console.warn("Failed to copy to clipboard");
      });
  }

  // Global functions for inline event handlers
  window.toggleChat = toggleChat;
  window.clearChat = clearChat;
  window.copyToClipboard = copyToClipboard;
  window.retryLastMessage = retryLastMessage;

  // Initialize
  async function init() {
    await loadConfig();
    loadState();
    setupBroadcastChannel();
    createElements();
    updateToggleState();
    renderMessages();
  }

  // Start when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
