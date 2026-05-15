// ============================================
// LEADERBOARD LOGIC
// ============================================

let currentFilter = 'all_time';

document.addEventListener('DOMContentLoaded', function() {
    if (window.__authReady) {
        initLeaderboard();
    } else {
        window.addEventListener('authReady', initLeaderboard);
    }
});

function initLeaderboard() {
    const user = Storage.getCurrentUser();
    if (!user) return; // auth.js already redirected

    loadLeaderboard();
}

function loadLeaderboard() {
    SupabaseClient.getAllUsers()
        .then(function (users) {
            if (!users || !users.length) {
                renderLeaderboardTable([]);
                return;
            }
            return Promise.all(
                users.map(function (u) {
                    return Promise.all([
                        SupabaseClient.getQuizAttempts(u.id),
                        SupabaseClient.getUserStats(u.id)
                    ]).then(function (pair) {
                        return { user: u, attempts: pair[0], stats: pair[1] };
                    });
                })
            ).then(function (rows) {
                var allAttempts = [];
                rows.forEach(function (r) {
                    (r.attempts || []).forEach(function (a) {
                        allAttempts.push(a);
                    });
                });
                var filtered = filterAttemptsByPeriod(allAttempts, currentFilter);
                var leaderboardScores = {};

                rows.forEach(function (r) {
                    var userAttempts = filtered.filter(function (a) {
                        return a.userId === r.user.id;
                    });
                    if (userAttempts.length === 0) return;

                    var stats = r.stats;
                    var avgAccuracy = stats.accuracyPercentage;
                    var quizCount = userAttempts.length;
                    var totalXP = stats.totalXP;
                    var level = stats.level;

                    var baseScore = totalXP / 10;
                    var accuracyBonus = (avgAccuracy / 100) * 20;
                    var completionBonus = Math.min(quizCount, 100);
                    var totalScore = baseScore + accuracyBonus + completionBonus;

                    leaderboardScores[r.user.id] = {
                        userId: r.user.id,
                        userName: r.user.fullName,
                        totalPoints: Math.round(totalScore),
                        accuracy: avgAccuracy,
                        quizCount: quizCount,
                        currentStreak: stats.currentStreak || 0,
                        level: level,
                        levelName: Storage.getLevelName(level),
                        totalXP: totalXP
                    };
                });

                var sorted = Object.values(leaderboardScores).sort(function (a, b) {
                    return b.totalPoints - a.totalPoints;
                });
                sorted.forEach(function (entry, index) {
                    entry.rank = index + 1;
                });
                renderLeaderboardTable(sorted);
            });
        })
        .catch(function (err) {
            console.error('Leaderboard load error:', err);
            var tbody = document.getElementById('leaderboardBody');
            if (tbody) tbody.innerHTML = '<tr><td colspan="7">Could not load leaderboard.</td></tr>';
        });
}

function renderLeaderboardTable(sorted) {
    if (sorted.length >= 1) {
        const first = sorted[0];
        document.getElementById('first-name').textContent = first.userName;
        document.getElementById('first-score').textContent = first.totalPoints + ' Points';
    } else {
        document.getElementById('first-name').textContent = '—';
        document.getElementById('first-score').textContent = '—';
    }

    if (sorted.length >= 2) {
        const second = sorted[1];
        document.getElementById('second-name').textContent = second.userName;
        document.getElementById('second-score').textContent = second.totalPoints + ' Points';
    } else {
        document.getElementById('second-name').textContent = '—';
        document.getElementById('second-score').textContent = '—';
    }

    if (sorted.length >= 3) {
        const third = sorted[2];
        document.getElementById('third-name').textContent = third.userName;
        document.getElementById('third-score').textContent = third.totalPoints + ' Points';
    } else {
        document.getElementById('third-name').textContent = '—';
        document.getElementById('third-score').textContent = '—';
    }

    const tbody = document.getElementById('leaderboardBody');
    tbody.innerHTML = sorted.map(function (entry) {
        return (
            '<tr>' +
            '<td class="rank-cell rank-' + entry.rank + '">#' + entry.rank + '</td>' +
            '<td>' +
            '<div class="student-name">' +
            '<div class="student-avatar">' +
            entry.userName.split(' ').map(function (n) { return n[0]; }).join('').toUpperCase() +
            '</div>' +
            '<div>' +
            '<div>' + entry.userName + '</div>' +
            '<small style="color: var(--text-secondary);">' + entry.levelName + '</small>' +
            '</div>' +
            '</div>' +
            '</td>' +
            '<td><span class="points-value">' + entry.totalPoints + '</span></td>' +
            '<td><span class="accuracy-value">' + entry.accuracy + '%</span></td>' +
            '<td>' + entry.quizCount + '</td>' +
            '<td><span class="streak-value">🔥 ' + entry.currentStreak + '</span></td>' +
            '<td><span class="level-badge">' + entry.levelName + '</span></td>' +
            '</tr>'
        );
    }).join('');

    const currentUser = Storage.getCurrentUser();
    const userPosition = sorted.find(function (entry) { return entry.userId === currentUser.id; });

    if (userPosition) {
        document.getElementById('yourRank').textContent = '#' + userPosition.rank;
        document.getElementById('yourName').textContent = currentUser.fullName;
        document.getElementById('yourPoints').textContent = userPosition.totalPoints + ' Points';
    } else {
        document.getElementById('yourRank').textContent = '—';
        document.getElementById('yourName').textContent = currentUser.fullName;
        document.getElementById('yourPoints').textContent = 'No ranked activity yet';
    }
}

function filterLeaderboard(period) {
    currentFilter = period;

    // Update button states
    document.querySelectorAll('.filter-btn').forEach(function (btn) {
        btn.classList.remove('active');
    });
    var ev = window.event;
    if (ev && ev.target) ev.target.classList.add('active');

    // Reload with filter
    loadLeaderboard();
}

function filterAttemptsByPeriod(attempts, period) {
    if (period === 'all_time') return attempts;
    var now = Date.now();
    var windowMs = 24 * 3600 * 1000;
    if (period === 'weekly') windowMs = 7 * 24 * 3600 * 1000;
    if (period === 'monthly') windowMs = 30 * 24 * 3600 * 1000;
    return attempts.filter(function (a) {
        return now - new Date(a.timestamp).getTime() <= windowMs;
    });
}

function logout() {
    Storage.logout();
    window.location.href = 'login.html';
}
