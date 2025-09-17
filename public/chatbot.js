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
        height: 84px;
        border-radius: 50%;
        background: transparent;
        border: none;
        cursor: pointer;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s ease;
      }
      
      .vibe-chat-toggle:hover { transform: scale(1.05); }
      .vibe-chat-toggle:active { transform: scale(0.98); }
      
      /* SVG logo base */
      .arc-logo {
        width: 84px;
        height: 84px;
        /* subtle pulsing neon bloom */
        animation: arcGlow 2.4s ease-in-out infinite;
        will-change: filter, transform;
        filter:
          drop-shadow(0 0 14px rgba(155, 0, 255, 0.55))   /* purple bias */
          drop-shadow(0 0 10px rgba(50, 140, 255, 0.35));
      }
      
      .vibe-chat-toggle:hover .arc-logo {
        animation: arcGlowHover 1.6s ease-in-out infinite;
        filter:
          drop-shadow(0 0 18px rgba(170, 0, 255, 0.65))
          drop-shadow(0 0 14px rgba(60, 150, 255, 0.45));
      }
      
      @keyframes arcGlow {
        0%, 100% {
          filter:
            drop-shadow(0 0 14px rgba(155, 0, 255, 0.55))
            drop-shadow(0 0 10px rgba(50, 140, 255, 0.35));
        }
        50% {
          filter:
            drop-shadow(0 0 22px rgba(170, 0, 255, 0.70))
            drop-shadow(0 0 16px rgba(70, 170, 255, 0.50));
        }
      }
      
      @keyframes arcGlowHover {
        0%, 100% {
          filter:
            drop-shadow(0 0 20px rgba(175, 0, 255, 0.75))
            drop-shadow(0 0 18px rgba(80, 180, 255, 0.55));
        }
        50% {
          filter:
            drop-shadow(0 0 28px rgba(195, 0, 255, 0.90))
            drop-shadow(0 0 22px rgba(95, 195, 255, 0.70));
        }
      }
      
      /* Respect reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .arc-logo { animation: none; }
        .vibe-chat-toggle:hover .arc-logo { animation: none; }
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
    const toggle = document.createElement("button");
    toggle.className = "vibe-chat-toggle";
    toggle.innerHTML = `
      <svg class="arc-logo" width="84" height="84" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <!-- Outer ring gradient (purple emphasis ~15% stronger, ~10% less blue) -->
          <linearGradient id="outerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"  stop-color="#B100FF"/>   <!-- neon purple -->
            <stop offset="55%" stop-color="#7A2BFF"/>   <!-- rich purple -->
            <stop offset="100%" stop-color="#1F7CFF"/>  <!-- blue, slightly reduced -->
          </linearGradient>
          
          <!-- Inner ring gradient (cooler, blue dominant but still VIBE) -->
          <linearGradient id="innerGrad" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%"   stop-color="#8A3BFF"/>
            <stop offset="70%"  stop-color="#2BA3FF"/>
            <stop offset="100%" stop-color="#1FA0FF"/>
          </linearGradient>
          
          <!-- Arc stroke gradient (blue → cyan hint at the tip) -->
          <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stop-color="#3C8BFF"/>
            <stop offset="100%" stop-color="#40FFE3"/>
          </linearGradient>
          
          <!-- Soft neon bloom -->
          <filter id="neonBloom" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.4" result="blur"/>
            <feColorMatrix in="blur" type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 1 0" result="colored"/>
            <feMerge>
              <feMergeNode in="colored"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          <!-- Round caps everywhere for smooth ends -->
          <style>
            .stroke { fill: none; stroke-linecap: round; stroke-linejoin: round; }
          </style>
        </defs>
        
        <!-- Group rotated 90° left to match requested orientation -->
        <g transform="translate(100,100) rotate(-90) translate(-100,-100)">
          <!-- OUTER RING -->
          <circle class="stroke" cx="100" cy="100" r="84"
                  stroke="url(#outerGrad)" stroke-width="16" filter="url(#neonBloom)"/>
          <!-- INNER RING -->
          <circle class="stroke" cx="100" cy="100" r="56"
                  stroke="url(#innerGrad)" stroke-width="14" filter="url(#neonBloom)"/>
          
          <!-- DIAGONAL INNER ARC (does NOT run into center) -->
          <!-- Arc spans ~120° with a short angled tail; offset to avoid any "Q" read -->
          <path class="stroke" stroke="url(#arcGrad)" stroke-width="14" filter="url(#neonBloom)"
                d="
                  M 132 116
                  A 40 40 0 0 1 76 124
                  M 108 132
                  L 132 116
                "/>
        </g>
      </svg>
    `;
    toggle.setAttribute("aria-label", "Open A.R.C. - AI Resume Companion");
    toggle.onclick = toggleChat;

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
        <svg class="arc-logo" width="84" height="84" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <!-- Outer ring gradient (purple emphasis ~15% stronger, ~10% less blue) -->
            <linearGradient id="outerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"  stop-color="#B100FF"/>   <!-- neon purple -->
              <stop offset="55%" stop-color="#7A2BFF"/>   <!-- rich purple -->
              <stop offset="100%" stop-color="#1F7CFF"/>  <!-- blue, slightly reduced -->
            </linearGradient>
            
            <!-- Inner ring gradient (cooler, blue dominant but still VIBE) -->
            <linearGradient id="innerGrad" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%"   stop-color="#8A3BFF"/>
              <stop offset="70%"  stop-color="#2BA3FF"/>
              <stop offset="100%" stop-color="#1FA0FF"/>
            </linearGradient>
            
            <!-- Arc stroke gradient (blue → cyan hint at the tip) -->
            <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stop-color="#3C8BFF"/>
              <stop offset="100%" stop-color="#40FFE3"/>
            </linearGradient>
            
            <!-- Soft neon bloom -->
            <filter id="neonBloom" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.4" result="blur"/>
              <feColorMatrix in="blur" type="matrix"
                values="1 0 0 0 0
                        0 1 0 0 0
                        0 0 1 0 0
                        0 0 0 1 0" result="colored"/>
              <feMerge>
                <feMergeNode in="colored"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            <!-- Round caps everywhere for smooth ends -->
            <style>
              .stroke { fill: none; stroke-linecap: round; stroke-linejoin: round; }
            </style>
          </defs>
          
          <!-- Group rotated 90° left to match requested orientation -->
          <g transform="translate(100,100) rotate(-90) translate(-100,-100)">
            <!-- OUTER RING -->
            <circle class="stroke" cx="100" cy="100" r="84"
                    stroke="url(#outerGrad)" stroke-width="16" filter="url(#neonBloom)"/>
            <!-- INNER RING -->
            <circle class="stroke" cx="100" cy="100" r="56"
                    stroke="url(#innerGrad)" stroke-width="14" filter="url(#neonBloom)"/>
            
            <!-- DIAGONAL INNER ARC (does NOT run into center) -->
            <!-- Arc spans ~120° with a short angled tail; offset to avoid any "Q" read -->
            <path class="stroke" stroke="url(#arcGrad)" stroke-width="14" filter="url(#neonBloom)"
                  d="
                    M 132 116
                    A 40 40 0 0 1 76 124
                    M 108 132
                    L 132 116
                  "/>
          </g>
        </svg>
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
