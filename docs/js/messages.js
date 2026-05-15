var MSG = { activeUserId: null, activeGroupId: null };

function msgPremium() {
    return window.AccolySubscription && AccolySubscription.isPremiumUser();
}

// In-memory caches
var MSG_ALL_USERS = [];
var MSG_CONVO_CACHE = [];

document.addEventListener('DOMContentLoaded', function () {
    if (window.__authReady) {
        initMessages();
    } else {
        window.addEventListener('authReady', initMessages);
    }
});

function initMessages() {
    var user = Storage.getCurrentUser();
    if (!user) return;

    bindPremiumLocks();
    bindChatActions();

    SupabaseClient.getAllUsers().then(function (users) {
        MSG_ALL_USERS = users || [];
        initUserPicker();
        renderConversationList();
        renderGroupList();
    }).catch(function () {
        MSG_ALL_USERS = [];
        initUserPicker();
        renderConversationList();
        renderGroupList();
    });

    // Poll for new messages every 5 seconds
    setInterval(function () {
        if (MSG.activeUserId) refreshActiveChat();
    }, 5000);

    // Groups still use localStorage
    window.addEventListener('storage', function (e) {
        if (!e || !e.key) return;
        if (e.key === 'groupMessages' || e.key === 'groups') {
            renderGroupList();
            if (MSG.activeGroupId) renderChat();
        }
    });
}

function allUsersExceptMe() {
    var me = Storage.getCurrentUser();
    return MSG_ALL_USERS.filter(function (u) { return u.id !== me.id; });
}

function initUserPicker() {
    var picker = document.getElementById('msgUserPicker');
    var others = allUsersExceptMe();
    picker.innerHTML = '<option value="">Select student...</option>';
    if (others.length === 0) {
        picker.innerHTML += '<option value="" disabled>No other students found</option>';
    }
    others.forEach(function (u) {
        var o = document.createElement('option');
        o.value = u.id;
        o.textContent = u.fullName + (u.subscriptionStatus === 'premium' ? ' *' : '');
        picker.appendChild(o);
    });
    document.getElementById('btnStartChat').addEventListener('click', function () {
        var id = picker.value;
        if (!id) return AccountifyUI.toast('Pick a student first', 'warning');
        openChat(id);
    });
}

function renderConversationList() {
    var me = Storage.getCurrentUser();
    var list = document.getElementById('conversationList');
    list.innerHTML = '<p style="color:var(--text-secondary);margin:0;">Loading...</p>';

    _sb.from('messages').select('*')
        .or('from_user_id.eq.' + me.id + ',to_user_id.eq.' + me.id)
        .order('created_at', { ascending: false })
        .then(function (result) {
            var msgs = (result && result.data) ? result.data : [];
            var partnerMap = {};
            msgs.forEach(function (m) {
                var partnerId = m.from_user_id === me.id ? m.to_user_id : m.from_user_id;
                if (!partnerMap[partnerId]) partnerMap[partnerId] = m;
            });

            var partnerIds = Object.keys(partnerMap);
            if (!partnerIds.length) {
                list.innerHTML = '<p style="color:var(--text-secondary);margin:0;">No conversations yet. Start one above.</p>';
                return;
            }

            list.innerHTML = partnerIds.map(function (id) {
                var user = MSG_ALL_USERS.find(function (u) { return u.id === id; });
                var name = user ? user.fullName : 'Student';
                var preview = (partnerMap[id].body || '').slice(0, 60);
                return '<button type="button" class="conv-item ' +
                    (MSG.activeUserId === id ? 'active' : '') +
                    '" data-id="' + id + '">' +
                    '<div style="font-weight:700;color:var(--text-primary);">' + esc(name) + '</div>' +
                    '<div style="font-size:0.85rem;color:var(--text-secondary);">' + esc(preview) + '</div>' +
                    '</button>';
            }).join('');

            list.querySelectorAll('.conv-item').forEach(function (btn) {
                btn.addEventListener('click', function () { openChat(btn.dataset.id); });
            });
        }).catch(function () {
            list.innerHTML = '<p style="color:var(--text-secondary);margin:0;">Could not load conversations.</p>';
        });
}

