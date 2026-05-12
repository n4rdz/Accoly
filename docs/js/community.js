// ============================================
// COMMUNITY MODULE (FB group-style)
// ============================================

var communityState = { sort: 'newest', search: '', type: 'all', tag: '' };
var postModalState = { editingId: null };

document.addEventListener('DOMContentLoaded', function () {
    var user = Storage.getCurrentUser();
    if (!user) return (window.location.href = 'login.html');

    seedCommunity();
    initComposer(user);
    bindFilters();
    bindPostModal();
    renderFeed();
    renderContributorLeaderboard();
});

function initComposer(user) {
    var avatarEl = document.getElementById('composerAvatar');
    if (avatarEl) avatarEl.textContent = initials(user.fullName || user.name || 'User');
    var openBtn = document.getElementById('openPostModalBtn');
    if (openBtn) openBtn.addEventListener('click', function () { openPostModal(null); });
}

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

function bindPostModal() {
    var modal = document.getElementById('postModal');
    var closeBtn = document.getElementById('postModalClose');
    var cancelBtn = document.getElementById('postModalCancelBtn');
    var saveBtn = document.getElementById('postModalSaveBtn');

    if (closeBtn) closeBtn.addEventListener('click', closePostModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closePostModal);
    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target && e.target.id === 'postModal') closePostModal();
        });
    }
    if (saveBtn) saveBtn.addEventListener('click', saveFromPostModal);
}

