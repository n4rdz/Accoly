var MSG = { activeUserId: null, activeGroupId: null };

document.addEventListener('DOMContentLoaded', function () {
    if (window.__authReady) {
        initMessages();
    } else {
        window.addEventListener('authReady', initMessages);
    }
});

function initMessages() {
    var user = Storage.getCurrentUser();
    if (!user) return; // auth.js already redirected

    bindPremiumLocks();
    initUserPicker();
    renderConversationList();
    renderGroupList();
    bindChatActions();

    window.addEventListener('storage', function (e) {
        if (!e || !e.key) return;
        if (e.key === 'messages' || e.key === 'groupMessages' || e.key === 'groups') {
            renderConversationList();
            renderGroupList();
            renderChat();
        }
    });
}

function allUsersExceptMe() {
    var me = Storage.getCurrentUser();
    var users = JSON.parse(localStorage.getItem('users') || '[]');
    return users.filter(function (u) { return u.id !== me.id; });
}

function initUserPicker() {
    var picker = document.getElementById('msgUserPicker');
    picker.innerHTML = '<option value="">Select student…</option>';
    allUsersExceptMe().forEach(function (u) {
        var o = document.createElement('option');
        o.value = u.id;
        o.textContent = u.fullName + (u.subscriptionStatus === 'premium' ? ' ★' : '');
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
    var users = JSON.parse(localStorage.getItem('users') || '[]');
    var msgs = Storage.getMessages();

    var partnerIds = {};
    msgs.forEach(function (m) {
        if (m.fromUserId === me.id) partnerIds[m.toUserId] = true;
        if (m.toUserId === me.id) partnerIds[m.fromUserId] = true;
    });

    var partners = Object.keys(partnerIds)
        .map(function (id) { return users.find(function (u) { return u.id === id; }); })
        .filter(Boolean)
        .map(function (u) {
            var convo = Storage.getConversation(me.id, u.id);
            var last = convo[convo.length - 1];
            return { user: u, last: last };
        })
        .sort(function (a, b) {
            return new Date(b.last.createdAt).getTime() - new Date(a.last.createdAt).getTime();
        });

    var list = document.getElementById('conversationList');
    if (!partners.length) {
        list.innerHTML = '<p style="color:var(--text-secondary);margin:0;">No conversations yet. Start one above.</p>';
        return;
    }
    list.innerHTML = partners
        .map(function (p) {
            var preview = (p.last.body || '').slice(0, 60);
            return (
                '<button type="button" class="conv-item ' +
                (MSG.activeUserId === p.user.id ? 'active' : '') +
                '" data-id="' +
                p.user.id +
                '">' +
                '<div style="font-weight:700;color:var(--text-primary);">' +
                esc(p.user.fullName) +
                '</div>' +
                '<div style="font-size:0.85rem;color:var(--text-secondary);">' +
                esc(preview) +
                '</div>' +
                '</button>'
            );
        })
        .join('');

    list.querySelectorAll('.conv-item').forEach(function (btn) {
        btn.addEventListener('click', function () {
            openChat(btn.dataset.id);
        });
    });
}

function openChat(otherUserId) {
    MSG.activeUserId = otherUserId;
    MSG.activeGroupId = null;
    var users = JSON.parse(localStorage.getItem('users') || '[]');
    var other = users.find(function (u) { return u.id === otherUserId; });
    document.getElementById('chatTitle').textContent = other ? other.fullName : 'Conversation';
    document.getElementById('chatSubtitle').textContent = other && other.subscriptionStatus === 'premium' ? 'Premium student' : 'Basic student';
    renderChat();
    renderConversationList();
}

function openGroup(groupId) {
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
    var convo = MSG.activeGroupId
        ? Storage.getGroupConversation(MSG.activeGroupId)
        : Storage.getConversation(me.id, MSG.activeUserId);
    if (!convo.length) {
        chat.innerHTML = '<p style="color:var(--text-secondary);margin:0;">Say hi to start the conversation.</p>';
        return;
    }
    chat.innerHTML = convo
        .map(function (m) {
            var mine = m.fromUserId === me.id;
            return (
                '<div class="chat-row ' +
                (mine ? 'mine' : 'theirs') +
                '">' +
                '<div class="chat-bubble">' +
                (MSG.activeGroupId ? '<div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:0.25rem;">' + esc(displayName(m.fromUserId)) + '</div>' : '') +
                esc(m.body) +
                '<div class="chat-time">' +
                new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
                '</div>' +
                '</div>' +
                '</div>'
            );
        })
        .join('');
    chat.scrollTop = chat.scrollHeight;
}

function renderGroupList() {
    var me = Storage.getCurrentUser();
    var listEl = document.getElementById('groupList');
    if (!listEl) return;
    var groups = Storage.getGroups().filter(function (g) {
        return Array.isArray(g.memberIds) && g.memberIds.indexOf(me.id) !== -1;
    });
    if (!groups.length) {
        listEl.innerHTML = '<p style="color:var(--text-secondary);margin:0;">No groups yet. Premium users can create one.</p>';
        return;
    }
    listEl.innerHTML = groups
        .map(function (g) {
            return '<button type="button" class="conv-item ' + (MSG.activeGroupId === g.id ? 'active' : '') + '" data-gid="' + g.id + '">' +
                '<div style="font-weight:800;color:var(--text-primary);">' + esc(g.name) + '</div>' +
                '<div style="font-size:0.85rem;color:var(--text-secondary);">' + esc(g.subject || 'General') + '</div>' +
                '</button>';
        })
        .join('');
    listEl.querySelectorAll('[data-gid]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            openGroup(btn.dataset.gid);
        });
    });
}

