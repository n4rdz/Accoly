// ============================================
// LEADERBOARD LOGIC
// ============================================

let currentFilter = 'all_time';

document.addEventListener('DOMContentLoaded', function() {
    const user = Storage.getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    loadLeaderboard();
});

function loadLeaderboard() {
    const allAttempts = filterAttemptsByPeriod(Storage.getQuizAttempts(), currentFilter);
    const users = JSON.parse(localStorage.getItem('users') || '[]');

    // Calculate leaderboard scores
    const leaderboardScores = {};
    
    users.forEach(user => {
        const userAttempts = allAttempts.filter(a => a.userId === user.id);
        
        if (userAttempts.length === 0) {
            return; // Skip users with no attempts
        }

        const stats = Storage.getUserStats(user.id);
        const avgAccuracy = stats.accuracyPercentage;
        const quizCount = userAttempts.length;
        const totalXP = stats.totalXP;
        const level = stats.level;
        
        // Calculate score
        const baseScore = totalXP / 10;
        const accuracyBonus = (avgAccuracy / 100) * 20;
        const completionBonus = Math.min(quizCount, 100);
        const totalScore = baseScore + accuracyBonus + completionBonus;

        leaderboardScores[user.id] = {
            userId: user.id,
            userName: user.fullName,
            totalPoints: Math.round(totalScore),
            accuracy: avgAccuracy,
            quizCount: quizCount,
            currentStreak: stats.currentStreak || 0,
            level: level,
            levelName: Storage.getLevelName(level),
            totalXP: totalXP
        };
    });

    // Sort by points
    const sorted = Object.values(leaderboardScores).sort((a, b) => b.totalPoints - a.totalPoints);
    
    // Add rank
    sorted.forEach((entry, index) => {
        entry.rank = index + 1;
    });

    // Display podium
    if (sorted.length >= 1) {
        const first = sorted[0];
        document.getElementById('first-name').textContent = first.userName;
        document.getElementById('first-score').textContent = first.totalPoints + ' Points';
    }

    if (sorted.length >= 2) {
        const second = sorted[1];
        document.getElementById('second-name').textContent = second.userName;
        document.getElementById('second-score').textContent = second.totalPoints + ' Points';
    }

    if (sorted.length >= 3) {
        const third = sorted[2];
        document.getElementById('third-name').textContent = third.userName;
        document.getElementById('third-score').textContent = third.totalPoints + ' Points';
    }

    // Display full table
    const tbody = document.getElementById('leaderboardBody');
    tbody.innerHTML = sorted.map((entry, index) => `
        <tr>
            <td class="rank-cell rank-${entry.rank}">#${entry.rank}</td>
            <td>
                <div class="student-name">
                    <div class="student-avatar">${entry.userName.split(' ').map(n => n[0]).join('').toUpperCase()}</div>
                    <div>
                        <div>${entry.userName}</div>
                        <small style="color: var(--text-secondary);">${entry.levelName}</small>
                    </div>
                </div>
            </td>
            <td><span class="points-value">${entry.totalPoints}</span></td>
            <td><span class="accuracy-value">${entry.accuracy}%</span></td>
            <td>${entry.quizCount}</td>
            <td><span class="streak-value">🔥 ${entry.currentStreak}</span></td>
            <td><span class="level-badge">${entry.levelName}</span></td>
        </tr>
    `).join('');

    // Find and display user's position
    const currentUser = Storage.getCurrentUser();
    const userPosition = sorted.find(entry => entry.userId === currentUser.id);

    if (userPosition) {
        document.getElementById('yourRank').textContent = `#${userPosition.rank}`;
        document.getElementById('yourName').textContent = currentUser.fullName;
        document.getElementById('yourPoints').textContent = userPosition.totalPoints + ' Points';
    }
}

function filterLeaderboard(period) {
    currentFilter = period;
    
    // Update button states
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (event && event.target) event.target.classList.add('active');

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