function openPostModal(postId) {
    var modal = document.getElementById('postModal');
    var titleEl = document.getElementById('postModalTitle');
    var contentEl = document.getElementById('postModalContent');
    var typeEl = document.getElementById('postModalType');
    var tagsEl = document.getElementById('postModalTags');
    var saveBtn = document.getElementById('postModalSaveBtn');

    postModalState.editingId = postId || null;

    if (postId) {
        var me = Storage.getCurrentUser();
        var post = Storage.getPosts().find(function (p) { return p.id === postId; });
        if (!post || !me || post.userId !== me.id) return;
        titleEl.textContent = 'Edit Post';
        saveBtn.textContent = 'Save';
        contentEl.value = post.content || '';
        typeEl.value = post.type || 'Discussion';
        tagsEl.value = (post.tags || []).join(', ');
    } else {
        titleEl.textContent = 'Create Post';
        saveBtn.textContent = 'Post';
        contentEl.value = '';
        typeEl.value = 'Discussion';
        tagsEl.value = '';
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
    return (input || '')
        .split(',')
        .map(function (t) { return (t || '').trim(); })
        .filter(Boolean)
        .map(function (t) { return t.replace(/^#/, '').trim(); })
        .filter(Boolean);
}

function saveFromPostModal() {
    var me = Storage.getCurrentUser();
    if (!me) {
        AccountifyUI.toast('Please login to post', 'error');
        return;
    }

    var content = (document.getElementById('postModalContent').value || '').trim();
    var type = document.getElementById('postModalType').value;
    var tags = parseTags(document.getElementById('postModalTags').value);

    // Validate inputs
    if (!validatePostContent(content)) {
        if (!content) {
            AccountifyUI.toast('Post content is required (min 10 characters)', 'warning');
        } else if (content.length > 6000) {
            AccountifyUI.toast('Post content too long (max 6000 characters)', 'warning');
        } else {
            AccountifyUI.toast('Invalid post content', 'warning');
        }
        return;
    }

    if (!validateTags(tags)) {
        if (!tags.length) {
            AccountifyUI.toast('At least 1 tag is required (max 5 tags)', 'warning');
        } else {
            AccountifyUI.toast('Invalid tags (max 20 characters each, alphanumeric only)', 'warning');
        }
        return;
    }

    try {
        if (postModalState.editingId) {
            var existing = Storage.getPosts().find(function (p) { return p.id === postModalState.editingId; });
            if (!existing || existing.userId !== me.id) {
                AccountifyUI.toast('Cannot edit this post', 'error');
                return;
            }
            existing.content = content;
            existing.type = type;
            existing.tags = tags;
            existing.updatedAt = new Date().toISOString();
            Storage.savePost(existing);
            AccountifyUI.toast('Post updated', 'success');
        } else {
            Storage.savePost({
                userId: me.id,
                userName: me.fullName || me.name || 'Student',
                content: content,
                type: type,
                tags: tags,
                reactions: { like: [], love: [], laugh: [], helpful: [] },
                comments: []
            });
            Storage.addNotification({ userId: me.id, message: 'Your community post is now live.' });
            if (window.AccountifyNav) window.AccountifyNav.refreshNotifications();
            AccountifyUI.toast('Posted successfully', 'success');
        }

        closePostModal();
        renderFeed();
        renderContributorLeaderboard();
    } catch (error) {
        console.error('Error saving post:', error);
        AccountifyUI.toast('Failed to save post', 'error');
    }
}

function seedCommunity() {
    if ((Storage.getPosts() || []).length > 0) return;
    Storage.savePost({
        userId: 'system',
        userName: 'Accoly Team',
        type: 'Problem',
        content: 'How do you approach deferred tax liability adjustments quickly?',
        tags: ['Taxation', 'exam-tip'],
        comments: [
            {
                userId: 'system',
                userName: 'Accoly Team',
                content: 'Share your quick rules-of-thumb and common pitfalls.',
                createdAt: new Date(Date.now() - 55 * 60000).toISOString()
            }
        ],
        createdAt: new Date(Date.now() - 75 * 60000).toISOString()
    });
    Storage.savePost({
        userId: 'system',
        userName: 'Accoly Team',
        type: 'Casual',
        content: 'Saturday group study session starts at 8 PM. Drop your topics so we can prep.',
        tags: ['Auditing', 'study-group'],
        createdAt: new Date(Date.now() - 3 * 3600000).toISOString()
    });
}

function displayName(post) {
    if (!post) return 'Student';
    if (post.userId === 'system') return 'Accoly Team';
    return post.userName || 'Student';
}

function countReactions(post) {
    if (!post || !post.reactions) return 0;
    return (
        (post.reactions.like || []).length +
        (post.reactions.love || []).length +
        (post.reactions.laugh || []).length +
        (post.reactions.helpful || []).length
    );
}

function myReaction(post, userId) {
    if (!post || !post.reactions) return null;
    var keys = ['like', 'love', 'laugh', 'helpful'];
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (Array.isArray(post.reactions[k]) && post.reactions[k].indexOf(userId) !== -1) return k;
    }
    return null;
}

function toggleReaction(postId, reactionKey) {
    var me = Storage.getCurrentUser();
    var post = Storage.getPosts().find(function (p) { return p.id === postId; });
    if (!me || !post) return;

    post.reactions = post.reactions || { like: [], love: [], laugh: [], helpful: [] };
    ['like', 'love', 'laugh', 'helpful'].forEach(function (k) {
        if (!Array.isArray(post.reactions[k])) post.reactions[k] = [];
    });

    var current = myReaction(post, me.id);
    if (current === reactionKey) {
        post.reactions[reactionKey] = post.reactions[reactionKey].filter(function (id) { return id !== me.id; });
    } else {
        if (current) {
            post.reactions[current] = post.reactions[current].filter(function (id) { return id !== me.id; });
        }
        post.reactions[reactionKey].push(me.id);
    }

    post.updatedAt = new Date().toISOString();
    Storage.savePost(post);
    renderFeed();
    renderContributorLeaderboard();
}

function addComment(postId, content) {
    var me = Storage.getCurrentUser();
    var post = Storage.getPosts().find(function (p) { return p.id === postId; });
    if (!me || !post) return;
    var text = (content || '').trim();
    if (!text) return;

    post.comments = Array.isArray(post.comments) ? post.comments : [];
    post.comments.push({
        id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 8),
        userId: me.id,
        userName: me.fullName || me.name || 'Student',
        content: text,
        createdAt: new Date().toISOString()
    });
    post.updatedAt = new Date().toISOString();
    Storage.savePost(post);
    renderFeed();
    renderContributorLeaderboard();
}

function deletePost(postId) {
    var me = Storage.getCurrentUser();
    var post = Storage.getPosts().find(function (p) { return p.id === postId; });
    if (!me || !post || post.userId !== me.id) return;
    AccountifyUI.confirmDelete('Delete this post permanently?').then(function (ok) {
        if (!ok) return;
        Storage.deletePost(postId);
        AccountifyUI.toast('Post deleted', 'success');
        renderFeed();
        renderContributorLeaderboard();
    });
}

function getFilteredPosts() {
    var posts = Storage.getPosts().slice();
    posts = posts.filter(function (p) {
        var okType = communityState.type === 'all' || p.type === communityState.type;
        if (!okType) return false;

        if (communityState.tag) {
            var foundTag = (p.tags || []).some(function (t) {
                return (t || '').toLowerCase().indexOf(communityState.tag) !== -1;
            });
            if (!foundTag) return false;
        }

        if (!communityState.search) return true;
        var hay = ((p.content || '') + ' ' + (p.tags || []).join(' ')).toLowerCase();
        return hay.indexOf(communityState.search) !== -1;
    });

    posts.sort(function (a, b) {
        if (communityState.sort === 'mostReactions') return countReactions(b) - countReactions(a);
        if (communityState.sort === 'mostComments') return (b.comments || []).length - (a.comments || []).length;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
    return posts;
}

function renderFeed() {
    var feed = document.getElementById('communityFeed');
    var posts = getFilteredPosts();
    var me = Storage.getCurrentUser();

    if (!posts.length) {
        feed.innerHTML = '<div class="empty-state"><h3>No matching posts</h3><p>Try a different filter or create a new post.</p></div>';
        return;
    }

    feed.innerHTML = posts
        .map(function (p) {
            var tags = (p.tags || [])
                .map(function (t) {
                    return '<button type="button" class="tag-pill" data-tag="' + escAttr(t) + '">#' + esc(t) + '</button>';
                })
                .join('');

            var mine = me && p.userId === me.id;
            var actionHtml = mine
                ? '<div class="post-actions">' +
                  '<button type="button" class="btn btn-outline post-edit-btn" data-id="' + escAttr(p.id) + '" style="padding:0.35rem 0.6rem;">Edit</button>' +
                  '<button type="button" class="btn btn-outline post-del-btn" data-id="' + escAttr(p.id) + '" style="padding:0.35rem 0.6rem;">Delete</button>' +
                  '</div>'
                : '';

            var mineReaction = me ? myReaction(p, me.id) : null;
            function rxBtn(key, label) {
                var active = mineReaction === key ? ' reaction-btn--active' : '';
                var count = (p.reactions && p.reactions[key] ? p.reactions[key].length : 0);
                return (
                    '<button type="button" class="reaction-btn' +
                    active +
                    '" data-id="' +
                    escAttr(p.id) +
                    '" data-rx="' +
                    escAttr(key) +
                    '">' +
                    label +
                    ' <span class="reaction-count">' +
                    esc(count) +
                    '</span></button>'
                );
            }

            var comments = Array.isArray(p.comments) ? p.comments : [];
            var commentList =
                comments.length === 0
                    ? '<div class="comment-empty">No comments yet.</div>'
                    : comments
                          .slice(-3)
                          .map(function (c) {
                              return (
                                  '<div class="comment-row">' +
                                  '<div class="comment-author">' +
                                  esc(c.userName || 'Student') +
                                  '</div>' +
                                  '<div class="comment-body">' +
                                  esc(c.content || '') +
                                  '</div>' +
                                  '</div>'
                              );
                          })
                          .join('');

            var moreComments = comments.length > 3 ? '<div class="comment-more">Showing latest 3 of ' + comments.length + ' comments.</div>' : '';

            return (
                '<article class="card community-post" data-post="' +
                escAttr(p.id) +
                '">' +
                '<div class="post-head">' +
                '<div class="post-avatar">' +
                esc(initials(displayName(p))) +
                '</div>' +
                '<div class="post-meta">' +
                '<div class="post-meta__top"><span class="post-author">' +
                esc(displayName(p)) +
                '</span><span class="post-type">' +
                esc(p.type || 'Discussion') +
                '</span></div>' +
                '<div class="post-time">' +
                esc(new Date(p.createdAt).toLocaleString()) +
                '</div>' +
                '</div>' +
                '</div>' +
                '<div class="post-content">' +
                esc(p.content || '') +
                '</div>' +
                '<div class="post-tags">' +
                tags +
                '</div>' +
                '<div class="post-reactions">' +
                rxBtn('like', '👍 Like') +
                rxBtn('love', '❤️ Love') +
                rxBtn('laugh', '😂 Haha') +
                rxBtn('helpful', '💡 Helpful') +
                '</div>' +
                actionHtml +
                '<div class="post-comments">' +
                '<div class="comment-list">' +
                commentList +
                '</div>' +
                moreComments +
                '<form class="comment-form" data-id="' +
                escAttr(p.id) +
                '">' +
                '<input class="comment-input" name="comment" placeholder="Write a comment…" autocomplete="off" />' +
                '<button class="btn btn-primary comment-submit" type="submit">Post</button>' +
                '</form>' +
                '</div>' +
                '</article>'
            );
        })
        .join('');

    // Tag chips -> quick filter
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
        btn.addEventListener('click', function () {
            toggleReaction(btn.dataset.id, btn.dataset.rx);
        });
    });

    // Comment submit
    feed.querySelectorAll('.comment-form').forEach(function (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var input = form.querySelector('input[name="comment"]');
            addComment(form.dataset.id, input.value);
            input.value = '';
        });
    });

    // Owner actions
    feed.querySelectorAll('.post-edit-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            openPostModal(btn.dataset.id);
        });
    });
    feed.querySelectorAll('.post-del-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            deletePost(btn.dataset.id);
        });
    });
}

