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

// HTML escaping utility
function esc(s) {
    var d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
}

function loadProfile() {
    const user = Storage.getCurrentUser();
    if (!user) return;
    
    const stats = Storage.getUserStats(user.id);

    // Set user info with proper escaping
    const initials = user.fullName.split(' ').map(n => n[0]).join('').toUpperCase();
    var avatarEl = document.getElementById('profileAvatar');
    if (avatarEl) avatarEl.textContent = initials;
    
    var nameEl = document.getElementById('profileName');
    if (nameEl) nameEl.textContent = esc(user.fullName || 'User');
    
    var emailEl = document.getElementById('profileEmail');
    if (emailEl) emailEl.textContent = esc(user.email || '');
    
    var planEl = document.getElementById('profilePlanBadge');
    if (planEl) {
        var isPremium = user.subscriptionStatus === 'premium';
        planEl.textContent = isPremium ? 'Premium' : 'Basic';
        planEl.style.color = isPremium ? 'var(--primary)' : 'var(--text-secondary)';
        planEl.style.fontWeight = '700';
    }
    var joinedEl = document.getElementById('profileJoinedDate');
    if (joinedEl) joinedEl.textContent = 'Joined ' + new Date(user.createdAt || Date.now()).toLocaleDateString();

    // Calculate level and progress
    const levelName = Storage.getLevelName(stats.level);
    const levelEmojis = {
        1: '📚',
        2: '📊',
        3: '🔍',
        4: '✓',
        5: '👑'
    };

    document.getElementById('profileLevel').textContent = `Level: ${levelName}`;
    document.getElementById('profileCurrentLevel').textContent = levelName;
    document.getElementById('profileLevelEmoji').textContent = levelEmojis[stats.level] || '📚';

    // Calculate progress to next level
    const levelThresholds = {
        1: 500,
        2: 1500,
        3: 3500,
        4: 7000,
        5: 10000
    };

    const currentThreshold = levelThresholds[stats.level] || 0;
    const nextThreshold = levelThresholds[stats.level + 1] || 10000;
    const currentXP = stats.totalXP;
    const xpInCurrentLevel = currentXP - currentThreshold;
    const xpNeededForLevel = nextThreshold - currentThreshold;
    const progressPercent = Math.min(100, Math.round((xpInCurrentLevel / xpNeededForLevel) * 100));

    document.getElementById('profileProgressPercent').textContent = progressPercent + '%';
    document.getElementById('profileProgressBar').style.width = progressPercent + '%';
    document.getElementById('profileXPProgress').textContent = `${xpInCurrentLevel} / ${xpNeededForLevel} XP`;

    // Update stats
    document.getElementById('profileAccuracy').textContent = stats.accuracyPercentage + '%';
    document.getElementById('profileQuizzes').textContent = stats.totalQuizzes;
    document.getElementById('profileXP').textContent = stats.totalXP;
    document.getElementById('profileStreak').textContent = (stats.currentStreak || 0) + 'd';

    var notesCount = Storage.getNotes(user.id).length;
    var notepadCount = Storage.getNotepadEntries(user.id).length;
    var notesEl = document.getElementById('profileNotesCount');
    var padEl = document.getElementById('profileNotepadCount');
    if (notesEl) notesEl.textContent = String(notesCount);
    if (padEl) padEl.textContent = String(notepadCount);

    var likesEl = document.getElementById('profileLikesReceived');
    if (likesEl) likesEl.textContent = String(calculateLikesReceived(user.id));

    // Load recent quizzes
    loadRecentQuizzes(user.id);
    renderStudyChart(user.id);
    renderStudyCalendar(user.id);
}

function calculateLikesReceived(userId) {
    var posts = Storage.getPosts ? Storage.getPosts() : [];
    var total = 0;
    posts.forEach(function (p) {
        if (p.userId !== userId) return;
        if (p.reactions && typeof p.reactions.like === 'number') total += p.reactions.like;
        if (p.reactions && p.reactions.emojis) {
            Object.keys(p.reactions.emojis).forEach(function (k) {
                total += p.reactions.emojis[k] || 0;
            });
        }
    });
    return total;
}

function loadRecentQuizzes(userId) {
    const attempts = Storage.getQuizAttempts(userId);
    const recentContainer = document.getElementById('recentQuizzes');
    if (!recentContainer) return;

    if (attempts.length === 0) {
        recentContainer.innerHTML = '<p style="color: var(--text-secondary);">No quiz attempts yet. Start taking quizzes to see your history!</p>';
        return;
    }

    const recent = attempts.slice(-10).reverse();
    
    recentContainer.innerHTML = recent.map(attempt => {
        const date = new Date(attempt.timestamp);
        const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        return `
            <div class="quiz-item">
                <div class="quiz-item-info">
                    <h4>${esc(attempt.subject || 'Unknown')}</h4>
                    <p class="quiz-item-date">${dateStr} • ${esc(attempt.difficulty || 'Unknown')}</p>
                </div>
                <div class="quiz-item-score">
                    <div class="quiz-item-score-value">${(attempt.score || 0)}%</div>
                    <div class="quiz-item-score-label">${(attempt.xpEarned || 0)} XP</div>
                </div>
            </div>
        `;
    }).join('');
}

function logout() {
    Storage.logout();
    window.location.href = 'login.html';
}

function renderStudyChart(userId) {
    var attempts = Storage.getQuizAttempts(userId).slice().reverse().slice(0, 8);
    var canvas = document.getElementById('studyChart');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var w = canvas.width;
    var h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    if (!attempts.length) {
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

    var step = (w - pad * 2) / Math.max(1, attempts.length - 1);
    ctx.strokeStyle = '#1E3A8A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    attempts.forEach(function (a, i) {
        var x = pad + i * step;
        var y = h - pad - (a.score / 100) * (h - pad * 2);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        ctx.fillStyle = '#3B82F6';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.stroke();
}

function renderStudyCalendar(userId) {
    var cal = document.getElementById('studyCalendar');
    if (!cal) return;
    var attempts = Storage.getQuizAttempts(userId);
    var byDay = {};
    attempts.forEach(function (a) {
        var key = new Date(a.timestamp).toISOString().slice(0, 10);
        byDay[key] = (byDay[key] || 0) + 1;
    });
    var days = [];
    for (var i = 13; i >= 0; i--) {
        var d = new Date(Date.now() - i * 86400000);
        var key = d.toISOString().slice(0, 10);
        days.push({ key: key, day: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), count: byDay[key] || 0 });
    }
    cal.innerHTML = days
        .map(function (d) {
            var bg = d.count ? 'rgba(30,58,138,' + Math.min(0.2 + d.count * 0.2, 0.85) + ')' : 'var(--surface)';
            var color = d.count ? '#fff' : 'var(--text-secondary)';
            return '<span style="display:inline-block;min-width:72px;margin:0.25rem;padding:0.5rem;border-radius:8px;background:' + bg + ';color:' + color + ';text-align:center;font-size:0.8rem;">' + d.day + '<br><strong>' + d.count + '</strong></span>';
        })
        .join('');
}