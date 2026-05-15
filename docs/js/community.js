// ============================================
// COMMUNITY MODULE — Supabase-backed
// ============================================

var communityState = { sort: 'newest', search: '', type: 'all', tag: '' };
var postModalState = { editingId: null };
var COMM_POSTS = []; // in-memory cache

function shapePostReactions(post) {
    if (!post || !post.reactions) post.reactions = {};
    ['like', 'love', 'laugh', 'helpful', 'dislike'].forEach(function (k) {
        if (!Array.isArray(post.reactions[k])) post.reactions[k] = [];
    });
}

document.addEventListener('DOMContentLoaded', function () {
    if (window.__authReady) {
        initCommunity();
    } else {
        window.addEventListener('authReady', initCommunity);
    }
});

function initCommunity() {
    var user = Storage.getCurrentUser();
    if (!user) return (window.location.href = 'login.html');

    // Bind all UI immediately — never block these on Supabase
    initComposer(user);
    bindFilters();
    bindPostModal();

    // Show loading state in feed
    var feed = document.getElementById('communityFeed');
    if (feed) feed.innerHTML = '<p style="color:var(--text-secondary);padding:1rem;">Loading posts...</p>';

    // Load posts from Supabase
    loadAndRender();

    // Auto-refresh every 30 seconds
    setInterval(loadAndRender, 30000);
}

// ── Load from Supabase then render ────────────────────────────────────────────
function loadAndRender() {
    SupabaseClient.getPosts().then(function (posts) {
        COMM_POSTS = (posts || []).map(function (p) {
            shapePostReactions(p);
            return p;
        });
        // Seed if totally empty
        if (!COMM_POSTS.length) {
            seedCommunity();
            return;
        }
        renderFeed();
        renderContributorLeaderboard();
    }).catch(function () {
        // Fall back to last known cache
        renderFeed();
        renderContributorLeaderboard();
    });
}

function initComposer(user) {
    var avatarEl = document.getElementById('composerAvatar');
    if (avatarEl) avatarEl.textContent = initials(user.fullName || 'User');
    var openBtn = document.getElementById('openPostModalBtn');
    if (openBtn) openBtn.addEventListener('click', function () { openPostModal(null); });
}