function renderContributorLeaderboard() {
    var listEl = document.getElementById('communityContribList');
    if (!listEl) return;
    var posts = Storage.getPosts();

    var scores = {};
    posts.forEach(function (p) {
        if (!p.userId || p.userId === 'system') return;
        if (!scores[p.userId]) scores[p.userId] = { userId: p.userId, name: p.userName || 'Student', posts: 0, helpful: 0, total: 0 };
        scores[p.userId].posts += 1;
        scores[p.userId].helpful += (p.reactions && p.reactions.helpful ? p.reactions.helpful.length : 0);
        scores[p.userId].name = scores[p.userId].name || p.userName || 'Student';
    });

    var sorted = Object.values(scores)
        .map(function (s) {
            s.total = s.posts * 3 + s.helpful * 2;
            return s;
        })
        .sort(function (a, b) { return b.total - a.total; })
        .slice(0, 5);

    if (!sorted.length) {
        listEl.innerHTML = '<p style="color:var(--text-secondary);margin:0;">No contributors yet. Create the first post!</p>';
        return;
    }

    listEl.innerHTML = sorted
        .map(function (s, idx) {
            return (
                '<div style="display:flex;justify-content:space-between;align-items:center;padding:0.6rem 0;border-bottom:1px solid var(--border);">' +
                '<div><strong>#' +
                (idx + 1) +
                ' ' +
                esc(s.name) +
                '</strong><div style="font-size:0.85rem;color:var(--text-secondary);">Posts: ' +
                s.posts +
                ' • Helpful: ' +
                s.helpful +
                '</div></div>' +
                '<div style="font-weight:800;color:var(--primary);">' +
                s.total +
                '</div>' +
                '</div>'
            );
        })
        .join('');
}

function initials(name) {
    var s = (name || '').trim();
    if (!s) return 'U';
    var parts = s.split(/\s+/).filter(Boolean);
    var a = (parts[0] || 'U').slice(0, 1).toUpperCase();
    var b = parts.length > 1 ? (parts[parts.length - 1] || '').slice(0, 1).toUpperCase() : '';
    return (a + b) || 'U';
}

function esc(s) {
    var d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
}

// Additional security function for attribute values
function escAttr(s) {
    return (s || '').toString()
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// Validate post content
function validatePostContent(content) {
    if (!content || typeof content !== 'string') return false;
    if (content.length > 6000) return false;
    if (content.length < 10) return false;
    // Check for script tags and other dangerous content
    if (/<script|javascript:|on\w+=/i.test(content)) return false;
    return true;
}

// Validate tags
function validateTags(tags) {
    if (!Array.isArray(tags)) return false;
    if (tags.length === 0 || tags.length > 5) return false;
    return tags.every(tag => tag && typeof tag === 'string' && tag.length <= 20 && /^[a-zA-Z0-9\s\-]+$/.test(tag));
}

function logout() {
    Storage.logout();
    window.location.href = 'login.html';
}
