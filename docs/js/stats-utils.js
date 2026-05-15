// Shared quiz stats: points, accuracy (score + time), levels, streaks
(function () {
    var QUIZ_SUBJECTS = [
        'All Subjects',
        'Financial Accounting',
        'Cost Accounting',
        'Auditing',
        'Taxation',
        'Business Law',
        'Economics',
        'MAS'
    ];

    var LEVEL_TIERS = [
        { level: 1, name: 'Beginner Accountant', xpRequired: 0, emoji: '📚' },
        { level: 2, name: 'Junior Analyst', xpRequired: 500, emoji: '📊' },
        { level: 3, name: 'Senior Reviewer', xpRequired: 1500, emoji: '🔍' },
        { level: 4, name: 'Audit Specialist', xpRequired: 3500, emoji: '✓' },
        { level: 5, name: 'CPA Elite', xpRequired: 7000, emoji: '👑' }
    ];

    function computeAttemptAccuracy(attempt) {
        var score = typeof attempt.score === 'number' ? attempt.score : 0;
        var totalQ = attempt.totalQuestions || 10;
        var timeTaken = attempt.timeTaken || 0;
        var expectedTime = Math.max(totalQ * 45, 45);
        var timeFactor = 1;
        if (timeTaken > 0) {
            var ratio = expectedTime / timeTaken;
            timeFactor = Math.min(1.15, Math.max(0.85, 0.85 + ratio * 0.15));
        }
        return Math.min(100, Math.round(score * timeFactor));
    }

    function filterAttemptsBySubject(attempts, subjectFilter) {
        if (!subjectFilter || subjectFilter === 'All Subjects') return attempts || [];
        return (attempts || []).filter(function (a) {
            return (a.subject || '') === subjectFilter;
        });
    }

    function computeTotalPoints(attempts) {
        return (attempts || []).reduce(function (sum, a) {
            return sum + (a.xpEarned || 0);
        }, 0);
    }

    function aggregateAccuracy(attempts) {
        if (!attempts || !attempts.length) return 0;
        var sum = 0;
        attempts.forEach(function (a) {
            sum += computeAttemptAccuracy(a);
        });
        return Math.round(sum / attempts.length);
    }

    function computeStudyStreak(attempts) {
        var days = {};
        (attempts || []).forEach(function (a) {
            if (!a.timestamp) return;
            var d = new Date(a.timestamp);
            if (isNaN(d.getTime())) return;
            days[d.toISOString().slice(0, 10)] = true;
        });
        var keys = Object.keys(days).sort();
        if (!keys.length) return 0;
        var streak = 0;
        var cursor = new Date();
        cursor.setHours(0, 0, 0, 0);
        for (var i = 0; i < 365; i++) {
            var key = cursor.toISOString().slice(0, 10);
            if (!days[key]) break;
            streak++;
            cursor.setDate(cursor.getDate() - 1);
        }
        return streak;
    }

    function buildUserStatsFromAttempts(attempts) {
        var list = attempts || [];
        var totalXP = computeTotalPoints(list);
        var totalQuizzes = list.length;
        var accuracyPercentage = aggregateAccuracy(list);
        var bestScore = 0;
        list.forEach(function (a) {
            if ((a.score || 0) > bestScore) bestScore = a.score;
        });
        var level = Storage.calculateLevel(totalXP);
        var last = list[0];
        var lastAttemptDate = last && last.timestamp ? last.timestamp : null;
        return {
            totalQuizzes: totalQuizzes,
            totalXP: totalXP,
            accuracyPercentage: accuracyPercentage,
            currentStreak: computeStudyStreak(list),
            bestScore: bestScore,
            level: level,
            lastAttemptDate: lastAttemptDate
        };
    }

    function mergeStats(dbStats, fromAttempts) {
        var base = dbStats || {};
        var derived = fromAttempts || {};
        var useDerived = (base.totalQuizzes || 0) === 0 && (derived.totalQuizzes || 0) > 0;
        if (!useDerived && (base.totalXP || 0) > 0) {
            return {
                totalQuizzes: base.totalQuizzes || 0,
                totalXP: base.totalXP || 0,
                accuracyPercentage: base.accuracyPercentage != null ? base.accuracyPercentage : 0,
                currentStreak: base.currentStreak || 0,
                bestScore: base.bestScore || 0,
                level: base.level || Storage.calculateLevel(base.totalXP || 0),
                lastAttemptDate: base.lastAttemptDate || null
            };
        }
        return {
            totalQuizzes: Math.max(base.totalQuizzes || 0, derived.totalQuizzes || 0),
            totalXP: Math.max(base.totalXP || 0, derived.totalXP || 0),
            accuracyPercentage: derived.totalQuizzes ? derived.accuracyPercentage : (base.accuracyPercentage || 0),
            currentStreak: Math.max(base.currentStreak || 0, derived.currentStreak || 0),
            bestScore: Math.max(base.bestScore || 0, derived.bestScore || 0),
            level: Storage.calculateLevel(Math.max(base.totalXP || 0, derived.totalXP || 0)),
            lastAttemptDate: derived.lastAttemptDate || base.lastAttemptDate || null
        };
    }

    function getLevelProgress(totalXP, level) {
        var tiers = LEVEL_TIERS;
        var idx = Math.min(Math.max((level || 1) - 1, 0), tiers.length - 1);
        var current = tiers[idx];
        var next = tiers[idx + 1] || { xpRequired: 10000, name: 'Max' };
        var xpInLevel = Math.max(0, totalXP - current.xpRequired);
        var xpNeeded = Math.max(1, next.xpRequired - current.xpRequired);
        var percent = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));
        return {
            currentThreshold: current.xpRequired,
            nextThreshold: next.xpRequired,
            xpInLevel: xpInLevel,
            xpNeeded: xpNeeded,
            percent: percent,
            nextName: next.name
        };
    }

    window.AccolyStats = {
        QUIZ_SUBJECTS: QUIZ_SUBJECTS,
        LEVEL_TIERS: LEVEL_TIERS,
        computeAttemptAccuracy: computeAttemptAccuracy,
        filterAttemptsBySubject: filterAttemptsBySubject,
        computeTotalPoints: computeTotalPoints,
        aggregateAccuracy: aggregateAccuracy,
        computeStudyStreak: computeStudyStreak,
        buildUserStatsFromAttempts: buildUserStatsFromAttempts,
        mergeStats: mergeStats,
        getLevelProgress: getLevelProgress
    };
})();
