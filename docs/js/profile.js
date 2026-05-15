// ============================================
// PROFILE LOGIC
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    if (window.__authReady) {
        initProfile();
    } else {
        window.addEventListener('authReady', initProfile);
    }
});

function initProfile() {
    const user = Storage.getCurrentUser();
    if (!user) return; // auth.js already redirected

    loadProfile();
}

function esc(s) {
    var d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
}

function setProfileLoading(on) {
    var overlay = document.getElementById('profileLoadingOverlay');
    if (!overlay) return;
    overlay.hidden = !on;
    overlay.setAttribute('aria-busy', on ? 'true' : 'false');
}

function safeDate(ts) {
    if (!ts) return null;
    var d = new Date(ts);
    if (isNaN(d.getTime())) return null;
    return d;
}

function loadProfile() {
    const user = Storage.getCurrentUser();
    if (!user) return;

    var errEl = document.getElementById('profileFetchError');
    if (errEl) {
        errEl.hidden = true;
        errEl.textContent = '';
    }

    setProfileLoading(true);

    Promise.all([
        SupabaseClient.getUserStats(user.id),
        SupabaseClient.getQuizAttempts(user.id),
        SupabaseClient.getPosts(),
        SupabaseClient.getLibraryFiles(user.id),
        SupabaseClient.getFlashcards(user.id)
    ])
        .then(function (results) {
            const dbStats = results[0];
            const attempts = results[1];
            const posts = results[2];
            const libraryFiles = results[3] || [];
            const flashcards = results[4] || [];
            const derived = AccolyStats.buildUserStatsFromAttempts(attempts);
            const stats = AccolyStats.mergeStats(dbStats, derived);
            renderProfileHeader(user, stats, posts, libraryFiles, flashcards);
            renderLevelTiers(stats);
            renderAchievements(stats);
            renderSubjectRatingsFromAttempts(attempts);
            loadRecentQuizzesFromAttempts(attempts);
            renderStudyChartFromAttempts(attempts);
            renderStudyCalendarFromAttempts(attempts);
            if (window.AccolySubscription && AccolySubscription.applyPremiumLocks) {
                AccolySubscription.applyPremiumLocks();
            }
        })
        .catch(function (err) {
            console.error('Profile load error:', err);
            if (errEl) {
                errEl.textContent = 'Could not load profile data. Check your connection and refresh the page.';
                errEl.hidden = false;
            }
            if (window.AccountifyUI) {
                AccountifyUI.toast('Profile data failed to load', 'error');
            }
        })
        .finally(function () {
            setProfileLoading(false);
        });
}

function renderLevelTiers(stats) {
    var el = document.getElementById('profileLevelTiers');
    if (!el || !window.AccolyStats) return;
    var totalXP = stats.totalXP || 0;
    var currentLevel = stats.level || Storage.calculateLevel(totalXP);
    el.innerHTML = AccolyStats.LEVEL_TIERS.map(function (tier) {
        var unlocked = currentLevel >= tier.level;
        var cls = 'profile-level-tier' + (unlocked ? ' profile-level-tier--unlocked' : '');
        return (
            '<div class="' + cls + '">' +
            '<span class="profile-level-tier__emoji">' + tier.emoji + '</span>' +
            '<div><strong>Level ' + tier.level + ': ' + esc(tier.name) + '</strong>' +
            '<p style="margin:0.15rem 0 0;font-size:0.85rem;color:var(--text-secondary);">' +
            tier.xpRequired + '+ XP</p></div>' +
            '</div>'
        );
    }).join('');
}

