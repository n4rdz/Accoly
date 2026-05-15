var FLASH_SUBJECTS = ['FAR', 'AFAR', 'MS', 'AUD', 'RFBT', 'TAX'];
var FLASH_DAILY_LIMIT = 15;
var flashState = { subject: FLASH_SUBJECTS[0], index: 0, showBack: false, allCards: [] };

var _flashcardsInitialized = false;

document.addEventListener('DOMContentLoaded', function () {
    if (window.__authReady) {
        initFlashcards();
    } else {
        window.addEventListener('authReady', initFlashcards, { once: true });
    }
});

function normalizeFlashcard(c) {
    if (!c) return c;
    c.front = c.front || c.question || '';
    c.back = c.back || c.answer || '';
    return c;
}

function reloadFlashcardsFromServer(user) {
    return SupabaseClient.getFlashcards(user.id).then(function (cards) {
        flashState.allCards = (cards || []).map(normalizeFlashcard);
    });
}

function seedFlashcardsIfNeeded(user) {
    if (flashState.allCards.length > 0) return Promise.resolve();
    var jobs = FLASH_SUBJECTS.map(function (s) {
        return SupabaseClient.saveFlashcard({
            userId: 'seed',
            subject: s,
            question: 'Core idea of ' + s + '?',
            answer: 'Review your summary notes and sample problem set for ' + s + '.'
        });
    });
    return Promise.all(jobs);
}

function initFlashcards() {
    if (_flashcardsInitialized) return;
    var user = Storage.getCurrentUser();
    if (!user) return;
    _flashcardsInitialized = true;

    var sel = document.getElementById('flashSubject');
    FLASH_SUBJECTS.forEach(function (s) {
        var o = document.createElement('option');
        o.value = s;
        o.textContent = window.AccolyStats ? AccolyStats.getSubjectLabel(s) : s;
        sel.appendChild(o);
    });
    sel.addEventListener('change', function (e) {
        flashState.subject = e.target.value;
        flashState.index = 0;
        flashState.showBack = false;
        renderFlashcard();
    });
    document.getElementById('btnAddCard').addEventListener('click', openModal);
    document.getElementById('flashModalClose').addEventListener('click', closeModal);
    document.getElementById('flashCancel').addEventListener('click', closeModal);
    document.getElementById('flashSave').addEventListener('click', saveCard);
    document.getElementById('btnCorrect').addEventListener('click', function () { markCard(true); });
    document.getElementById('btnWrong').addEventListener('click', function () { markCard(false); });
    document.getElementById('btnPrevCard').addEventListener('click', function () { moveCard(-1); });
    document.getElementById('btnNextCard').addEventListener('click', function () { moveCard(1); });
    document.getElementById('btnResetDaily').addEventListener('click', resetDaily);
    document.getElementById('flashCard').addEventListener('click', function () {
        flashState.showBack = !flashState.showBack;
        renderFlashcard();
    });

    reloadFlashcardsFromServer(user)
        .then(function () {
            return seedFlashcardsIfNeeded(user);
        })
        .then(function () {
            return reloadFlashcardsFromServer(user);
        })
        .then(function () {
            loadDailyProgress(user.id, function () { renderFlashcard(); });
        })
        .catch(function (err) {
            console.error('Flashcards init error:', err);
            AccountifyUI.toast('Could not load flashcards', 'error');
        });
}

function isPremiumUser() {
    return window.AccolySubscription ? AccolySubscription.isPremiumUser() : false;
}

function subjectCards() {
    var user = Storage.getCurrentUser();
    if (!user) return [];
    return (flashState.allCards || []).filter(function (c) {
        return c.subject === flashState.subject && (c.userId === user.id || c.userId === 'seed');
    });
}

function todayKey() {
    return new Date().toISOString().slice(0, 10);
}

var _flashDailyCache = { reviewed: 0, correct: 0, incorrect: 0 };

function loadDailyProgress(userId, cb) {
    if (!window.SupabaseClient || !SupabaseClient.getFlashDailyProgress) {
        _flashDailyCache = { reviewed: 0, correct: 0, incorrect: 0 };
        if (cb) cb(_flashDailyCache);
        return Promise.resolve(_flashDailyCache);
    }
    return SupabaseClient.getFlashDailyProgress(userId, flashState.subject, todayKey())
        .then(function (p) {
            _flashDailyCache = p || { reviewed: 0, correct: 0, incorrect: 0 };
            if (cb) cb(_flashDailyCache);
            return _flashDailyCache;
        })
        .catch(function () {
            _flashDailyCache = { reviewed: 0, correct: 0, incorrect: 0 };
            if (cb) cb(_flashDailyCache);
            return _flashDailyCache;
        });
}

function dailyProgress(userId) {
    return _flashDailyCache;
}

