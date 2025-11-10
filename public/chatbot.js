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

  function stripMarkdown(s) {
    return String(s)
      .replace(/^#{1,6}\s+/gm, "")        // headers
      .replace(/\*\*(.*?)\*\*/g, "$1")    // bold
      .replace(/\*(.*?)\*/g, "$1")        // italics
      .replace(/`{1,3}[^`]*`{1,3}/g, m => m.replace(/`/g, "")) // inline code
      .replace(/^\s*-\s+/gm, "• ")        // dash lists
      .replace(/^\s*\*\s+/gm, "• ");      // star lists
  }

  function toHtml(text) {
    const t = stripMarkdown(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>");
    return t;
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
    // Helper function for image paths
    function getImagePath() {
      return window.location.pathname.includes("/public/") ? "./" : "public/";
    }

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
      
      /* Living, breathing neon bloom around the exact image */
      .vibe-chat-toggle::after {
        content: "";
        position: absolute;
        inset: -15px;
        /* spread glow beyond the icon edge for breathing effect */
        border-radius: 50%;
        pointer-events: none;
        opacity: 0.9;
        /* Multi-layered radial glows for depth */
        background:
          radial-gradient(70% 70% at 40% 35%, rgba(177, 0, 255, 0.45), transparent 65%),
          radial-gradient(60% 60% at 65% 60%, rgba(31, 160, 255, 0.35), transparent 70%),
          radial-gradient(50% 50% at 50% 50%, rgba(138, 59, 255, 0.25), transparent 75%);
        filter: blur(14px) brightness(1.1);
        transition: opacity .3s ease, filter .3s ease, transform .3s ease;
      }
      
      .vibe-chat-toggle:hover::after {
        opacity: 1;
        filter: blur(18px) brightness(1.25);
        transform: scale(1.08);
      }
      
      /* Living, breathing animation with multiple phases */
      @media (prefers-reduced-motion: no-preference) {
        .vibe-chat-toggle::after {
          animation: arcReactorBreathing 3.2s ease-in-out infinite;
        }
        
        .vibe-chat-toggle {
          animation: arcReactorPulse 4.8s ease-in-out infinite;
        }
        
        @keyframes arcReactorBreathing {
          0%, 100% { 
            filter: blur(14px) brightness(1.1);
            opacity: 0.9;
            transform: scale(1);
          }
          25% { 
            filter: blur(18px) brightness(1.2);
            opacity: 0.95;
            transform: scale(1.02);
          }
          50% { 
            filter: blur(22px) brightness(1.3);
            opacity: 1;
            transform: scale(1.05);
          }
          75% { 
            filter: blur(16px) brightness(1.15);
            opacity: 0.92;
            transform: scale(1.01);
          }
        }
        
        @keyframes arcReactorPulse {
          0%, 100% { 
            transform: scale(1);
            box-shadow: 0 0 20px rgba(177, 0, 255, 0.3);
          }
          33% { 
            transform: scale(1.01);
            box-shadow: 0 0 25px rgba(177, 0, 255, 0.4);
          }
          66% { 
            transform: scale(1.005);
            box-shadow: 0 0 30px rgba(31, 160, 255, 0.35);
          }
        }
        
        .vibe-chat-toggle:hover {
          animation: arcReactorPulseHover 2.4s ease-in-out infinite;
        }
        
        @keyframes arcReactorPulseHover {
          0%, 100% { 
            transform: scale(1.04);
            box-shadow: 0 0 35px rgba(177, 0, 255, 0.5);
          }
          50% { 
            transform: scale(1.06);
            box-shadow: 0 0 40px rgba(31, 160, 255, 0.6);
          }
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
        display: inline-flex;
        gap: 4px;
        align-items: center;
        padding: 12px 16px;
      }
      
      .vibe-chat-typing .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #9ca3af;
        animation: blink 1.2s infinite ease-in-out;
      }
      
      .vibe-chat-typing .dot:nth-child(2) {
        animation-delay: .15s;
      }
      
      .vibe-chat-typing .dot:nth-child(3) {
        animation-delay: .3s;
      }
      
      @keyframes blink {
        0%, 80%, 100% {
          opacity: .3;
          transform: translateY(0);
        }
        40% {
          opacity: 1;
          transform: translateY(-2px);
        }
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
    const imagePath = getImagePath();
    toggle.innerHTML = `
      <picture>
        <source srcset="${imagePath}arc-button-768.png 768w, ${imagePath}arc-button-512.png 512w, ${imagePath}arc-button-256.png 256w" type="image/png" />
        <img
          class="arc-btn-img"
          decoding="async"
          alt=""
          width="${ICON_SIZE}" height="${ICON_SIZE}"
          src="${imagePath}arc-button-512.png"
          srcset="${imagePath}arc-button-768.png 768w, ${imagePath}arc-button-512.png 512w, ${imagePath}arc-button-256.png 256w"
          sizes="${ICON_SIZE}px"
          onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODQiIGhlaWdodD0iODQiIHZpZXdCb3g9IjAgMCAyMDAgMjAwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iODAiIHN0cm9rZT0iIzgwODBmZiIgc3Ryb2tlLXdpZHRoPSI4IiBmaWxsPSJub25lIi8+PGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSI1MCIgc3Ryb2tlPSIjYjAwMGZmIiBzdHJva2Utd2lkdGg9IjYiIGZpbGw9Im5vbmUiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjIwIiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjkiLz48L3N2Zz4=';"
        />
      </picture>
    `;
    toggle.onclick = toggleChat; // keep your existing handler

    // Create chat panel
    const panel = document.createElement("div");
    panel.className = "vibe-chat-panel";
    panel.innerHTML = `
      <div class="vibe-chat-header">
        <h3 class="vibe-chat-title">A.R.C</h3>
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
      const imagePath = window.location.pathname.includes("/public/")
        ? "./"
        : "public/";
      elements.toggle.innerHTML = `
        <picture>
          <source srcset="${imagePath}arc-button-768.png 768w, ${imagePath}arc-button-512.png 512w, ${imagePath}arc-button-256.png 256w" type="image/png" />
          <img
            class="arc-btn-img"
            decoding="async"
            alt=""
            width="84" height="84"
            src="${imagePath}arc-button-512.png"
            srcset="${imagePath}arc-button-768.png 768w, ${imagePath}arc-button-512.png 512w, ${imagePath}arc-button-256.png 256w"
            sizes="84px"
            onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODQiIGhlaWdodD0iODQiIHZpZXdCb3g9IjAgMCAyMDAgMjAwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iODAiIHN0cm9rZT0iIzgwODBmZiIgc3Ryb2tlLXdpZHRoPSI4IiBmaWxsPSJub25lIi8+PGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSI1MCIgc3Ryb2tlPSIjYjAwMGZmIiBzdHJva2Utd2lkdGg9IjYiIGZpbGw9Im5vbmUiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjIwIiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjkiLz48L3N2Zz4=';"
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
        ${toHtml("Hello! I'm A.R.C., Cory's AI Resume Companion. I can tell you about his AWS expertise, projects, skills, and availability. What interests you?")}
        <button class="copy-btn" onclick="copyToClipboard(this)" title="Copy message">📋</button>
      `;
      elements.messages.appendChild(welcome);
    } else {
      chatState.history.forEach((message) => {
        const messageEl = document.createElement("div");
        messageEl.className = `vibe-chat-message ${message.role}`;

        if (message.role === "assistant") {
          messageEl.innerHTML = `
            ${toHtml(message.content)}
            <button class="copy-btn" onclick="copyToClipboard(this)" title="Copy message">📋</button>
          `;
        } else {
          messageEl.innerHTML = toHtml(message.content);
        }

        elements.messages.appendChild(messageEl);
      });
    }

    elements.messages.scrollTop = elements.messages.scrollHeight;
  }

  function showTypingIndicator() {
    const typing = document.createElement("div");
    typing.className = "vibe-chat-message vibe-chat-typing";
    typing.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
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

      // Handle follow-up message if present
      if (response.followUp) {
        const delay = 700 + Math.random() * 500; // 0.7-1.2 seconds
        setTimeout(() => {
          const followUpEl = document.createElement("div");
          followUpEl.className = "vibe-chat-message assistant";
          followUpEl.innerHTML = `
            ${toHtml(response.followUp)}
            <button class="copy-btn" onclick="copyToClipboard(this)" title="Copy message">📋</button>
          `;
          elements.messages.appendChild(followUpEl);
          elements.messages.scrollTop = elements.messages.scrollHeight;
        }, delay);
      }

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
