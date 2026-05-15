// Leaderboard — all-time rankings from Supabase quiz_attempts
var currentSubjectFilter = 'All Subjects';
var currentDifficultyFilter = 'All Difficulties';

document.addEventListener('DOMContentLoaded', function () {
    if (window.__authReady) {
        initLeaderboard();
    } else {
        window.addEventListener('authReady', initLeaderboard);
    }
});

function initLeaderboard() {
    var user = Storage.getCurrentUser();
    if (!user) return;
    initSubjectFilter();
    initDifficultyFilter();
    loadLeaderboard();
}

function buildFilterButton(className, dataAttr, dataValue, label, isActive) {
    var active = isActive ? ' active' : '';
    return (
        '<button type="button" class="filter-btn' + active + '" ' + dataAttr + '="' +
        String(dataValue).replace(/"/g, '&quot;') +
        '" title="' +
        String(label).replace(/"/g, '&quot;') +
        '">' +
        label +
        '</button>'
    );
}

function initSubjectFilter() {
    var container = document.getElementById('subjectFilterButtons');
    if (!container || !window.AccolyStats) return;
    container.innerHTML = AccolyStats.QUIZ_SUBJECTS.map(function (code) {
        var label = code === 'All Subjects' ? code : AccolyStats.getSubjectLabel(code);
        return buildFilterButton('', 'data-subject', code, label, code === currentSubjectFilter);
    }).join('');
    container.querySelectorAll('[data-subject]').forEach(function (btn) {
        btn.title = AccolyStats.getSubjectLabel(btn.getAttribute('data-subject'));
        btn.addEventListener('click', function () {
            currentSubjectFilter = btn.getAttribute('data-subject') || 'All Subjects';
            container.querySelectorAll('[data-subject]').forEach(function (b) {
                b.classList.toggle('active', b === btn);
            });
            loadLeaderboard();
        });
    });
}

function initDifficultyFilter() {
    var container = document.getElementById('difficultyFilterButtons');
    if (!container || !window.AccolyStats) return;
    container.innerHTML = AccolyStats.QUIZ_DIFFICULTIES.map(function (diff) {
        return buildFilterButton(
            '',
            'data-difficulty',
            diff,
            diff,
            diff === currentDifficultyFilter
        );
    }).join('');
    container.querySelectorAll('[data-difficulty]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            currentDifficultyFilter = btn.getAttribute('data-difficulty') || 'All Difficulties';
            container.querySelectorAll('[data-difficulty]').forEach(function (b) {
                b.classList.toggle('active', b === btn);
            });
            loadLeaderboard();
        });
    });
}

function updateFilterLabel() {
    var filterLabel = document.getElementById('leaderboardFilterLabel');
    if (!filterLabel) return;
    var parts = ['All-time'];
    if (currentSubjectFilter !== 'All Subjects') {
        parts.push(AccolyStats.getSubjectLabel(currentSubjectFilter));
    } else {
        parts.push('all subjects');
    }
    if (currentDifficultyFilter !== 'All Difficulties') {
        parts.push(currentDifficultyFilter);
    }
    filterLabel.textContent = parts.join(' · ');
}

function loadLeaderboard() {
    updateFilterLabel();

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
                var entries = rows.map(function (r) {
                    var filtered = AccolyStats.filterAttempts(
                        r.attempts,
                        currentSubjectFilter,
                        currentDifficultyFilter
                    );
                    var derived = AccolyStats.buildUserStatsFromAttempts(filtered);
                    var stats = AccolyStats.mergeStats(r.stats, derived);
                    var totalPoints = AccolyStats.computeTotalPoints(filtered);
                    var accuracy = AccolyStats.aggregateAccuracy(filtered);

                    return {
                        userId: r.user.id,
                        userName: r.user.fullName,
                        totalPoints: totalPoints,
                        accuracy: accuracy,
                        quizCount: filtered.length,
                        currentStreak: stats.currentStreak || 0,
                        level: stats.level || 1,
                        levelName: Storage.getLevelName(stats.level || 1),
                        totalXP: stats.totalXP || 0
                    };
                });

                entries.sort(function (a, b) {
                    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
                    if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
                    return b.quizCount - a.quizCount;
                });
                entries.forEach(function (entry, index) {
                    entry.rank = index + 1;
                });
                renderLeaderboardTable(entries);
            });
        })
        .catch(function (err) {
            console.error('Leaderboard load error:', err);
            var tbody = document.getElementById('leaderboardBody');
            if (tbody) {
                tbody.innerHTML =
                    '<tr><td colspan="7">Could not load leaderboard.</td></tr>';
            }
        });
}

function renderLeaderboardTable(sorted) {
    var first = sorted[0];
    var second = sorted[1];
    var third = sorted[2];

    document.getElementById('first-name').textContent = first ? first.userName : '—';
    document.getElementById('first-score').textContent = first ? first.totalPoints + ' pts' : '—';
    document.getElementById('second-name').textContent = second ? second.userName : '—';
    document.getElementById('second-score').textContent = second ? second.totalPoints + ' pts' : '—';
    document.getElementById('third-name').textContent = third ? third.userName : '—';
    document.getElementById('third-score').textContent = third ? third.totalPoints + ' pts' : '—';

    var tbody = document.getElementById('leaderboardBody');
    if (!sorted.length) {
        tbody.innerHTML =
            '<tr><td colspan="7">No quiz scores for this filter. Complete a quiz to appear on the board.</td></tr>';
    } else {
        tbody.innerHTML = sorted
            .map(function (entry) {
                return (
                    '<tr>' +
                    '<td class="rank-cell rank-' + entry.rank + '">#' + entry.rank + '</td>' +
                    '<td>' +
                    '<div class="student-name">' +
                    '<div class="student-avatar">' +
                    entry.userName
                        .split(' ')
                        .map(function (n) {
                            return n[0];
                        })
                        .join('')
                        .toUpperCase() +
                    '</div>' +
                    '<div>' +
                    '<div>' +
                    entry.userName +
                    '</div>' +
                    '<small style="color: var(--text-secondary);">' +
                    entry.levelName +
                    '</small>' +
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
            })
            .join('');
    }

    var currentUser = Storage.getCurrentUser();
    var userPosition = sorted.find(function (entry) {
        return entry.userId === currentUser.id;
    });

    if (userPosition) {
        document.getElementById('yourRank').textContent = '#' + userPosition.rank;
        document.getElementById('yourName').textContent = currentUser.fullName;
        document.getElementById('yourPoints').textContent =
            userPosition.totalPoints + ' pts · ' + userPosition.accuracy + '% accuracy';
    } else {
        document.getElementById('yourRank').textContent = '—';
        document.getElementById('yourName').textContent = currentUser.fullName;
        document.getElementById('yourPoints').textContent =
            'No ranked activity for this filter yet';
    }
}

function logout() {
    SupabaseClient.signOut().finally(function () {
        Storage.logout();
        window.location.replace('login.html');
    });
}
