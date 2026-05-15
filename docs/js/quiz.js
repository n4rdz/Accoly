// ============================================
// QUIZ ENGINE - FULL FUNCTIONALITY
// ============================================

let currentQuizModule = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let selectedAnswers = {};
let lastQuizSnapshot = null;
let quizStartTime = null;
let quizTimerInterval = null;
let timeLimit = 30 * 60; // Dynamic by difficulty
let remainingTime = timeLimit;

document.addEventListener('DOMContentLoaded', function() {
    if (window.__authReady) {
        initQuizCenter();
    } else {
        window.addEventListener('authReady', initQuizCenter);
    }
});

function initQuizCenter() {
    const user = Storage.getCurrentUser();
    if (!user) return; // auth.js already redirected

    loadQuizModules();
}

function getTimeLimitByDifficulty(level) {
    if (level === 'Easy') return 10 * 60;
    if (level === 'Medium') return 18 * 60;
    if (level === 'Hard') return 22 * 60;
    return 30 * 60;
}

function formatQuizMinutes(level) {
    var sec = getTimeLimitByDifficulty(level);
    return Math.round(sec / 60) + ' min';
}

// HTML escaping utility
function esc(s) {
    var d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
}

function loadQuizModules() {
    const modulesContainer = document.getElementById('quizModules');
    const premium = window.AccolySubscription ? AccolySubscription.isPremiumUser() : false;
    
    modulesContainer.innerHTML = QUIZ_MODULES.map(module => `
        <div class="quiz-module">
            <div class="quiz-module-header" style="background: linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%);">
                <div class="quiz-module-title">
                    <h3>${esc(window.AccolyStats ? AccolyStats.getSubjectLabel(module.subject) : module.name)}</h3>
                    <p>10 Questions • ${esc(module.difficulty)}</p>
                </div>
                <div class="difficulty-badge">${esc(module.difficulty)}</div>
            </div>
            <div class="quiz-module-body">
                <div class="module-stat">
                    <span class="module-stat-label">Questions</span>
                    <span class="module-stat-value">10</span>
                </div>
                <div class="module-stat">
                    <span class="module-stat-label">Time Limit</span>
                    <span class="module-stat-value">${formatQuizMinutes(module.difficulty)}</span>
                </div>
                <div class="module-stat">
                    <span class="module-stat-label">Difficulty</span>
                    <span class="module-stat-value">${esc(module.difficulty)}</span>
                </div>
                <button onclick="startQuiz(${module.id})" class="btn btn-primary" ${(!premium && module.difficulty === 'Elite') ? 'data-premium="true" disabled aria-disabled="true"' : ''}>
                    ${(!premium && module.difficulty === 'Elite') ? '🔒 Start Quiz' : 'Start Quiz'}
                </button>
            </div>
        </div>
    `).join('');
}

function filterQuizzes(difficulty, evt) {
    // Update button states
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (evt && evt.target) evt.target.classList.add('active');

    const modulesContainer = document.getElementById('quizModules');
    
    if (difficulty === 'All') {
        loadQuizModules();
    } else {
        const filtered = QUIZ_MODULES.filter(m => m.difficulty === difficulty);
        modulesContainer.innerHTML = filtered.map(module => `
            <div class="quiz-module">
                <div class="quiz-module-header" style="background: linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%);">
                    <div class="quiz-module-title">
                        <h3>${esc(module.name)}</h3>
                        <p>10 Questions • ${esc(module.difficulty)}</p>
                    </div>
                    <div class="difficulty-badge">${esc(module.difficulty)}</div>
                </div>
                <div class="quiz-module-body">
                    <div class="module-stat">
                        <span class="module-stat-label">Questions</span>
                        <span class="module-stat-value">10</span>
                    </div>
                    <div class="module-stat">
                        <span class="module-stat-label">Time Limit</span>
                        <span class="module-stat-value">${formatQuizMinutes(module.difficulty)}</span>
                    </div>
                    <div class="module-stat">
                        <span class="module-stat-label">Difficulty</span>
                        <span class="module-stat-value">${esc(module.difficulty)}</span>
                    </div>
                    <button onclick="startQuiz(${module.id})" class="btn btn-primary">
                        Start Quiz
                    </button>
                </div>
            </div>
        `).join('');
    }
}

