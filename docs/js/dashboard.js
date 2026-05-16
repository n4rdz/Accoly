// ============================================
// DASHBOARD LOGIC
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    if (window.__authReady) {
        initDashboard();
    } else {
        window.addEventListener('authReady', function () {
            initDashboard();
        });
    }

    // Add search functionality
    var searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            var query = searchInput.value.trim().toLowerCase();
            if (!query) {
                loadRecentActivityFromAttempts([]);
                return;
            }
            var user = Storage.getCurrentUser();
            if (!user) return;
            SupabaseClient.getQuizAttempts(user.id).then(function (attempts) {
                var filtered = attempts.filter(function (a) {
                    var subject = window.AccolyStats ? AccolyStats.getSubjectLabel(a.subject) : a.subject;
                    return subject.toLowerCase().indexOf(query) !== -1;
                });
                loadRecentActivityFromAttempts(filtered);
            }).catch(function () {
                loadRecentActivityFromAttempts([]);
            });
        });
    }
});

function initDashboard() {
    var user = Storage.getCurrentUser();
    if (!user) return;

    Promise.all([
        SupabaseClient.getUserStats(user.id),
        SupabaseClient.getQuizAttempts(user.id),
        SupabaseClient.getFlashcards(user.id),
        SupabaseClient.getNotepadEntries(user.id)
    ])
        .then(function (results) {
            var dbStats = results[0];
            var attempts = results[1] || [];
            var flashcards = results[2] || [];
            var notepadEntries = results[3] || [];
            var derived = AccolyStats.buildUserStatsFromAttempts(attempts);
            var stats = AccolyStats.mergeStats(dbStats, derived);
            renderDashboardMain(user, stats, attempts, flashcards.length, notepadEntries.length);
            loadRecentActivityFromAttempts(attempts);
            renderSubjectBreakdown(attempts);
        })
        .catch(function (err) {
            console.error('Dashboard load error:', err);
        });
}

function renderDashboardMain(user, stats, attempts, flashcardCount, notepadCount) {
    var initials = user.fullName
        .split(' ')
        .map(function (n) {
            return n[0];
        })
        .join('')
        .toUpperCase();
    var navAv = document.getElementById('navUserAvatar');
    var navNm = document.getElementById('navUserName');
    if (navAv) navAv.textContent = initials;
    if (navNm) navNm.textContent = user.fullName;

    var hour = new Date().getHours();
    var greeting = 'Good Morning';
    if (hour >= 12 && hour < 18) greeting = 'Good Afternoon';
    if (hour >= 18) greeting = 'Good Evening';

    var welcomeEl = document.getElementById('welcomeMessage');
    var streakEl = document.getElementById('streakMessage');
    if (welcomeEl) welcomeEl.textContent = greeting + ', ' + user.fullName.split(' ')[0] + '!';
    if (streakEl) {
        streakEl.textContent =
            'You have a ' + (stats.currentStreak || 0) + ' day study streak. Keep it up! 🔥';
    }

    var levelName = Storage.getLevelName(stats.level);
    var progressEl = document.getElementById('overallProgress');
    var quizzesEl = document.getElementById('quizzesCompleted');
    var hoursEl = document.getElementById('studyHours');
    var levelEl = document.getElementById('currentLevel');
    var xpEl = document.getElementById('dashTotalXP');
    var flashEl = document.getElementById('dashFlashcardCount');

    if (progressEl) progressEl.textContent = (stats.accuracyPercentage || 0) + '%';
    if (quizzesEl) quizzesEl.textContent = String(stats.totalQuizzes || 0);
    if (hoursEl) {
        var studySeconds = (attempts || []).reduce(function (sum, a) {
            return sum + (a.timeTaken || 0);
        }, 0);
        if (!studySeconds && stats.totalQuizzes) {
            studySeconds = stats.totalQuizzes * 600;
        }
        var studyHours = Math.floor(studySeconds / 3600);
        var studyMins = Math.floor((studySeconds % 3600) / 60);
        hoursEl.textContent =
            studyHours > 0 ? studyHours + 'h ' + studyMins + 'm' : studyMins + 'm';
    }
    if (levelEl) levelEl.textContent = levelName;
    if (xpEl) xpEl.textContent = String(stats.totalXP || 0);
    if (flashEl) flashEl.textContent = String(flashcardCount || 0);

    var padEl = document.getElementById('dashNotepadCount');
    if (padEl) padEl.textContent = String(notepadCount || 0);
}

function renderSubjectBreakdown(attempts) {
    var host = document.getElementById('dashSubjectBreakdown');
    if (!host) return;
    var map = {};
    (attempts || []).forEach(function (a) {
        var s = AccolyStats.normalizeSubjectCode(a.subject) || 'FAR';
        if (!map[s]) map[s] = { pts: 0, n: 0 };
        map[s].pts += a.xpEarned || 0;
        map[s].n += 1;
    });
    var keys = Object.keys(map);
    if (!keys.length) {
        host.innerHTML =
            '<p style="color:var(--text-secondary);margin:0;">Complete quizzes to see subject analytics.</p>';
        return;
    }
    host.innerHTML = keys
        .sort(function (a, b) {
            return map[b].pts - map[a].pts;
        })
        .map(function (s) {
            var row = map[s];
            var label = AccolyStats.getSubjectLabel(s);
            return (
                '<div class="activity-item" style="margin-bottom:0.5rem;">' +
                '<div class="activity-text"><h4>' +
                label +
                '</h4><p class="activity-time">' +
                row.n +
                ' quiz' +
                (row.n === 1 ? '' : 'zes') +
                '</p></div>' +
                '<div style="text-align:right;">' +
                '<div style="font-weight:700;color:var(--primary);">' +
                row.pts +
                ' pts</div>' +
                '</div>' +
                '</div>'
            );
        })
        .join('');
}

function loadRecentActivityFromAttempts(attempts) {
    var recentList = document.getElementById('recentActivityList');
    if (!recentList) return;

    if (!attempts || attempts.length === 0) {
        recentList.innerHTML =
            '<p style="color: var(--text-secondary);">No recent activity. Start by taking a quiz!</p>';
        return;
    }

    var recent = attempts
        .slice()
        .sort(function (a, b) {
            return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
        })
        .slice(0, 5);

    recentList.innerHTML = recent
        .map(function (attempt) {
            var score = attempt.score || 0;
            var subject = window.AccolyStats
                ? AccolyStats.getSubjectShortLabel(attempt.subject)
                : (attempt.subject || 'Unknown');
            var pts = attempt.xpEarned || 0;
            var date = attempt.timestamp
                ? new Date(attempt.timestamp).toLocaleDateString()
                : 'Unknown date';
            return (
                '<div class="activity-item">' +
                '<div class="activity-text">' +
                '<h4>Completed ' +
                subject +
                ' Quiz</h4>' +
                '<p class="activity-time">' +
                date +
                ' · ' +
                pts +
                ' pts</p>' +
                '</div>' +
                '<div style="text-align: right;">' +
                '<div style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">' +
                score +
                '%</div>' +
                '</div>' +
                '</div>'
            );
        })
        .join('');
}

function logout() {
    Storage.logout();
    window.location.href = 'login.html';
}