function renderProfileHeader(user, stats, posts, libraryFiles, flashcards) {
    const initials = (user.fullName || 'U')
        .split(' ')
        .map(function (n) { return n[0]; })
        .join('')
        .toUpperCase()
        .slice(0, 2);

    var avatarEl = document.getElementById('profileAvatar');
    if (avatarEl) avatarEl.textContent = initials || 'U';

    var nameEl = document.getElementById('profileName');
    if (nameEl) nameEl.textContent = user.fullName || 'User';

    var streakBadge = document.getElementById('profileStreakBadge');
    if (streakBadge) streakBadge.textContent = '🔥 ' + (stats.currentStreak || 0) + 'd';

    var emailEl = document.getElementById('profileEmail');
    if (emailEl) emailEl.textContent = user.email || '';

    var planEl = document.getElementById('profilePlanBadge');
    if (planEl) {
        var isPremium = user.subscriptionStatus === 'premium';
        planEl.textContent = isPremium ? 'Premium' : 'Basic';
        planEl.classList.toggle('profile-pill--premium', isPremium);
    }

    var joinedEl = document.getElementById('profileJoinedDate');
    if (joinedEl) {
        var jd = safeDate(user.createdAt);
        joinedEl.textContent = jd ? 'Joined ' + jd.toLocaleDateString() : 'Member';
    }

    const levelName = Storage.getLevelName(stats.level);
    const levelEmojis = {
        1: '📚',
        2: '📊',
        3: '🔍',
        4: '✓',
        5: '👑'
    };

    var profileLevel = document.getElementById('profileLevel');
    if (profileLevel) profileLevel.textContent = 'Level: ' + levelName;

    var profileCurrentLevel = document.getElementById('profileCurrentLevel');
    if (profileCurrentLevel) profileCurrentLevel.textContent = levelName;

    var profileLevelEmoji = document.getElementById('profileLevelEmoji');
    if (profileLevelEmoji) profileLevelEmoji.textContent = levelEmojis[stats.level] || '📚';

    const currentXP = stats.totalXP || 0;
    const progress = AccolyStats.getLevelProgress(currentXP, stats.level);
    const xpInCurrentLevel = progress.xpInLevel;
    const xpNeededForLevel = progress.xpNeeded;
    const progressPercent = progress.percent;

    var profileProgressPercent = document.getElementById('profileProgressPercent');
    if (profileProgressPercent) profileProgressPercent.textContent = progressPercent + '%';

    var profileProgressBar = document.getElementById('profileProgressBar');
    if (profileProgressBar) profileProgressBar.style.width = progressPercent + '%';

    var profileXPProgress = document.getElementById('profileXPProgress');
    if (profileXPProgress) {
        profileXPProgress.textContent = xpInCurrentLevel + ' / ' + xpNeededForLevel + ' XP to next level';
    }

    var profileQuizzes = document.getElementById('profileQuizzes');
    if (profileQuizzes) profileQuizzes.textContent = String(stats.totalQuizzes != null ? stats.totalQuizzes : 0);

    var profileXP = document.getElementById('profileXP');
    if (profileXP) profileXP.textContent = String(stats.totalXP != null ? stats.totalXP : 0);

    var libraryEl = document.getElementById('profileLibraryCount');
    var flashEl = document.getElementById('profileFlashcardCount');
    if (libraryEl) libraryEl.textContent = String((libraryFiles || []).length);
    if (flashEl) flashEl.textContent = String((flashcards || []).length);

}

function renderAchievements(stats) {
    var el = document.getElementById('profileAchievements');
    if (!el) return;

    var tq = stats.totalQuizzes || 0;
    var streak = stats.currentStreak || 0;
    var acc = stats.accuracyPercentage || 0;
    var level = stats.level || 1;

    var defs = [
        {
            icon: '⭐',
            title: 'Quiz Master',
            desc: 'Complete 10 quizzes',
            unlocked: tq >= 10
        },
        {
            icon: '🔥',
            title: 'Week Warrior',
            desc: '7-day study streak',
            unlocked: streak >= 7
        },
        {
            icon: '🎯',
            title: 'Accuracy Ace',
            desc: '90%+ average accuracy',
            unlocked: acc >= 90 && tq >= 3
        },
        {
            icon: '👑',
            title: 'Rising CPA',
            desc: 'Reach level 4 or higher',
            unlocked: level >= 4
        }
    ];

    el.innerHTML = defs
        .map(function (d) {
            var cls = 'achievement' + (d.unlocked ? ' achievement--unlocked' : ' achievement--locked');
            return (
                '<article class="' + cls + '">' +
                '<div class="achievement-icon">' + d.icon + '</div>' +
                '<h4>' + esc(d.title) + '</h4>' +
                '<p>' + esc(d.desc) + '</p>' +
                '</article>'
            );
        })
        .join('');
}

function renderSubjectRatingsFromAttempts(attempts) {
    var el = document.getElementById('profileSubjectRatings');
    if (!el) return;
    var map = {};
    (attempts || []).forEach(function (a) {
                var s = window.AccolyStats
                    ? AccolyStats.getSubjectLabel(AccolyStats.normalizeSubjectCode(a.subject))
                    : a.subject || 'General';
        if (!map[s]) map[s] = { sum: 0, n: 0 };
        map[s].sum += typeof a.score === 'number' ? a.score : 0;
        map[s].n += 1;
    });
    var keys = Object.keys(map);
    if (!keys.length) {
        el.innerHTML = '<p class="profile-lead" style="margin:0;">Take quizzes to see subject ratings.</p>';
        return;
    }
    keys.sort();
    el.innerHTML =
        '<div class="profile-ratings-list">' +
        keys
            .map(function (s) {
                var avg = Math.round(map[s].sum / map[s].n);
                return (
                    '<div class="profile-ratings-row">' +
                    '<span>' +
                    esc(
                        window.AccolyStats
                            ? AccolyStats.getSubjectLabel(AccolyStats.normalizeSubjectCode(s))
                            : s
                    ) +
                    '</span>' +
                    '<strong>' + avg + '% avg</strong>' +
                    '</div>'
                );
            })
            .join('') +
        '</div>';
}