// ── Filters ───────────────────────────────────────────────────────────────────
function bindFilters() {
    document.getElementById('communitySearch').addEventListener('input', function (e) {
        communityState.search = (e.target.value || '').trim().toLowerCase();
        renderFeed();
    });
    document.getElementById('communitySort').addEventListener('change', function (e) {
        communityState.sort = e.target.value;
        renderFeed();
    });
    document.getElementById('communityTypeFilter').addEventListener('change', function (e) {
        communityState.type = e.target.value;
        renderFeed();
    });
    var tagEl = document.getElementById('communityTagFilter');
    if (tagEl) {
        tagEl.addEventListener('input', function (e) {
            communityState.tag = (e.target.value || '').trim().toLowerCase().replace(/^#/, '');
            renderFeed();
        });
    }
}

// ── Post modal ────────────────────────────────────────────────────────────────
function bindPostModal() {
    var modal = document.getElementById('postModal');
    var closeBtn = document.getElementById('postModalClose');
    var cancelBtn = document.getElementById('postModalCancelBtn');
    var saveBtn = document.getElementById('postModalSaveBtn');
    if (closeBtn) closeBtn.addEventListener('click', closePostModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closePostModal);
    if (modal) modal.addEventListener('click', function (e) { if (e.target === modal) closePostModal(); });
    if (saveBtn) saveBtn.addEventListener('click', saveFromPostModal);
}

function openPostModal(postId) {
    var modal = document.getElementById('postModal');
    var titleEl = document.getElementById('postModalTitle');
    var contentEl = document.getElementById('postModalContent');
    var typeEl = document.getElementById('postModalType');
    var tagsEl = document.getElementById('postModalTags');
    var saveBtn = document.getElementById('postModalSaveBtn');
    var anonRow = document.getElementById('postModalAnonymousRow');
    var anonChk = document.getElementById('postModalAnonymous');

    postModalState.editingId = postId || null;

    if (postId) {
        var me = Storage.getCurrentUser();
        var post = COMM_POSTS.find(function (p) { return p.id === postId; });
        if (!post || !me || post.userId !== me.id) return;
        titleEl.textContent = 'Edit Post';
        saveBtn.textContent = 'Save';
        contentEl.value = post.content || '';
        typeEl.value = post.type || 'Discussion';
        tagsEl.value = (post.tags || []).join(', ');
        if (anonRow) anonRow.style.display = 'none';
    } else {
        titleEl.textContent = 'Create Post';
        saveBtn.textContent = 'Post';
        contentEl.value = '';
        typeEl.value = 'Discussion';
        tagsEl.value = '';
        if (anonRow && anonChk) {
            anonChk.checked = false;
            var pr = window.AccolySubscription && AccolySubscription.isPremiumUser();
            anonRow.style.display = pr ? 'block' : 'none';
            if (!anonChk.dataset.bound) {
                anonChk.dataset.bound = '1';
                anonChk.addEventListener('change', function () {
                    if (anonChk.checked && !checkPremiumAccess('Anonymous posting')) {
                        anonChk.checked = false;
                    }
                });
            }
        }
    }

    modal.classList.add('open');
    contentEl.focus();
}

function closePostModal() {
    var modal = document.getElementById('postModal');
    if (modal) modal.classList.remove('open');
    postModalState.editingId = null;
}

function parseTags(input) {
    return (input || '').split(',')
        .map(function (t) { return (t || '').trim().replace(/^#/, '').trim(); })
        .filter(Boolean);
}

function saveFromPostModal() {
    var me = Storage.getCurrentUser();
    if (!me) { AccountifyUI.toast('Please login to post', 'error'); return; }

    var content = (document.getElementById('postModalContent').value || '').trim();
    var type = document.getElementById('postModalType').value;
    var tags = parseTags(document.getElementById('postModalTags').value);

    if (!validatePostContent(content)) {
        if (!content || content.length < 10) AccountifyUI.toast('Post content is required (min 10 characters)', 'warning');
        else if (content.length > 6000) AccountifyUI.toast('Post content too long (max 6000 characters)', 'warning');
        else AccountifyUI.toast('Invalid post content', 'warning');
        return;
    }
    if (!validateTags(tags)) {
        AccountifyUI.toast('Add 1–5 tags (letters, numbers, hyphens only, max 20 chars each)', 'warning');
        return;
    }

    var saveBtn = document.getElementById('postModalSaveBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';

    var premium = window.AccolySubscription && AccolySubscription.isPremiumUser();
    var anonEl = document.getElementById('postModalAnonymous');
    var wantAnon = !!(premium && anonEl && anonEl.checked);
    var displayName = wantAnon ? 'Anonymous' : (me.fullName || 'Student');

    var postData;
    if (postModalState.editingId) {
        var existing = COMM_POSTS.find(function (p) { return p.id === postModalState.editingId; });
        if (!existing || existing.userId !== me.id) {
            AccountifyUI.toast('Cannot edit this post', 'error');
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save';
            return;
        }
        postData = Object.assign({}, existing, { content: content, type: type, tags: tags, updatedAt: new Date().toISOString() });
    } else {
        postData = {
            userId: me.id,
            userName: displayName,
            content: content,
            type: type,
            tags: tags,
            isAnonymous: wantAnon,
            reactions: { like: [], love: [], laugh: [], helpful: [], dislike: [] },
            comments: []
        };
    }

    SupabaseClient.savePost(postData).then(function (saved) {
        if (!saved) { AccountifyUI.toast('Failed to save post', 'error'); return; }
        AccountifyUI.toast(postModalState.editingId ? 'Post updated' : 'Posted successfully', 'success');
        closePostModal();
        loadAndRender();
    }).catch(function () {
        AccountifyUI.toast('Failed to save post', 'error');
    }).finally(function () {
        saveBtn.disabled = false;
        saveBtn.textContent = postModalState.editingId ? 'Save' : 'Post';
    });
}

// ── Seed posts (only runs if Supabase posts table is empty) ───────────────────
function seedCommunity() {
    var seeds = [
        {
            userId: 'system', userName: 'Accoly Team', type: 'Problem',
            content: 'How do you approach deferred tax liability adjustments quickly?',
            tags: ['Taxation', 'exam-tip'],
            reactions: { like: [], love: [], laugh: [], helpful: [], dislike: [] },
            comments: [{ id: 'seed-c1', userId: 'system', userName: 'Accoly Team', content: 'Share your quick rules-of-thumb and common pitfalls.', createdAt: new Date(Date.now() - 55 * 60000).toISOString() }],
            createdAt: new Date(Date.now() - 75 * 60000).toISOString()
        },
        {
            userId: 'system', userName: 'Accoly Team', type: 'Casual',
            content: 'Saturday group study session starts at 8 PM. Drop your topics so we can prep.',
            tags: ['Auditing', 'study-group'],
            reactions: { like: [], love: [], laugh: [], helpful: [], dislike: [] },
            comments: [],
            createdAt: new Date(Date.now() - 3 * 3600000).toISOString()
        }
    ];

    Promise.all(seeds.map(function (s) { return SupabaseClient.savePost(s); })).then(loadAndRender).catch(loadAndRender);
}

// ── Reactions ─────────────────────────────────────────────────────────────────
function toggleReaction(postId, reactionKey) {
    var me = Storage.getCurrentUser();
    var post = COMM_POSTS.find(function (p) { return p.id === postId; });
    if (!me || !post) return;

    post.reactions = post.reactions || { like: [], love: [], laugh: [], helpful: [], dislike: [] };
    ['like', 'love', 'laugh', 'helpful', 'dislike'].forEach(function (k) {
        if (!Array.isArray(post.reactions[k])) post.reactions[k] = [];
    });

    var isProblem = (post.type === 'Problem');
    if (isProblem) {
        if (reactionKey !== 'like' && reactionKey !== 'dislike') return;
        var cur = myReactionProblem(post, me.id);
        if (cur === reactionKey) {
            post.reactions[reactionKey] = post.reactions[reactionKey].filter(function (id) { return id !== me.id; });
        } else {
            if (cur) post.reactions[cur] = post.reactions[cur].filter(function (id) { return id !== me.id; });
            post.reactions[reactionKey].push(me.id);
        }
    } else {
        if (reactionKey === 'helpful' || reactionKey === 'dislike') return;
        var current = myReaction(post, me.id);
        if (current === reactionKey) {
            post.reactions[reactionKey] = post.reactions[reactionKey].filter(function (id) { return id !== me.id; });
        } else {
            if (current) post.reactions[current] = post.reactions[current].filter(function (id) { return id !== me.id; });
            post.reactions[reactionKey].push(me.id);
        }
    }

    // Optimistic UI update
    renderFeed();
    renderContributorLeaderboard();

    // Persist only reactions column — works for any logged-in user
    SupabaseClient.updateReactions(post.id, post.reactions).then(function(saved) {
        if (!saved) {
            AccountifyUI.toast('Could not save reaction', 'error');
            loadAndRender();
        }
    }).catch(function () {
        AccountifyUI.toast('Could not save reaction', 'error');
        loadAndRender();
    });
}

// ── Comments ──────────────────────────────────────────────────────────────────
function addComment(postId, content) {
    var me = Storage.getCurrentUser();
    var post = COMM_POSTS.find(function (p) { return p.id === postId; });
    if (!me || !post) return;
    var text = (content || '').trim();
    if (!text) return;
    if (text.length < 1 || text.length > 1000) { AccountifyUI.toast('Comment must be 1–1000 characters', 'warning'); return; }

    post.comments = Array.isArray(post.comments) ? post.comments : [];
    post.comments.push({
        id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 8),
        userId: me.id,
        userName: me.fullName || 'Student',
        content: text,
        createdAt: new Date().toISOString()
    });

    // Optimistic UI
    renderFeed();
    renderContributorLeaderboard();

    // Persist only comments column — works for any logged-in user
    SupabaseClient.updateComments(post.id, post.comments).then(function(saved) {
        if (!saved) {
            AccountifyUI.toast('Could not save comment', 'error');
            loadAndRender();
        }
    }).catch(function () {
        AccountifyUI.toast('Could not save comment', 'error');
        loadAndRender();
    });
}

// ── Delete post ───────────────────────────────────────────────────────────────
function deletePost(postId) {
    var me = Storage.getCurrentUser();
    var post = COMM_POSTS.find(function (p) { return p.id === postId; });
    if (!me || !post || post.userId !== me.id) return;
    AccountifyUI.confirmDelete('Delete this post permanently?').then(function (ok) {
        if (!ok) return;
        SupabaseClient.deletePost(postId).then(function () {
            COMM_POSTS = COMM_POSTS.filter(function (p) { return p.id !== postId; });
            AccountifyUI.toast('Post deleted', 'success');
            renderFeed();
            renderContributorLeaderboard();
        }).catch(function () {
            AccountifyUI.toast('Failed to delete post', 'error');
        });
    });
}

// ── Filtering & sorting ───────────────────────────────────────────────────────
function getFilteredPosts() {
    var posts = COMM_POSTS.slice();

    posts = posts.filter(function (p) {
        if (communityState.type !== 'all' && p.type !== communityState.type) return false;
        if (communityState.tag) {
            var foundTag = (p.tags || []).some(function (t) {
                return (t || '').toLowerCase().indexOf(communityState.tag) !== -1;
            });
            if (!foundTag) return false;
        }
        if (communityState.search) {
            var hay = ((p.content || '') + ' ' + (p.userName || '') + ' ' + (p.tags || []).join(' ')).toLowerCase();
            if (hay.indexOf(communityState.search) === -1) return false;
        }
        return true;
    });

    posts.sort(function (a, b) {
        if (communityState.sort === 'mostReactions') return countReactions(b) - countReactions(a);
        if (communityState.sort === 'mostComments') return (b.comments || []).length - (a.comments || []).length;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return posts;
}

// ── Contributor scores (posts + helpful recognition + own comments) ─────────
function getContributorMap() {
    var scores = {};
    COMM_POSTS.forEach(function (p) {
        if (!p.userId || p.userId === 'system') return;
        if (!scores[p.userId]) scores[p.userId] = { userId: p.userId, name: p.userName || 'Student', posts: 0, comments: 0, helpfulRec: 0, total: 0 };
        scores[p.userId].posts += 1;
        if (p.type === 'Problem') {
            scores[p.userId].helpfulRec += (p.reactions && p.reactions.like ? p.reactions.like.length : 0);
        } else {
            scores[p.userId].helpfulRec += (p.reactions && p.reactions.helpful ? p.reactions.helpful.length : 0);
        }
        scores[p.userId].comments += (p.comments || []).filter(function (c) { return c.userId === p.userId; }).length;
        scores[p.userId].name = p.userName || scores[p.userId].name;
    });
    Object.keys(scores).forEach(function (uid) {
        var s = scores[uid];
        s.total = s.posts * 3 + s.helpfulRec * 2 + s.comments;
    });
    return scores;
}

// ── Render feed ───────────────────────────────────────────────────────────────
function renderFeed() {
    var feed = document.getElementById('communityFeed');
    var posts = getFilteredPosts();
    var me = Storage.getCurrentUser();

    if (!posts.length) {
        feed.innerHTML = '<div class="empty-state"><h3>No matching posts</h3><p>Try a different filter or be the first to post!</p></div>';
        return;
    }

    var contribMap = getContributorMap();

    feed.innerHTML = posts.map(function (p) {
        var tags = (p.tags || []).map(function (t) {
            return '<button type="button" class="tag-pill" data-tag="' + escAttr(t) + '">#' + esc(t) + '</button>';
        }).join('');

        var mine = me && p.userId === me.id;
        var actionHtml = mine
            ? '<div class="post-actions">' +
              '<button type="button" class="btn btn-outline post-edit-btn" data-id="' + escAttr(p.id) + '" style="padding:0.35rem 0.6rem;">Edit</button>' +
              '<button type="button" class="btn btn-outline post-del-btn" data-id="' + escAttr(p.id) + '" style="padding:0.35rem 0.6rem;">Delete</button>' +
              '</div>'
            : '';

        var mineReaction = null;
        if (me) {
            mineReaction = (p.type === 'Problem') ? myReactionProblem(p, me.id) : myReaction(p, me.id);
        }

        function rxBtn(key, label) {
            var active = mineReaction === key ? ' reaction-btn--active' : '';
            var count = (p.reactions && p.reactions[key] ? p.reactions[key].length : 0);
            return '<button type="button" class="reaction-btn' + active + '" data-id="' + escAttr(p.id) + '" data-rx="' + escAttr(key) + '">' +
                label + ' <span class="reaction-count">' + count + '</span></button>';
        }

        var reactionHtml = (p.type === 'Problem')
            ? (rxBtn('like', '👍 Helpful') + rxBtn('dislike', '👎 Dislike'))
            : (rxBtn('like', '👍 Like') + rxBtn('love', '❤️ Love') + rxBtn('laugh', '😂 Haha'));

        var showAnon = !!(p.isAnonymous || p.userName === 'Anonymous');
        var authName = showAnon ? 'Anonymous' : (p.userName || 'Student');
        var authInitials = showAnon ? '?' : initials(p.userName || 'Student');
        var pts = (p.userId && contribMap[p.userId]) ? contribMap[p.userId].total : 0;
        var topBadge = (p.userId && p.userId !== 'system' && pts >= 100)
            ? ' <span style="font-size:0.72rem;font-weight:700;color:var(--primary);margin-left:0.35rem;">Top Contributor</span>'
            : '';

        var comments = Array.isArray(p.comments) ? p.comments : [];
        var commentList = comments.length === 0
            ? '<div class="comment-empty">No comments yet. Be the first!</div>'
            : comments.map(function (c) {
                var isOwnComment = me && c.userId === me.id;
                return '<div class="comment-row">' +
                    '<div class="comment-author">' + esc(c.userName || 'Student') +
                    (isOwnComment ? ' <span style="font-size:0.75rem;color:var(--text-secondary);">(you)</span>' : '') +
                    '</div>' +
                    '<div class="comment-body">' + esc(c.content || '') + '</div>' +
                    '<div style="font-size:0.75rem;color:var(--text-secondary);">' + timeAgo(c.createdAt) + '</div>' +
                    '</div>';
            }).join('');

        var moreComments = comments.length > 5
            ? '<div class="comment-more">Showing all ' + comments.length + ' comments</div>'
            : '';

        return '<article class="card community-post" data-post="' + escAttr(p.id) + '">' +
            '<div class="post-head">' +
            '<div class="post-avatar">' + esc(authInitials) + '</div>' +
            '<div class="post-meta">' +
            '<div class="post-meta__top"><span class="post-author">' + esc(authName) + '</span>' + topBadge +
            '<span class="post-type">' + esc(p.type || 'Discussion') + '</span></div>' +
            '<div class="post-time">' + timeAgo(p.createdAt) + '</div>' +
            '</div>' +
            '</div>' +
            '<div class="post-content">' + esc(p.content || '') + '</div>' +
            '<div class="post-tags">' + tags + '</div>' +
            '<div class="post-reactions">' +
            reactionHtml +
            '</div>' +
            actionHtml +
            '<div class="post-comments">' +
            '<div class="comment-list">' + commentList + '</div>' +
            moreComments +
            '<form class="comment-form" data-id="' + escAttr(p.id) + '">' +
            '<input class="comment-input" name="comment" placeholder="Write a comment…" autocomplete="off" maxlength="1000" />' +
            '<button class="btn btn-primary comment-submit" type="submit">Post</button>' +
            '</form>' +
            '</div>' +
            '</article>';
    }).join('');

    // Tag chips → quick filter
    feed.querySelectorAll('.tag-pill').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var t = (btn.dataset.tag || '').trim();
            var tagEl = document.getElementById('communityTagFilter');
            if (tagEl) tagEl.value = '#' + t;
            communityState.tag = t.toLowerCase();
            renderFeed();
        });
    });

    // Reaction buttons
    feed.querySelectorAll('.reaction-btn').forEach(function (btn) {
        btn.addEventListener('click', function () { toggleReaction(btn.dataset.id, btn.dataset.rx); });
    });

    // Comment forms
    feed.querySelectorAll('.comment-form').forEach(function (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var input = form.querySelector('input[name="comment"]');
            addComment(form.dataset.id, input.value);
            input.value = '';
        });
    });

    // Edit / delete buttons
    feed.querySelectorAll('.post-edit-btn').forEach(function (btn) {
        btn.addEventListener('click', function () { openPostModal(btn.dataset.id); });
    });
    feed.querySelectorAll('.post-del-btn').forEach(function (btn) {
        btn.addEventListener('click', function () { deletePost(btn.dataset.id); });
    });
}

