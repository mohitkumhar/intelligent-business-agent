/* ──────────────────────────────────────────────────────────────────
   chatbot.js – Conversation management & chat with the agent
   Shows conversation UUID in URL bar and displays agent intent badges.
   ────────────────────────────────────────────────────────────────── */

(function () {
    "use strict";

    // ── DOM references ─────────────────────────────────────────────
    const conversationList    = document.getElementById("conversationList");
    const noConversations     = document.getElementById("noConversations");
    const chatMessages        = document.getElementById("chatMessages");
    const welcomeScreen       = document.getElementById("welcomeScreen");
    const chatInput           = document.getElementById("chatInput");
    const btnSend             = document.getElementById("btnSend");
    const btnNewChat          = document.getElementById("btnNewChat");
    const chatSidebar         = document.getElementById("chatSidebar");
    const chatSidebarToggle   = document.getElementById("chatSidebarToggle");

    let activeConversationId  = null;
    let isSending             = false;

    // ── Intent display config ──────────────────────────────────────
    const INTENT_META = {
        database_request:            { label: "Database Agent",      icon: "fa-database",       color: "#5b8af5" },
        general_information_request: { label: "General Info Agent",   icon: "fa-circle-info",    color: "#a855f7" },
        greeting_request:            { label: "Greeting Agent",       icon: "fa-hand-wave",      color: "#4ecb71" },
        logs_request:                { label: "Logs Agent",           icon: "fa-file-lines",     color: "#f5a623" },
        metrics_request:             { label: "Metrics Agent",        icon: "fa-gauge-high",     color: "#22d3ee" },
    };

    // ── URL helpers ────────────────────────────────────────────────
    function pushConversationUrl(convId) {
        if (convId) {
            window.history.pushState({ convId }, "", `/chatbot/${convId}`);
        } else {
            window.history.pushState({}, "", `/chatbot`);
        }
    }

    function getConversationIdFromUrl() {
        const m = window.location.pathname.match(/\/chatbot\/([0-9a-f-]{36})/i);
        return m ? m[1] : null;
    }

    // Handle browser back/forward
    window.addEventListener("popstate", (e) => {
        const convId = getConversationIdFromUrl();
        if (convId) {
            selectConversation(convId, false); // false = don't push URL again
        } else {
            activeConversationId = null;
            showWelcome();
            highlightActiveConv();
        }
    });

    // ── API helpers ────────────────────────────────────────────────
    async function api(url, options = {}) {
        try {
            const resp = await fetch(url, options);
            return await resp.json();
        } catch (err) {
            console.error("API error:", err);
            return null;
        }
    }

    // ── Conversation List ──────────────────────────────────────────
    async function loadConversations() {
        const data = await api("/api/chat/conversations");
        if (!data) return;

        // Clear existing items (keep the empty state element)
        const items = conversationList.querySelectorAll(".conv-item");
        items.forEach((el) => el.remove());

        if (data.length === 0) {
            noConversations.style.display = "block";
            return;
        }
        noConversations.style.display = "none";

        data.forEach((conv) => {
            const el = document.createElement("div");
            el.className = "conv-item" + (conv.conversation_id === activeConversationId ? " active" : "");
            el.dataset.id = conv.conversation_id;

            const dateStr = conv.updated_at
                ? new Date(conv.updated_at + "Z").toLocaleString("en-US", {
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                  })
                : "";

            el.innerHTML = `
                <div class="conv-item-info">
                    <div class="conv-item-title">${escapeHtml(conv.title)}</div>
                    <div class="conv-item-date">${dateStr}</div>
                </div>
                <button class="conv-item-delete" title="Delete conversation">
                    <i class="fas fa-trash"></i>
                </button>
            `;

            el.querySelector(".conv-item-info").addEventListener("click", () => {
                selectConversation(conv.conversation_id);
            });

            el.querySelector(".conv-item-delete").addEventListener("click", async (e) => {
                e.stopPropagation();
                if (!confirm("Delete this conversation?")) return;
                await api(`/api/chat/conversations/${conv.conversation_id}`, { method: "DELETE" });
                if (activeConversationId === conv.conversation_id) {
                    activeConversationId = null;
                    showWelcome();
                    pushConversationUrl(null);
                }
                loadConversations();
            });

            conversationList.appendChild(el);
        });
    }

    function highlightActiveConv() {
        conversationList.querySelectorAll(".conv-item").forEach((el) => {
            el.classList.toggle("active", el.dataset.id === activeConversationId);
        });
    }

    // ── Select / load conversation ─────────────────────────────────
    async function selectConversation(convId, updateUrl = true) {
        activeConversationId = convId;
        highlightActiveConv();

        if (updateUrl) pushConversationUrl(convId);

        // Load messages
        const messages = await api(`/api/chat/conversations/${convId}/messages`);
        if (!messages) return;

        chatMessages.innerHTML = "";
        if (messages.length === 0) {
            showWelcome();
            return;
        }

        welcomeScreen && (welcomeScreen.style.display = "none");
        messages.forEach((msg) => {
            appendMessage(msg.role, msg.content, msg.created_at, msg.intent);
        });

        scrollToBottom();
        closeMobileSidebar();
    }

    // ── New chat ───────────────────────────────────────────────────
    async function createNewChat() {
        const data = await api("/api/chat/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: "New Chat" }),
        });
        if (!data) return;

        activeConversationId = data.conversation_id;
        pushConversationUrl(data.conversation_id);
        chatMessages.innerHTML = "";
        showWelcome();
        await loadConversations();
        closeMobileSidebar();
    }

    // ── Send message ───────────────────────────────────────────────
    async function sendMessage(text) {
        if (!text.trim() || isSending) return;

        // Auto-create conversation if none active
        if (!activeConversationId) {
            const data = await api("/api/chat/conversations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: text.trim().substring(0, 50) }),
            });
            if (!data) return;
            activeConversationId = data.conversation_id;
            pushConversationUrl(data.conversation_id);
            await loadConversations();
        }

        // Hide welcome screen
        if (welcomeScreen) welcomeScreen.style.display = "none";

        // Show user message
        appendMessage("user", text.trim());
        chatInput.value = "";
        autoResizeInput();

        // Show typing indicator with "processing" status
        const typingEl = showTypingIndicator();

        isSending = true;
        btnSend.disabled = true;

        // Send to API
        const result = await api("/api/chat/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                conversation_id: activeConversationId,
                message: text.trim(),
            }),
        });

        // Remove typing indicator
        typingEl.remove();
        isSending = false;
        btnSend.disabled = false;

        // Extract intent from response
        let intentStr = null;
        if (result && result.intent) {
            intentStr = result.intent;
        } else if (result && result.raw && result.raw.intent) {
            const ri = result.raw.intent;
            if (ri.intent && Array.isArray(ri.intent)) {
                intentStr = ri.intent.join(",");
            }
        }

        if (result && result.content) {
            appendMessage("assistant", result.content, null, intentStr);
        } else {
            appendMessage("assistant", "Sorry, I could not get a response. Please try again.");
        }

        scrollToBottom();
        loadConversations(); // refresh sidebar
    }

    // ── Intent badge builder ───────────────────────────────────────
    function buildIntentBadges(intentStr) {
        if (!intentStr) return "";
        const intents = intentStr.split(",").map((s) => s.trim()).filter(Boolean);
        if (intents.length === 0) return "";

        return `<div class="intent-badges">${intents.map((intent) => {
            const meta = INTENT_META[intent] || { label: intent, icon: "fa-robot", color: "#9ea2b8" };
            return `<span class="intent-badge" style="--intent-color: ${meta.color}">
                        <i class="fas ${meta.icon}"></i>
                        <span>${meta.label}</span>
                    </span>`;
        }).join("")}</div>`;
    }

    // ── DOM Helpers ────────────────────────────────────────────────
    function appendMessage(role, content, timestamp, intentStr) {
        const bubble = document.createElement("div");
        bubble.className = `message-bubble ${role}`;

        const avatar = role === "user" ? "U" : '<i class="fas fa-robot"></i>';
        const timeStr = timestamp
            ? new Date(timestamp + "Z").toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
            : new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

        let renderedContent = content;
        if (role === "assistant") {
            try {
                renderedContent = marked.parse(content);
            } catch {
                renderedContent = escapeHtml(content);
            }
        } else {
            renderedContent = escapeHtml(content);
        }

        const intentHtml = (role === "assistant") ? buildIntentBadges(intentStr) : "";

        bubble.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-body">
                ${intentHtml}
                <div class="message-content">${renderedContent}</div>
                <div class="message-time">${timeStr}</div>
            </div>
        `;

        chatMessages.appendChild(bubble);
        scrollToBottom();
    }

    function showTypingIndicator() {
        const el = document.createElement("div");
        el.className = "message-bubble assistant";
        el.id = "typingIndicator";
        el.innerHTML = `
            <div class="message-avatar"><i class="fas fa-robot"></i></div>
            <div class="message-body">
                <div class="intent-badges">
                    <span class="intent-badge processing" style="--intent-color: #5b8af5">
                        <i class="fas fa-spinner fa-spin"></i>
                        <span>Processing with Agent...</span>
                        <span class="intent-flow-indicator active"></span>
                    </span>
                </div>
                <div class="message-content">
                    <div class="typing-indicator">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            </div>
        `;
        chatMessages.appendChild(el);
        scrollToBottom();
        return el;
    }

    function showWelcome() {
        chatMessages.innerHTML = "";
        if (welcomeScreen) {
            const clone = welcomeScreen.cloneNode(true);
            clone.style.display = "flex";
            chatMessages.appendChild(clone);
            // Re-bind suggestion chips
            clone.querySelectorAll(".chip").forEach((chip) => {
                chip.addEventListener("click", () => sendSuggestion(chip));
            });
        }
    }

    function scrollToBottom() {
        requestAnimationFrame(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
    }

    function escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }

    function autoResizeInput() {
        chatInput.style.height = "auto";
        chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + "px";
    }

    function closeMobileSidebar() {
        if (chatSidebar) chatSidebar.classList.remove("open");
    }

    // ── Event listeners ────────────────────────────────────────────
    btnNewChat.addEventListener("click", createNewChat);

    btnSend.addEventListener("click", () => sendMessage(chatInput.value));

    chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage(chatInput.value);
        }
    });

    chatInput.addEventListener("input", autoResizeInput);

    if (chatSidebarToggle) {
        chatSidebarToggle.addEventListener("click", () => {
            chatSidebar.classList.toggle("open");
        });
    }

    // ── Global: suggestion chip handler ────────────────────────────
    window.sendSuggestion = function (chipEl) {
        const text = chipEl.textContent.trim();
        chatInput.value = text;
        sendMessage(text);
    };

    // ── Init ───────────────────────────────────────────────────────
    (async function init() {
        await loadConversations();

        // If URL has a conversation UUID, auto-select it
        const urlConvId = getConversationIdFromUrl();
        if (urlConvId) {
            await selectConversation(urlConvId, false);
        }
    })();
})();