function openChat(otherUserId) {
    MSG.activeUserId = otherUserId;
    MSG.activeGroupId = null;
    var other = MSG_ALL_USERS.find(function (u) { return u.id === otherUserId; });
    document.getElementById('chatTitle').textContent = other ? other.fullName : 'Conversation';
    document.getElementById('chatSubtitle').textContent = other && other.subscriptionStatus === 'premium' ? 'Premium student' : 'Basic student';
    MSG_CONVO_CACHE = [];
    renderChat();
    renderConversationList();
}

function openGroup(groupId) {
    if (!msgPremium()) {
        checkPremiumAccess('Group chat');
        return;
    }
    MSG.activeGroupId = groupId;
    MSG.activeUserId = null;
    var groups = Storage.getGroups();
    var g = groups.find(function (x) { return x.id === groupId; });
    document.getElementById('chatTitle').textContent = g ? g.name : 'Group chat';
    document.getElementById('chatSubtitle').textContent = g && g.subject ? 'Subject: ' + g.subject : 'Group';
    renderChat();
    renderGroupList();
}

function renderChat() {
    var me = Storage.getCurrentUser();
    var chat = document.getElementById('chatMessages');

    if (!MSG.activeUserId && !MSG.activeGroupId) {
        chat.innerHTML = '<div class="empty-state"><h3>No chat selected</h3><p>Start or select a conversation.</p></div>';
        return;
    }

    if (MSG.activeGroupId) {
        if (!msgPremium()) {
            AccountifyUI.toast('Group chat requires Premium', 'warning');
            return;
        }
        var convo = Storage.getGroupConversation(MSG.activeGroupId);
        renderMessages(chat, convo, me.id);
        return;
    }

    chat.innerHTML = '<p style="color:var(--text-secondary);margin:0;">Loading...</p>';
    SupabaseClient.getMessages(me.id, MSG.activeUserId).then(function (msgs) {
        MSG_CONVO_CACHE = msgs || [];
        renderMessages(chat, MSG_CONVO_CACHE, me.id);
    }).catch(function () {
        chat.innerHTML = '<p style="color:var(--text-secondary);">Could not load messages.</p>';
    });
}

function refreshActiveChat() {
    var me = Storage.getCurrentUser();
    if (!me || !MSG.activeUserId) return;
    SupabaseClient.getMessages(me.id, MSG.activeUserId).then(function (msgs) {
        if (!msgs || msgs.length === MSG_CONVO_CACHE.length) return;
        MSG_CONVO_CACHE = msgs;
        var chat = document.getElementById('chatMessages');
        renderMessages(chat, MSG_CONVO_CACHE, me.id);
        renderConversationList();
    }).catch(function () {});
}

function renderMessages(chat, convo, myId) {
    if (!convo || !convo.length) {
        chat.innerHTML = '<p style="color:var(--text-secondary);margin:0;">Say hi to start the conversation.</p>';
        return;
    }
    chat.innerHTML = convo.map(function (m) {
        var mine = m.fromUserId === myId;
        return '<div class="chat-row ' + (mine ? 'mine' : 'theirs') + '">' +
            '<div class="chat-bubble">' +
            (MSG.activeGroupId ? '<div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:0.25rem;">' + esc(displayName(m.fromUserId)) + '</div>' : '') +
            esc(m.body) +
            '<div class="chat-time">' +
            new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
            '</div></div></div>';
    }).join('');
    chat.scrollTop = chat.scrollHeight;
}

function renderGroupList() {
    var me = Storage.getCurrentUser();
    var listEl = document.getElementById('groupList');
    if (!listEl) return;
    if (!msgPremium()) {
        listEl.innerHTML = '<p style="color:var(--text-secondary);margin:0;">Group chat is Premium. Upgrade to join or create study groups.</p>';
        return;
    }
    var groups = Storage.getGroups().filter(function (g) {
        return Array.isArray(g.memberIds) && g.memberIds.indexOf(me.id) !== -1;
    });
    if (!groups.length) {
        listEl.innerHTML = '<p style="color:var(--text-secondary);margin:0;">No groups yet. Premium users can create one.</p>';
        return;
    }
    listEl.innerHTML = groups.map(function (g) {
        return '<button type="button" class="conv-item ' + (MSG.activeGroupId === g.id ? 'active' : '') + '" data-gid="' + g.id + '">' +
            '<div style="font-weight:800;color:var(--text-primary);">' + esc(g.name) + '</div>' +
            '<div style="font-size:0.85rem;color:var(--text-secondary);">' + esc(g.subject || 'General') + '</div>' +
            '</button>';
    }).join('');
    listEl.querySelectorAll('[data-gid]').forEach(function (btn) {
        btn.addEventListener('click', function () { openGroup(btn.dataset.gid); });
    });
}