function renderFlashcard() {
    var user = Storage.getCurrentUser();
    if (!user) return;
    var cards = subjectCards();
    if (flashState.index >= cards.length) flashState.index = 0;

    var progress = dailyProgress(user.id);
    var remaining = Math.max(0, FLASH_DAILY_LIMIT - (progress.reviewed || 0));
    var dailyEl = document.getElementById('flashDailyInfo');
    var statsEl = document.getElementById('flashStatsInfo');
    if (dailyEl) {
        dailyEl.textContent = 'Daily limit: ' + (progress.reviewed || 0) + '/' + FLASH_DAILY_LIMIT + ' reviewed • Remaining: ' + remaining;
    }
    if (statsEl) {
        statsEl.textContent = 'Correct: ' + (progress.correct || 0) + ' • Incorrect: ' + (progress.incorrect || 0);
    }

    var empty = document.getElementById('flashEmpty');
    var ui = document.getElementById('flashCardUI');
    if (!cards.length) {
        empty.style.display = 'block';
        ui.style.display = 'none';
        renderConfusion([]);
        return;
    }
    empty.style.display = 'none';
    ui.style.display = 'block';

    var card = cards[flashState.index];
    document.getElementById('flashCardText').textContent = flashState.showBack ? card.back : card.front;
    renderConfusion(cards);
}

function renderConfusion(cards) {
    var list = document.getElementById('confusionList');
    if (!list) return;

    var confused = (cards || []).filter(function (c) { return (c.confusionCount || 0) > 0; });
    if (!confused.length) {
        list.innerHTML = '<p style="color:var(--text-secondary);">No confusing cards yet. Great job.</p>';
        return;
    }

    list.innerHTML = confused
        .sort(function (a, b) { return (b.confusionCount || 0) - (a.confusionCount || 0); })
        .slice(0, 10)
        .map(function (c) {
            const front = esc(c.front || 'Unknown card');
            const count = (c.confusionCount || 0);
            return '<div style="padding:0.6rem 0;border-bottom:1px solid var(--border);"><strong>' + front + '</strong><p>Missed ' + count + ' times</p></div>';
        })
        .join('');
}

function moveCard(delta) {
    var cards = subjectCards();
    if (!cards.length) return;
    flashState.index = (flashState.index + delta + cards.length) % cards.length;
    flashState.showBack = false;
    renderFlashcard();
}

function markCard(correct) {
    var user = Storage.getCurrentUser();
    var cards = subjectCards();
    if (!cards.length) return;
    var progress = dailyProgress(user.id);
    if (!isPremiumUser() && progress.reviewed >= FLASH_DAILY_LIMIT) {
        if (!checkPremiumAccess('Unlimited flashcards')) return;
    }

    var card = cards[flashState.index];

    function afterPersist() {
        loadDailyProgress(user.id, function () {
            flashState.showBack = false;
            moveCard(1);
        });
    }

    var reviewPromise = SupabaseClient.recordFlashReview(user.id, flashState.subject, todayKey(), correct);

    if (!correct) {
        card.confusionCount = (card.confusionCount || 0) + 1;
        SupabaseClient.saveFlashcard({
            id: card.id,
            userId: card.userId,
            subject: card.subject,
            question: card.front || card.question,
            answer: card.back || card.answer,
            confusionCount: card.confusionCount
        })
            .then(function (saved) {
                if (saved) normalizeFlashcard(saved);
            })
            .catch(function (e) {
                console.error(e);
            })
            .finally(function () {
                reviewPromise.finally(afterPersist);
            });
        return;
    }

    reviewPromise.finally(afterPersist);
}

function openModal() {
    document.getElementById('flashModal').classList.add('open');
}

function closeModal() {
    document.getElementById('flashModal').classList.remove('open');
    document.getElementById('flashQuestion').value = '';
    document.getElementById('flashAnswer').value = '';
}

function saveCard() {
    var user = Storage.getCurrentUser();
    if (!user) {
        AccountifyUI.toast('Please login to save flashcards', 'error');
        return;
    }

    var front = (document.getElementById('flashQuestion').value || '').trim();
    var back = (document.getElementById('flashAnswer').value || '').trim();

    if (!front || !back) {
        AccountifyUI.toast('Both front and back are required', 'warning');
        return;
    }

    if (front.length > 500 || back.length > 500) {
        AccountifyUI.toast('Text too long (max 500 characters each)', 'warning');
        return;
    }

    if (/<script|javascript:|on\w+=/i.test(front + back)) {
        AccountifyUI.toast('Invalid content detected', 'error');
        return;
    }

    SupabaseClient.saveFlashcard({
        userId: user.id,
        subject: flashState.subject,
        question: front,
        answer: back,
        confusionCount: 0
    })
        .then(function (saved) {
            if (!saved) {
                AccountifyUI.toast('Failed to save flashcard', 'error');
                return Promise.reject(new Error('save_failed'));
            }
            normalizeFlashcard(saved);
            flashState.allCards.push(saved);
            return SupabaseClient.addNotification({
                userId: user.id,
                message: 'A flashcard was added for ' + flashState.subject + '.'
            });
        })
        .then(function () {
            if (window.AccountifyNav) {
                return AccountifyNav.refreshNotifications();
            }
        })
        .then(function () {
            closeModal();
            AccountifyUI.toast('Flashcard saved successfully', 'success');
            renderFlashcard();
        })
        .catch(function (error) {
            if (error && error.message === 'save_failed') return;
            console.error('Save flashcard error:', error);
            AccountifyUI.toast('Failed to save flashcard', 'error');
        });
}

function resetDaily() {
    var user = Storage.getCurrentUser();
    SupabaseClient.resetFlashDaily(user.id, flashState.subject, todayKey())
        .then(function () { loadDailyProgress(user.id, function () { renderFlashcard(); }); });
}

function esc(s) {
    var d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
}

function logout() {
    SupabaseClient.signOut().finally(function () {
        Storage.logout();
        window.location.replace('login.html');
    });
}
