// ============================================
// SESSION CACHE + PURE UTILITIES (no app data in localStorage)
// All persistence goes through SupabaseClient.
// ============================================

var _currentUser = null;

const Storage = {
    getCurrentUser: function () {
        return _currentUser ? Object.assign({}, _currentUser) : null;
    },

    setCurrentUser: function (user) {
        _currentUser = user ? Object.assign({}, user) : null;
    },

    logout: function () {
        _currentUser = null;
    },

    calculateXP: function (quizAttempt) {
        var baseXP = 0;
        if (quizAttempt.difficulty === 'Easy') baseXP = 50;
        if (quizAttempt.difficulty === 'Medium' || quizAttempt.difficulty === 'Intermediate') baseXP = 100;
        if (quizAttempt.difficulty === 'Hard') baseXP = 200;
        if (quizAttempt.difficulty === 'Elite' || quizAttempt.difficulty === 'Super Hard') baseXP = 300;

        var accuracy = (quizAttempt.correctAnswers / quizAttempt.totalQuestions) * 100;
        if (accuracy === 100) baseXP += 150;
        else if (accuracy >= 90) baseXP += 75;
        else if (accuracy >= 80) baseXP += 25;
        else if (accuracy < 70) return 0;

        return Math.round(baseXP);
    },

    calculateLevel: function (totalXP) {
        if (totalXP < 500) return 1;
        if (totalXP < 1500) return 2;
        if (totalXP < 3500) return 3;
        if (totalXP < 7000) return 4;
        return 5;
    },

    getLevelName: function (level) {
        var names = {
            1: 'Beginner Accountant',
            2: 'Junior Analyst',
            3: 'Senior Reviewer',
            4: 'Audit Specialist',
            5: 'CPA Elite'
        };
        return names[level] || 'Student';
    },

    normalizePost: function (post) {
        var p = post && typeof post === 'object' ? post : {};
        p.id = p.id || Date.now().toString() + '-' + Math.random().toString(36).slice(2, 8);
        p.createdAt = p.createdAt || new Date().toISOString();
        p.updatedAt = p.updatedAt || p.createdAt;
        p.content = p.content || '';
        p.type = p.type || 'Discussion';
        p.tags = Array.isArray(p.tags) ? p.tags.filter(Boolean) : [];

        var rx = p.reactions || {};
        var v2 = { like: [], love: [], laugh: [], helpful: [], dislike: [] };
        ['like', 'love', 'laugh', 'helpful', 'dislike'].forEach(function (k) {
            if (Array.isArray(rx[k])) v2[k] = rx[k].filter(Boolean);
        });
        if (typeof rx.like === 'number') {
            for (var i = 0; i < rx.like; i++) v2.like.push('legacy-like-' + i);
        }
        if (typeof rx.dislike === 'number') {
            for (var j = 0; j < rx.dislike; j++) v2.dislike.push('legacy-dislike-' + j);
        }
        if (rx.emojis && typeof rx.emojis === 'object') {
            Object.keys(rx.emojis).forEach(function (emoji) {
                var count = rx.emojis[emoji] || 0;
                var bucket = 'like';
                if (emoji === '💡') bucket = 'helpful';
                else if (emoji === '🔥' || emoji === '👏') bucket = 'love';
                else if (emoji === '🤝') bucket = 'like';
                else bucket = 'laugh';
                for (var k = 0; k < count; k++) v2[bucket].push('legacy-emoji-' + emoji + '-' + k);
            });
        }
        p.reactions = v2;
        p.isAnonymous = !!(p.isAnonymous || p.anonymous);

        if (!Array.isArray(p.comments)) p.comments = [];
        p.comments = p.comments
            .filter(function (c) { return c && typeof c === 'object'; })
            .map(function (c) {
                return {
                    id: c.id || Date.now().toString() + '-' + Math.random().toString(36).slice(2, 8),
                    userId: c.userId || '',
                    userName: c.userName || c.user || c.name || 'Student',
                    content: (c.content || '').toString(),
                    createdAt: c.createdAt || new Date().toISOString()
                };
            });

        if (!p.userName) p.userName = 'Student';
        return p;
    },

    canUpload: function (user) {
        if (!user) return false;
        if (user.allowStandardsUpload === true) return true;
        return false;
    }
};

function canUpload(user) {
    return Storage.canUpload(user);
}

// ── Flash daily progress (in-memory cache, synced to Supabase) ──────────────
var _flashDaily = {};

function _flashKey(userId, subject, dateKey) {
    return userId + ':' + subject + ':' + dateKey;
}

Storage.getFlashDailyProgress = function (userId, subject, dateKey) {
    var key = _flashKey(userId, subject, dateKey);
    if (!_flashDaily[key]) {
        _flashDaily[key] = { reviewed: 0, correct: 0, incorrect: 0 };
        // Async load from Supabase in background
        if (window.SupabaseClient && SupabaseClient.getFlashDailyProgress) {
            SupabaseClient.getFlashDailyProgress(userId, subject, dateKey).then(function (data) {
                if (data) _flashDaily[key] = data;
            }).catch(function () {});
        }
    }
    return Object.assign({}, _flashDaily[key]);
};

Storage.recordFlashReview = function (userId, subject, dateKey, correct) {
    var key = _flashKey(userId, subject, dateKey);
    if (!_flashDaily[key]) _flashDaily[key] = { reviewed: 0, correct: 0, incorrect: 0 };
    _flashDaily[key].reviewed += 1;
    if (correct) {
        _flashDaily[key].correct += 1;
    } else {
        _flashDaily[key].incorrect += 1;
    }
    // Persist to Supabase in background
    if (window.SupabaseClient && SupabaseClient.saveFlashDailyProgress) {
        SupabaseClient.saveFlashDailyProgress(userId, subject, dateKey, _flashDaily[key]).catch(function () {});
    }
};

Storage.resetFlashDaily = function (userId, subject, dateKey) {
    var key = _flashKey(userId, subject, dateKey);
    _flashDaily[key] = { reviewed: 0, correct: 0, incorrect: 0 };
    if (window.SupabaseClient && SupabaseClient.saveFlashDailyProgress) {
        SupabaseClient.saveFlashDailyProgress(userId, subject, dateKey, _flashDaily[key]).catch(function () {});
    }
};