function startQuiz(moduleId) {
    // Offline quizzes: Premium-only
    if (navigator && navigator.onLine === false) {
        if (!checkPremiumAccess('Offline quizzes')) return;
    }

    currentQuizModule = QUIZ_MODULES.find(m => m.id === moduleId);
    if (currentQuizModule && currentQuizModule.difficulty === 'Elite') {
        if (!checkPremiumAccess('Elite quizzes')) return;
    }
    currentQuestions = QUIZ_QUESTIONS[moduleId];
    
    // Shuffle questions
    currentQuestions = currentQuestions.sort(() => Math.random() - 0.5);
    
    currentQuestionIndex = 0;
    selectedAnswers = {};
    quizStartTime = Date.now();
    timeLimit = getTimeLimitByDifficulty(currentQuizModule.difficulty);
    remainingTime = timeLimit;

    // Show quiz interface
    document.getElementById('quizSelection').style.display = 'none';
    document.getElementById('quizTaking').style.display = 'block';
    document.getElementById('quizResults').style.display = 'none';

    // Load first question
    loadQuestion();

    // Start timer
    startTimer();
}

function startTimer() {
    quizTimerInterval = setInterval(() => {
        remainingTime--;
        updateTimerDisplay();

        if (remainingTime <= 0) {
            clearInterval(quizTimerInterval);
            submitQuiz();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    const timerDisplay = document.getElementById('timerDisplay');
    timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Change color based on time remaining
    if (remainingTime <= 300) { // 5 minutes
        timerDisplay.parentElement.classList.add('danger');
        timerDisplay.parentElement.classList.remove('warning');
    } else if (remainingTime <= 600) { // 10 minutes
        timerDisplay.parentElement.classList.add('warning');
        timerDisplay.parentElement.classList.remove('danger');
    }
}

function loadQuestion() {
    const question = currentQuestions[currentQuestionIndex];
    const questionEl = document.getElementById('questionText');
    if (questionEl) questionEl.textContent = esc(question.question || 'Question text not available');
    
    const optionsContainer = document.getElementById('optionsContainer');
    if (optionsContainer) {
        optionsContainer.innerHTML = question.options.map((option, index) => `
            <button 
                class="option-btn ${selectedAnswers[currentQuestionIndex] === index ? 'selected' : ''}"
                onclick="selectAnswer(${index})"
            >
                ${esc(option || 'Option not available')}
            </button>
        `).join('');
    }

    // Update question navigator
    updateQuestionNavigator();

    // Update submit button text
    const submitBtn = document.getElementById('submitBtn');
    if (currentQuestionIndex === currentQuestions.length - 1) {
        submitBtn.textContent = 'Submit Quiz';
    } else {
        submitBtn.textContent = 'Submit Quiz';
    }
}

function selectAnswer(index) {
    selectedAnswers[currentQuestionIndex] = index;
    
    // Reload question to update button states
    const optionsContainer = document.getElementById('optionsContainer');
    const question = currentQuestions[currentQuestionIndex];
    
    optionsContainer.innerHTML = question.options.map((option, optionIndex) => `
        <button 
            class="option-btn ${selectedAnswers[currentQuestionIndex] === optionIndex ? 'selected' : ''}"
            onclick="selectAnswer(${optionIndex})"
        >
            ${option}
        </button>
    `).join('');
}

function updateQuestionNavigator() {
    const navigatorContainer = document.getElementById('questionNavigator');
    navigatorContainer.innerHTML = '';

    for (let i = 0; i < currentQuestions.length; i++) {
        const btn = document.createElement('button');
        btn.className = 'nav-button';
        btn.textContent = i + 1;
        
        if (i === currentQuestionIndex) {
            btn.classList.add('current');
        } else if (selectedAnswers[i] !== undefined) {
            btn.classList.add('answered');
        }

        btn.onclick = () => goToQuestion(i);
        navigatorContainer.appendChild(btn);
    }
}

function goToQuestion(index) {
    currentQuestionIndex = index;
    loadQuestion();
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        loadQuestion();
    }
}

function nextQuestion() {
    if (currentQuestionIndex < currentQuestions.length - 1) {
        currentQuestionIndex++;
        loadQuestion();
    }
}

function exitQuiz() {
    if (confirm('Are you sure you want to exit? Your progress will be lost.')) {
        clearInterval(quizTimerInterval);
        document.getElementById('quizSelection').style.display = 'block';
        document.getElementById('quizTaking').style.display = 'none';
        document.getElementById('quizResults').style.display = 'none';
        loadQuizModules();
    }
}

function submitQuiz() {
    clearInterval(quizTimerInterval);

    // Calculate score
    let correctCount = 0;
    for (let i = 0; i < currentQuestions.length; i++) {
        if (selectedAnswers[i] === currentQuestions[i].correct) {
            correctCount++;
        }
    }

    const score = Math.round((correctCount / currentQuestions.length) * 100);
    const timeTaken = Math.floor((Date.now() - quizStartTime) / 1000);
    const xpEarned = Storage.calculateXP({
        difficulty: currentQuizModule.difficulty,
        correctAnswers: correctCount,
        totalQuestions: currentQuestions.length,
        score: score
    });

    // Save attempt
    const user = Storage.getCurrentUser();
    const attempt = {
        userId: user.id,
        subject: currentQuizModule.subject,
        difficulty: currentQuizModule.difficulty,
        score: score,
        correctAnswers: correctCount,
        totalQuestions: currentQuestions.length,
        timeTaken: timeTaken,
        xpEarned: xpEarned
    };
    SupabaseClient.saveQuizAttempt(attempt)
        .then(function (saved) {
            if (!saved) {
                console.error('Failed to persist quiz attempt');
            }
            return SupabaseClient.syncUserStatsFromAttempts(user.id);
        })
        .then(function () {
            return SupabaseClient.addNotification({
                userId: user.id,
                message: 'You completed the ' + currentQuizModule.name + ' quiz! Score: ' + score + '%'
            });
        })
        .then(function () {
            if (window.AccountifyNav) {
                return AccountifyNav.refreshNotifications();
            }
        })
        .catch(function (err) {
            console.error('Quiz save error:', err);
        })
        .finally(function () {
            showResults(score, correctCount, timeTaken, xpEarned);
        });
}

function showResults(score, correctCount, timeTaken, xpEarned) {
    document.getElementById('quizSelection').style.display = 'none';
    document.getElementById('quizTaking').style.display = 'none';
    document.getElementById('quizResults').style.display = 'block';

    // Calculate grade
    let grade = 'F';
    let gradeColor = '#EF4444';
    if (score >= 90) { grade = 'A'; gradeColor = '#10B981'; }
    else if (score >= 80) { grade = 'B'; gradeColor = '#3B82F6'; }
    else if (score >= 70) { grade = 'C'; gradeColor = '#F59E0B'; }

    document.getElementById('gradeDisplay').textContent = grade;
    document.getElementById('gradeDisplay').parentElement.style.background = gradeColor;

    const minutes = Math.floor(timeTaken / 60);
    const seconds = timeTaken % 60;

    document.getElementById('finalScore').textContent = score + '%';
    document.getElementById('correctCount').textContent = `${correctCount}/${currentQuestions.length}`;
    document.getElementById('timeTaken').textContent = `${minutes}m ${seconds}s`;
    document.getElementById('xpEarned').textContent = xpEarned + ' XP';

    // Score message
    const scoreMessage = document.getElementById('scoreMessage');
    if (score >= 90) scoreMessage.textContent = 'Excellent performance! Keep it up! 🌟';
    else if (score >= 80) scoreMessage.textContent = 'Great job! You\'re doing well! 👏';
    else if (score >= 70) scoreMessage.textContent = 'Good effort! Keep practicing! 💪';
    else scoreMessage.textContent = 'Keep studying and try again! 📚';

    // Keep a snapshot for premium explanations
    lastQuizSnapshot = {
        module: currentQuizModule,
        questions: currentQuestions,
        answers: selectedAnswers
    };

    var btnExplain = document.getElementById('btnShowExplanations');
    var panel = document.getElementById('explanationsPanel');
    if (panel) panel.innerHTML = '';
    if (btnExplain) {
        btnExplain.onclick = function () {
            if (!checkPremiumAccess('Detailed quiz explanations')) return;
            renderExplanations();
        };
    }
}

function renderExplanations() {
    var panel = document.getElementById('explanationsPanel');
    if (!panel || !lastQuizSnapshot) return;
    var qs = lastQuizSnapshot.questions || [];
    var ans = lastQuizSnapshot.answers || {};
    panel.innerHTML = qs
        .map(function (q, idx) {
            var your = ans[idx];
            var correct = q.correct;
            var ok = your === correct;
            return (
                '<div class="card" style="margin:0.5rem 0;background:var(--surface);">' +
                '<strong>Q' + (idx + 1) + ':</strong> ' + escapeHtml(q.question) +
                '<div style="margin-top:0.35rem;font-size:0.9rem;">' +
                '<div><strong>Your answer:</strong> ' + escapeHtml(q.options[your] || '—') + '</div>' +
                '<div><strong>Correct answer:</strong> ' + escapeHtml(q.options[correct] || '—') + '</div>' +
                '<div style="margin-top:0.35rem;color:' + (ok ? 'var(--success)' : 'var(--danger)') + ';font-weight:700;">' + (ok ? 'Correct' : 'Incorrect') + '</div>' +
                '<div style="margin-top:0.5rem;"><strong>Explanation:</strong> ' + escapeHtml(q.explanation || 'No explanation provided.') + '</div>' +
                '</div>' +
                '</div>'
            );
        })
        .join('');
}

function escapeHtml(str) {
    var d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
}

function retakeQuiz() {
    startQuiz(currentQuizModule.id);
}

function backToQuizList() {
    document.getElementById('quizSelection').style.display = 'block';
    document.getElementById('quizTaking').style.display = 'none';
    document.getElementById('quizResults').style.display = 'none';
    loadQuizModules();
}

function logout() {
    Storage.logout();
    window.location.href = 'login.html';
}