// ── Contributor leaderboard ───────────────────────────────────────────────────
function renderContributorLeaderboard() {
    var listEl = document.getElementById('communityContribList');
    if (!listEl) return;

    var scores = getContributorMap();
    var sorted = Object.values(scores).sort(function (a, b) { return b.total - a.total; }).slice(0, 5);

    if (!sorted.length) {
        listEl.innerHTML = '<p style="color:var(--text-secondary);margin:0;">No contributors yet. Create the first post!</p>';
        return;
    }

    var medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
    listEl.innerHTML = sorted.map(function (s, idx) {
        var badge = s.total >= 100 ? ' <span style="font-size:0.75rem;color:var(--primary);font-weight:700;">Top Contributor</span>' : '';
        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:0.6rem 0;border-bottom:1px solid var(--border);">' +
            '<div><strong>' + medals[idx] + ' ' + esc(s.name) + '</strong>' + badge +
            '<div style="font-size:0.85rem;color:var(--text-secondary);">Posts: ' + s.posts + ' • Helpful recognition: ' + s.helpfulRec + ' • Own comments: ' + s.comments + '</div></div>' +
            '<div style="font-weight:800;color:var(--primary);">' + s.total + ' pts</div>' +
            '</div>';
    }).join('');
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function countReactions(post) {
    if (!post || !post.reactions) return 0;
    return ['like', 'love', 'laugh', 'dislike'].reduce(function (sum, k) {
        return sum + (Array.isArray(post.reactions[k]) ? post.reactions[k].length : 0);
    }, 0);
}

function myReactionProblem(post, userId) {
    if (!post || !post.reactions) return null;
    var keys = ['like', 'dislike'];
    for (var i = 0; i < keys.length; i++) {
        if (Array.isArray(post.reactions[keys[i]]) && post.reactions[keys[i]].indexOf(userId) !== -1) return keys[i];
    }
    return null;
}

function myReaction(post, userId) {
    if (!post || !post.reactions) return null;
    var keys = ['like', 'love', 'laugh'];
    for (var i = 0; i < keys.length; i++) {
        if (Array.isArray(post.reactions[keys[i]]) && post.reactions[keys[i]].indexOf(userId) !== -1) return keys[i];
    }
    return null;
}

function timeAgo(dateStr) {
    if (!dateStr) return '';
    var diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
    return new Date(dateStr).toLocaleDateString();
}

function initials(name) {
    var parts = (name || '').trim().split(/\s+/).filter(Boolean);
    var a = (parts[0] || 'U').slice(0, 1).toUpperCase();
    var b = parts.length > 1 ? parts[parts.length - 1].slice(0, 1).toUpperCase() : '';
    return (a + b) || 'U';
}

function esc(s) {
    var d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
}

function escAttr(s) {
    return (s || '').toString()
        .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function validatePostContent(content) {
    if (!content || typeof content !== 'string') return false;
    if (content.length < 10 || content.length > 6000) return false;
    if (/<script|javascript:|on\w+=/i.test(content)) return false;
    return true;
}

function validateTags(tags) {
    if (!Array.isArray(tags) || tags.length === 0 || tags.length > 5) return false;
    return tags.every(function (tag) {
        return tag && typeof tag === 'string' && tag.length <= 20 && /^[a-zA-Z0-9\s\-]+$/.test(tag);
    });
}

function logout() {
    SupabaseClient.signOut().finally(function () {
        Storage.logout();
        window.location.replace('login.html');
    });
}