function calculateLikesReceived(userId, posts) {
    var total = 0;
    (posts || []).forEach(function (p) {
        if (p.userId !== userId) return;
        if (p.reactions && Array.isArray(p.reactions.like)) total += p.reactions.like.length;
        else if (p.reactions && typeof p.reactions.like === 'number') total += p.reactions.like;
        if (p.reactions && p.reactions.emojis) {
            Object.keys(p.reactions.emojis).forEach(function (k) {
                total += p.reactions.emojis[k] || 0;
            });
        }
    });
    return total;
}

function loadRecentQuizzesFromAttempts(attempts) {
    const recentContainer = document.getElementById('recentQuizzes');
    if (!recentContainer) return;

    if (!attempts || attempts.length === 0) {
        recentContainer.innerHTML = '<p class="profile-lead" style="margin:0;">No quiz attempts yet. Open Quiz Center to get started.</p>';
        return;
    }

    const recent = attempts.slice().slice(-10).reverse();

    recentContainer.innerHTML = recent
        .map(function (attempt) {
            var d = safeDate(attempt.timestamp);
            var dateStr = d
                ? d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '—';
            var diff = (attempt.difficulty || 'Unknown').replace('Super Hard', 'Elite');
            return (
                '<div class="quiz-item">' +
                '<div class="quiz-item-info">' +
                '<h4>' + esc(attempt.subject || 'Unknown') + '</h4>' +
                '<p class="quiz-item-date">' + esc(dateStr) + ' • ' + esc(diff) + '</p>' +
                '</div>' +
                '<div class="quiz-item-score">' +
                '<div class="quiz-item-score-value">' + (attempt.score || 0) + '%</div>' +
                '<div class="quiz-item-score-label">' + (attempt.xpEarned || 0) + ' XP</div>' +
                '</div>' +
                '</div>'
            );
        })
        .join('');
}

function logout() {
    if (window.SupabaseClient && SupabaseClient.signOut) {
        SupabaseClient.signOut().finally(function () {
            Storage.logout();
            window.location.href = 'login.html';
        });
    } else {
        Storage.logout();
        window.location.href = 'login.html';
    }
}

function renderStudyChartFromAttempts(attempts) {
    var list = (attempts || []).slice().reverse().slice(0, 8);
    var canvas = document.getElementById('studyChart');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var w = canvas.width;
    var h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, w, h);

    if (!list.length) {
        ctx.fillStyle = '#64748B';
        ctx.font = '14px sans-serif';
        ctx.fillText('No quiz data yet.', 20, 30);
        return;
    }

    var pad = 30;
    ctx.strokeStyle = '#CBD5E1';
    ctx.beginPath();
    ctx.moveTo(pad, h - pad);
    ctx.lineTo(w - pad, h - pad);
    ctx.moveTo(pad, pad);
    ctx.lineTo(pad, h - pad);
    ctx.stroke();

    var step = (w - pad * 2) / Math.max(1, list.length - 1);
    ctx.strokeStyle = '#1E3A8A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    list.forEach(function (a, i) {
        var score = typeof a.score === 'number' ? a.score : 0;
        var x = pad + i * step;
        var y = h - pad - (score / 100) * (h - pad * 2);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();
    list.forEach(function (a, i) {
        var score = typeof a.score === 'number' ? a.score : 0;
        var x = pad + i * step;
        var y = h - pad - (score / 100) * (h - pad * 2);
        ctx.fillStyle = '#3B82F6';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
}

function renderStudyCalendarFromAttempts(attempts) {
    var cal = document.getElementById('studyCalendar');
    if (!cal) return;
    var byDay = {};
    (attempts || []).forEach(function (a) {
        var d = safeDate(a.timestamp);
        if (!d) return;
        var key = d.toISOString().slice(0, 10);
        byDay[key] = (byDay[key] || 0) + 1;
    });
    var days = [];
    for (var i = 13; i >= 0; i--) {
        var d = new Date(Date.now() - i * 86400000);
        var key = d.toISOString().slice(0, 10);
        days.push({
            key: key,
            day: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            count: byDay[key] || 0
        });
    }
    cal.innerHTML = days
        .map(function (d) {
            var bg = d.count ? 'rgba(30,58,138,' + Math.min(0.2 + d.count * 0.2, 0.85) + ')' : 'var(--background)';
            var color = d.count ? '#fff' : 'var(--text-secondary)';
            return (
                '<span style="display:inline-flex;flex-direction:column;align-items:center;justify-content:center;min-width:68px;margin:0.2rem;padding:0.5rem 0.35rem;border-radius:10px;background:' +
                bg +
                ';color:' +
                color +
                ';text-align:center;font-size:0.78rem;border:1px solid var(--border);">' +
                d.day +
                '<strong style="margin-top:0.25rem;font-size:0.95rem;">' +
                d.count +
                '</strong></span>'
            );
        })
        .join('');
}