function bindChatActions() {
    document.getElementById('btnSendMsg').addEventListener('click', sendMessage);
    document.getElementById('chatInput').addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
}

function sendMessage() {
    var me = Storage.getCurrentUser();
    if (!me) { AccountifyUI.toast('Please login to send messages', 'error'); return; }
    if (!MSG.activeUserId && !MSG.activeGroupId) { AccountifyUI.toast('Select a conversation first', 'warning'); return; }

    var input = document.getElementById('chatInput');
    var sendBtn = document.getElementById('btnSendMsg');
    var body = (input.value || '').trim();
    if (!body) return;
    if (body.length > 1000) { AccountifyUI.toast('Message too long (max 1000 characters)', 'warning'); return; }
    if (/<script|javascript:|on\w+=/i.test(body)) { AccountifyUI.toast('Invalid content detected', 'error'); return; }

    input.disabled = true;
    sendBtn.disabled = true;

    if (MSG.activeGroupId) {
        if (!msgPremium()) {
            input.disabled = false;
            sendBtn.disabled = false;
            return;
        }
        try {
            Storage.saveGroupMessage({ groupId: MSG.activeGroupId, fromUserId: me.id, body: body });
            input.value = '';
            var g = Storage.getGroups().find(function (x) { return x.id === MSG.activeGroupId; });
            if (g && Array.isArray(g.memberIds)) {
                g.memberIds.forEach(function (id) {
                    if (id === me.id) return;
                    SupabaseClient.addNotification({ userId: id, message: 'New group message in ' + esc(g.name || 'Group') }).catch(function () {});
                });
                if (window.AccountifyNav) AccountifyNav.refreshNotifications().catch(function () {});
            }
            renderChat();
            renderGroupList();
        } catch (err) {
            AccountifyUI.toast('Failed to send message', 'error');
        } finally {
            input.disabled = false;
            sendBtn.disabled = false;
        }
        return;
    }

    // Direct message via Supabase
    SupabaseClient.saveMessage({ fromUserId: me.id, toUserId: MSG.activeUserId, body: body })
        .then(function (saved) {
            if (!saved) { AccountifyUI.toast('Failed to send message', 'error'); return; }
            input.value = '';
            MSG_CONVO_CACHE.push(saved);
            var chat = document.getElementById('chatMessages');
            renderMessages(chat, MSG_CONVO_CACHE, me.id);
            renderConversationList();
            SupabaseClient.addNotification({ userId: MSG.activeUserId, message: 'New message from ' + me.fullName }).catch(function () {});
        })
        .catch(function () {
            AccountifyUI.toast('Failed to send message', 'error');
        })
        .finally(function () {
            input.disabled = false;
            sendBtn.disabled = false;
            input.focus();
        });
}

function bindPremiumLocks() {
    var btn = document.getElementById('btnPremiumGroup');
    if (!btn) return;
    btn.setAttribute('data-premium', 'true');
    btn.addEventListener('click', function () {
        if (!checkPremiumAccess('Group chat creation')) return;
        createGroupFlow();
    });
}

function createGroupFlow() {
    var me = Storage.getCurrentUser();
    var name = window.prompt('Group name');
    if (!name) return;
    var subject = window.prompt('Subject (optional)', 'Financial Accounting') || '';
    var g = Storage.saveGroup({ name: name.trim(), subject: subject.trim(), createdBy: me.id, memberIds: [me.id] });
    AccountifyUI.toast('Group created', 'success');
    renderGroupList();
    openGroup(g.id);
}

function displayName(userId) {
    var u = MSG_ALL_USERS.find(function (x) { return x.id === userId; });
    return u ? u.fullName : 'Student';
}

function esc(s) {
    var d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
}

function logout() {
    SupabaseClient.signOut().finally(function () {
        Storage.logout();
        window.location.replace('login.html');
    });
}