function bindChatActions() {
    document.getElementById('btnSendMsg').addEventListener('click', sendMessage);
    document.getElementById('chatInput').addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

function sendMessage() {
    var me = Storage.getCurrentUser();
    if (!me) {
        AccountifyUI.toast('Please login to send messages', 'error');
        return;
    }
    
    if (!MSG.activeUserId && !MSG.activeGroupId) {
        AccountifyUI.toast('Select a conversation first', 'warning');
        return;
    }
    
    var input = document.getElementById('chatInput');
    var body = (input.value || '').trim();
    
    // Input validation
    if (!body) return;
    if (body.length > 1000) {
        AccountifyUI.toast('Message too long (max 1000 characters)', 'warning');
        return;
    }
    
    // Check for script injection
    if (/<script|javascript:|on\w+=/i.test(body)) {
        AccountifyUI.toast('Invalid content detected', 'error');
        return;
    }

    try {
        if (MSG.activeGroupId) {
            Storage.saveGroupMessage({ groupId: MSG.activeGroupId, fromUserId: me.id, body: body });
        } else {
            Storage.saveMessage({ fromUserId: me.id, toUserId: MSG.activeUserId, body: body });
        }
        input.value = '';

        if (!MSG.activeGroupId) {
            Storage.addNotification({ userId: MSG.activeUserId, message: 'New message from ' + esc(me.fullName) });
            if (window.AccountifyNav) AccountifyNav.refreshNotifications();
        } else {
            // notify all other members (best-effort)
            var g = Storage.getGroups().find(function (x) { return x.id === MSG.activeGroupId; });
            if (g && Array.isArray(g.memberIds)) {
                g.memberIds.forEach(function (id) {
                    if (id === me.id) return;
                    Storage.addNotification({ userId: id, message: 'New group message in ' + esc(g.name || 'Group') });
                });
                if (window.AccountifyNav) AccountifyNav.refreshNotifications();
            }
        }
        renderChat();
        renderConversationList();
        renderGroupList();
    } catch (error) {
        console.error('Send message error:', error);
        AccountifyUI.toast('Failed to send message', 'error');
    }
}

function bindPremiumLocks() {
    var btn = document.getElementById('btnPremiumGroup');
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
    var users = JSON.parse(localStorage.getItem('users') || '[]');
    var u = users.find(function (x) { return x.id === userId; });
    return u ? u.fullName : 'Student';
}

function esc(s) {
    var d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
}

function logout() {
    Storage.logout();
    window.location.href = 'login.html';
}