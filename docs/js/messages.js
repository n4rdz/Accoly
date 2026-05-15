var MSG = { activeUserId: null, activeGroupId: null, groups: [] };

function msgPremium() {
    return window.AccolySubscription && AccolySubscription.isPremiumUser();
}

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
    bindGroupModals();

    SupabaseClient.getAllUsers()
        .then(function (users) {
            MSG_ALL_USERS = users || [];
            initUserPicker();
            renderConversationList();
            return refreshGroups();
        })
        .catch(function () {
            MSG_ALL_USERS = [];
            initUserPicker();
            renderConversationList();
            renderGroupList();
        });

    setInterval(function () {
        if (MSG.activeUserId) refreshActiveChat();
        if (MSG.activeGroupId) refreshActiveGroupChat();
    }, 5000);
}

function refreshGroups() {
    var me = Storage.getCurrentUser();
    if (!me) return Promise.resolve();
    return SupabaseClient.getGroupsForUser(me.id)
        .then(function (groups) {
            MSG.groups = groups || [];
            renderGroupList();
        })
        .catch(function () {
            MSG.groups = [];
            renderGroupList();
        });
}

function allUsersExceptMe() {
    var me = Storage.getCurrentUser();
    return MSG_ALL_USERS.filter(function (u) {
        return u.id !== me.id;
    });
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
    var list = document.getElementById('conversationList');
    list.innerHTML = '<p style="color:var(--text-secondary);margin:0;">Loading...</p>';

    _sb
        .from('messages')
        .select('*')
        .or('from_user_id.eq.' + me.id + ',to_user_id.eq.' + me.id)
        .order('created_at', { ascending: false })
        .then(function (result) {
            var msgs = result && result.data ? result.data : [];
            var partnerMap = {};
            msgs.forEach(function (m) {
                var partnerId = m.from_user_id === me.id ? m.to_user_id : m.from_user_id;
                if (!partnerMap[partnerId]) partnerMap[partnerId] = m;
            });

            var partnerIds = Object.keys(partnerMap);
            if (!partnerIds.length) {
                list.innerHTML =
                    '<p style="color:var(--text-secondary);margin:0;">No conversations yet. Start one above.</p>';
                return;
            }

            list.innerHTML = partnerIds
                .map(function (id) {
                    var user = MSG_ALL_USERS.find(function (u) {
                        return u.id === id;
                    });
                    var name = user ? user.fullName : 'Student';
                    var preview = (partnerMap[id].body || '').slice(0, 60);
                    return (
                        '<button type="button" class="conv-item ' +
                        (MSG.activeUserId === id ? 'active' : '') +
                        '" data-id="' +
                        id +
                        '">' +
                        '<div style="font-weight:700;color:var(--text-primary);">' +
                        esc(name) +
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
        })
        .catch(function () {
            list.innerHTML =
                '<p style="color:var(--text-secondary);margin:0;">Could not load conversations.</p>';
        });
}

function openChat(otherUserId) {
    MSG.activeUserId = otherUserId;
    MSG.activeGroupId = null;
    var other = MSG_ALL_USERS.find(function (u) {
        return u.id === otherUserId;
    });
    document.getElementById('chatTitle').textContent = other ? other.fullName : 'Conversation';
    document.getElementById('chatSubtitle').textContent =
        other && other.subscriptionStatus === 'premium' ? 'Premium student' : 'Basic student';
    toggleGroupActions(false);
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
    var g = MSG.groups.find(function (x) {
        return x.id === groupId;
    });
    document.getElementById('chatTitle').textContent = g ? g.name : 'Group chat';
    var subjLabel =
        g && g.subject && window.AccolyStats ? AccolyStats.getSubjectLabel(g.subject) : g ? g.subject : '';
    document.getElementById('chatSubtitle').textContent = subjLabel
        ? 'Subject: ' + subjLabel
        : 'Group · ' + (g && g.memberIds ? g.memberIds.length : 0) + ' members';
    toggleGroupActions(true);
    renderChat();
    renderGroupList();
}

function toggleGroupActions(show) {
    var addBtn = document.getElementById('btnAddGroupMember');
    if (addBtn) addBtn.hidden = !show;
}

function renderChat() {
    var me = Storage.getCurrentUser();
    var chat = document.getElementById('chatMessages');

    if (!MSG.activeUserId && !MSG.activeGroupId) {
        chat.innerHTML =
            '<div class="empty-state"><h3>No chat selected</h3><p>Start or select a conversation.</p></div>';
        toggleGroupActions(false);
        return;
    }

    if (MSG.activeGroupId) {
        if (!msgPremium()) {
            AccountifyUI.toast('Group chat requires Premium', 'warning');
            return;
        }
        chat.innerHTML = '<p style="color:var(--text-secondary);margin:0;">Loading...</p>';
        SupabaseClient.getGroupMessages(MSG.activeGroupId)
            .then(function (msgs) {
                renderMessages(chat, msgs || [], me.id);
            })
            .catch(function () {
                chat.innerHTML = '<p style="color:var(--text-secondary);">Could not load group messages.</p>';
            });
        return;
    }

    chat.innerHTML = '<p style="color:var(--text-secondary);margin:0;">Loading...</p>';
    SupabaseClient.getMessages(me.id, MSG.activeUserId)
        .then(function (msgs) {
            MSG_CONVO_CACHE = msgs || [];
            renderMessages(chat, MSG_CONVO_CACHE, me.id);
        })
        .catch(function () {
            chat.innerHTML = '<p style="color:var(--text-secondary);">Could not load messages.</p>';
        });
}

function refreshActiveChat() {
    var me = Storage.getCurrentUser();
    if (!me || !MSG.activeUserId) return;
    SupabaseClient.getMessages(me.id, MSG.activeUserId)
        .then(function (msgs) {
            if (!msgs || msgs.length === MSG_CONVO_CACHE.length) return;
            MSG_CONVO_CACHE = msgs;
            var chat = document.getElementById('chatMessages');
            renderMessages(chat, MSG_CONVO_CACHE, me.id);
            renderConversationList();
        })
        .catch(function () {});
}

function refreshActiveGroupChat() {
    if (!MSG.activeGroupId) return;
    var me = Storage.getCurrentUser();
    SupabaseClient.getGroupMessages(MSG.activeGroupId)
        .then(function (msgs) {
            var chat = document.getElementById('chatMessages');
            renderMessages(chat, msgs || [], me.id);
        })
        .catch(function () {});
}

function renderMessages(chat, convo, myId) {
    if (!convo || !convo.length) {
        chat.innerHTML = '<p style="color:var(--text-secondary);margin:0;">Say hi to start the conversation.</p>';
        return;
    }
    chat.innerHTML = convo
        .map(function (m) {
            var mine = m.fromUserId === myId;
            return (
                '<div class="chat-row ' +
                (mine ? 'mine' : 'theirs') +
                '">' +
                '<div class="chat-bubble">' +
                (MSG.activeGroupId
                    ? '<div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:0.25rem;">' +
                      esc(displayName(m.fromUserId)) +
                      '</div>'
                    : '') +
                esc(m.body) +
                '<div class="chat-time">' +
                new Date(m.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                }) +
                '</div></div></div>'
            );
        })
        .join('');
    chat.scrollTop = chat.scrollHeight;
}

function renderGroupList() {
    var listEl = document.getElementById('groupList');
    if (!listEl) return;
    if (!msgPremium()) {
        listEl.innerHTML =
            '<p style="color:var(--text-secondary);margin:0;">Group chat is Premium. Upgrade to create study groups and add members.</p>';
        return;
    }
    if (!MSG.groups.length) {
        listEl.innerHTML =
            '<p style="color:var(--text-secondary);margin:0;">No groups yet. Use <strong>Create group</strong> to start one.</p>';
        return;
    }
    listEl.innerHTML = MSG.groups
        .map(function (g) {
            var subj =
                g.subject && window.AccolyStats ? AccolyStats.getSubjectShortLabel(g.subject) : g.subject || 'General';
            return (
                '<button type="button" class="conv-item ' +
                (MSG.activeGroupId === g.id ? 'active' : '') +
                '" data-gid="' +
                g.id +
                '">' +
                '<div style="font-weight:800;color:var(--text-primary);">' +
                esc(g.name) +
                '</div>' +
                '<div style="font-size:0.85rem;color:var(--text-secondary);">' +
                esc(subj) +
                ' · ' +
                (g.memberIds ? g.memberIds.length : 0) +
                ' members</div>' +
                '</button>'
            );
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
    var sendBtn = document.getElementById('btnSendMsg');
    var body = (input.value || '').trim();
    if (!body) return;
    if (body.length > 1000) {
        AccountifyUI.toast('Message too long (max 1000 characters)', 'warning');
        return;
    }
    if (/<script|javascript:|on\w+=/i.test(body)) {
        AccountifyUI.toast('Invalid content detected', 'error');
        return;
    }

    input.disabled = true;
    sendBtn.disabled = true;

    if (MSG.activeGroupId) {
        if (!msgPremium()) {
            input.disabled = false;
            sendBtn.disabled = false;
            return;
        }
        SupabaseClient.saveGroupMessage({
            groupId: MSG.activeGroupId,
            fromUserId: me.id,
            body: body
        })
            .then(function (saved) {
                if (!saved) {
                    AccountifyUI.toast('Failed to send message', 'error');
                    return;
                }
                input.value = '';
                var g = MSG.groups.find(function (x) {
                    return x.id === MSG.activeGroupId;
                });
                if (g && Array.isArray(g.memberIds)) {
                    g.memberIds.forEach(function (id) {
                        if (id === me.id) return;
                        SupabaseClient.addNotification({
                            userId: id,
                            message: 'New group message in ' + (g.name || 'Group')
                        }).catch(function () {});
                    });
                }
                refreshActiveGroupChat();
            })
            .catch(function () {
                AccountifyUI.toast('Failed to send message', 'error');
            })
            .finally(function () {
                input.disabled = false;
                sendBtn.disabled = false;
            });
        return;
    }

    SupabaseClient.saveMessage({ fromUserId: me.id, toUserId: MSG.activeUserId, body: body })
        .then(function (saved) {
            if (!saved) {
                AccountifyUI.toast('Failed to send message', 'error');
                return;
            }
            input.value = '';
            MSG_CONVO_CACHE.push(saved);
            var chat = document.getElementById('chatMessages');
            renderMessages(chat, MSG_CONVO_CACHE, me.id);
            renderConversationList();
            SupabaseClient.addNotification({
                userId: MSG.activeUserId,
                message: 'New message from ' + me.fullName
            }).catch(function () {});
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
        openCreateGroupModal();
    });
    var addBtn = document.getElementById('btnAddGroupMember');
    if (addBtn) {
        addBtn.setAttribute('data-premium', 'true');
        addBtn.addEventListener('click', function () {
            if (!msgPremium()) return checkPremiumAccess('Add group members');
            if (!MSG.activeGroupId) return AccountifyUI.toast('Open a group first', 'warning');
            openAddMemberModal();
        });
    }
}

function bindGroupModals() {
    var createClose = document.getElementById('groupModalClose');
    var createCancel = document.getElementById('groupModalCancel');
    var createSave = document.getElementById('groupModalSave');
    if (createClose) createClose.addEventListener('click', closeCreateGroupModal);
    if (createCancel) createCancel.addEventListener('click', closeCreateGroupModal);
    if (createSave) createSave.addEventListener('click', saveCreateGroup);

    var memberClose = document.getElementById('addMemberModalClose');
    var memberCancel = document.getElementById('addMemberCancel');
    var memberSave = document.getElementById('addMemberSave');
    if (memberClose) memberClose.addEventListener('click', closeAddMemberModal);
    if (memberCancel) memberCancel.addEventListener('click', closeAddMemberModal);
    if (memberSave) memberSave.addEventListener('click', saveAddMember);
}

function openCreateGroupModal() {
    var modal = document.getElementById('groupModal');
    var name = document.getElementById('groupNameInput');
    var subject = document.getElementById('groupSubjectSelect');
    if (!modal) return;
    if (name) name.value = '';
    if (subject && window.AccolyStats) {
        subject.innerHTML = AccolyStats.SUBJECT_CATALOG.map(function (c) {
            return '<option value="' + c.code + '">' + esc(c.code + ' — ' + c.label) + '</option>';
        }).join('');
    }
    modal.classList.add('open');
}

function closeCreateGroupModal() {
    var modal = document.getElementById('groupModal');
    if (modal) modal.classList.remove('open');
}

function saveCreateGroup() {
    var me = Storage.getCurrentUser();
    var name = (document.getElementById('groupNameInput').value || '').trim();
    var subject = document.getElementById('groupSubjectSelect').value || 'FAR';
    if (!name) return AccountifyUI.toast('Enter a group name', 'warning');
    SupabaseClient.saveGroup({
        name: name,
        subject: subject,
        createdBy: me.id,
        memberIds: [me.id]
    })
        .then(function (g) {
            if (!g) {
                AccountifyUI.toast('Could not create group', 'error');
                return;
            }
            closeCreateGroupModal();
            AccountifyUI.toast('Group created', 'success');
            return refreshGroups().then(function () {
                openGroup(g.id);
            });
        })
        .catch(function () {
            AccountifyUI.toast('Could not create group', 'error');
        });
}

function openAddMemberModal() {
    var modal = document.getElementById('addMemberModal');
    var picker = document.getElementById('addMemberPicker');
    if (!modal || !picker) return;
    var g = MSG.groups.find(function (x) {
        return x.id === MSG.activeGroupId;
    });
    var members = (g && g.memberIds) || [];
    var others = allUsersExceptMe().filter(function (u) {
        return members.indexOf(u.id) === -1;
    });
    picker.innerHTML = '<option value="">Select student to add...</option>';
    others.forEach(function (u) {
        var o = document.createElement('option');
        o.value = u.id;
        o.textContent = u.fullName;
        picker.appendChild(o);
    });
    modal.classList.add('open');
}

function closeAddMemberModal() {
    var modal = document.getElementById('addMemberModal');
    if (modal) modal.classList.remove('open');
}

function saveAddMember() {
    var picker = document.getElementById('addMemberPicker');
    var userId = picker && picker.value;
    if (!userId) return AccountifyUI.toast('Select a student', 'warning');
    if (!MSG.activeGroupId) return;
    SupabaseClient.addMemberToGroup(MSG.activeGroupId, userId)
        .then(function (ok) {
            if (!ok) {
                AccountifyUI.toast('Could not add member', 'error');
                return;
            }
            closeAddMemberModal();
            AccountifyUI.toast('Member added', 'success');
            SupabaseClient.addNotification({
                userId: userId,
                message: 'You were added to a study group'
            }).catch(function () {});
            return refreshGroups().then(function () {
                openGroup(MSG.activeGroupId);
            });
        })
        .catch(function () {
            AccountifyUI.toast('Could not add member', 'error');
        });
}

function displayName(userId) {
    var u = MSG_ALL_USERS.find(function (x) {
        return x.id === userId;
    });
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
