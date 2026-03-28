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

        // Send to API via Fetch to stream
        try {
            const resp = await fetch("/api/chat/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    conversation_id: activeConversationId,
                    message: text.trim(),
                }),
            });

            typingEl.remove();

            if (!resp.ok) {
                appendMessage("assistant", "Sorry, an error occurred communicating with the server.");
                isSending = false;
                btnSend.disabled = false;
                return;
            }

            const streamBubble = appendStreamMessage("assistant");
            const reader = resp.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedContent = "";
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n\n");
                buffer = lines.pop() || ""; // keep partial chunk
                
                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const payload = line.substring(6);
                        try {
                            const chunkData = JSON.parse(payload);
                            if (chunkData.type === "token") {
                                accumulatedContent += chunkData.content || "";
                                streamBubble.updateContent(accumulatedContent);
                            } else if (chunkData.type === "status") {
                                streamBubble.updateStatus(chunkData.status);
                            } else if (chunkData.type === "final") {
                                if (chunkData.content) {
                                    accumulatedContent = chunkData.content;
                                    streamBubble.updateContent(accumulatedContent);
                                }
                                streamBubble.updateIntents(chunkData.intent_str);
                                streamBubble.updateStatus("");
                            } else if (chunkData.type === "clarification") {
                                const clarif = chunkData.clarification;
                                accumulatedContent = typeof clarif === "string" ? clarif : (clarif.message || "Please clarify");
                                streamBubble.updateContent(accumulatedContent);
                                streamBubble.updateIntents(chunkData.intent_str);
                                streamBubble.updateStatus("");
                            } else if (chunkData.type === "error") {
                                accumulatedContent = "⚠️ Error: " + (chunkData.error || "Unknown");
                                streamBubble.updateContent(accumulatedContent);
                                streamBubble.updateStatus("");
                            }
                        } catch(e) { /* ignore parse error for chunk */ }
                    }
                }
            }

            // flush any remaining buffer
            if (buffer.startsWith("data: ")) {
                 try {
                     const payload = buffer.substring(6);
                     const chunkData = JSON.parse(payload);
                     if (chunkData.type === "token") {
                         accumulatedContent += chunkData.content || "";
                         streamBubble.updateContent(accumulatedContent);
                     } else if (chunkData.type === "final") {
                         streamBubble.updateIntents(chunkData.intent_str);
                         streamBubble.updateStatus("");
                     }
                 } catch(e) { }
            }

        } catch (err) {
            typingEl.remove();
            appendMessage("assistant", "Sorry, I could not connect. Please try again.");
        }

        isSending = false;
        btnSend.disabled = false;
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
    function appendStreamMessage(role, timestamp) {
        const bubble = document.createElement("div");
        bubble.className = `message-bubble ${role}`;

        const avatar = role === "user" ? "U" : '<i class="fas fa-robot"></i>';
        const timeStr = timestamp
            ? new Date(timestamp + "Z").toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
            : new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

        bubble.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-body">
                <div class="dynamic-intents"></div>
                <div class="agent-status" style="font-size: 0.8em; color: #888; font-style: italic; margin-bottom: 5px;"></div>
                <div class="message-content"></div>
                <div class="message-time">${timeStr}</div>
            </div>
        `;
        chatMessages.appendChild(bubble);
        scrollToBottom();
        return {
            updateContent: (text) => {
                const contentDiv = bubble.querySelector(".message-content");
                try {
                    contentDiv.innerHTML = marked.parse(text);
                } catch {
                    contentDiv.innerHTML = escapeHtml(text);
                }
                scrollToBottom();
            },
            updateIntents: (intentStr) => {
                const intentsDiv = bubble.querySelector(".dynamic-intents");
                intentsDiv.innerHTML = buildIntentBadges(intentStr);
            },
            updateStatus: (statusText) => {
                const statusDiv = bubble.querySelector(".agent-status");
                if (statusText) {
                    statusDiv.style.display = "block";
                    statusDiv.innerHTML = '<i class="fas fa-circle-notch fa-spin" style="margin-right: 5px;"></i>' + escapeHtml(statusText);
                } else {
                    statusDiv.style.display = "none";
                }
                scrollToBottom();
            }
        };
    }

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
