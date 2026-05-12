// ============================================
// DASHBOARD LOGIC
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const user = Storage.getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize dashboard
    initDashboard();
});

function initDashboard() {
    const user = Storage.getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    const stats = Storage.getUserStats(user.id);

    // Header user chip (nav-header also fills; keep in sync)
    const initials = user.fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase();
    const navAv = document.getElementById('navUserAvatar');
    const navNm = document.getElementById('navUserName');
    if (navAv) navAv.textContent = initials;
    if (navNm) navNm.textContent = user.fullName;

    // Welcome message
    const hour = new Date().getHours();
    let greeting = 'Good Morning';
    if (hour >= 12 && hour < 18) greeting = 'Good Afternoon';
    if (hour >= 18) greeting = 'Good Evening';
    
    const welcomeEl = document.getElementById('welcomeMessage');
    const streakEl = document.getElementById('streakMessage');
    if (welcomeEl) welcomeEl.textContent = `${greeting}, ${user.fullName.split(' ')[0]}!`;
    if (streakEl) streakEl.textContent = `You have a ${stats.currentStreak || 0} day study streak. Keep it up! 🔥`;

    // Update stats with proper validation
    const levelName = Storage.getLevelName(stats.level);
    const progressEl = document.getElementById('overallProgress');
    const quizzesEl = document.getElementById('quizzesCompleted');
    const hoursEl = document.getElementById('studyHours');
    const levelEl = document.getElementById('currentLevel');
    
    if (progressEl) progressEl.textContent = `${stats.accuracyPercentage || 0}%`;
    if (quizzesEl) quizzesEl.textContent = stats.totalQuizzes || 0;
    if (hoursEl) {
        // Calculate actual study time from quiz attempts (assuming 10 minutes per quiz)
        const studyMinutes = (stats.totalQuizzes || 0) * 10;
        const studyHours = Math.floor(studyMinutes / 60);
        const studyMins = studyMinutes % 60;
        hoursEl.textContent = studyHours > 0 ? `${studyHours}h ${studyMins}m` : `${studyMins}m`;
    }
    if (levelEl) levelEl.textContent = levelName;

    // Count user content safely
    try {
        const notesCount = Storage.getNotes(user.id).length;
        const notepadCount = Storage.getNotepadEntries(user.id).length;
        const notesEl = document.getElementById('dashNotesCount');
        const padEl = document.getElementById('dashNotepadCount');
        if (notesEl) notesEl.textContent = String(notesCount);
        if (padEl) padEl.textContent = String(notepadCount);
    } catch (error) {
        console.error('Error counting user content:', error);
    }

    // Load recent activity
    loadRecentActivity(user.id);
}

function loadRecentActivity(userId) {
    const recentList = document.getElementById('recentActivityList');
    if (!recentList) return;
    
    let attempts = [];
    try {
        attempts = Storage.getQuizAttempts(userId);
    } catch (error) {
        console.error('Error loading quiz attempts:', error);
        recentList.innerHTML = '<p style="color: var(--text-secondary);">Error loading activity.</p>';
        return;
    }
    
    if (!attempts || attempts.length === 0) {
        recentList.innerHTML = '<p style="color: var(--text-secondary);">No recent activity. Start by taking a quiz!</p>';
        return;
    }

    // Get 5 most recent and sort by timestamp
    const recent = attempts
        .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
        .slice(0, 5);
    
    recentList.innerHTML = recent.map(attempt => {
        const score = attempt.score || 0;
        const subject = attempt.subject || 'Unknown';
        const date = attempt.timestamp ? new Date(attempt.timestamp).toLocaleDateString() : 'Unknown date';
        
        return `
            <div class="activity-item">
                <div class="activity-text">
                    <h4>Completed ${subject} Quiz</h4>
                    <p class="activity-time">${date}</p>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">${score}%</div>
                </div>
            </div>
        `;
    }).join('');
}

function logout() {
    Storage.logout();
    window.location.href = 'login.html';
}
