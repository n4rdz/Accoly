var FLASH_SUBJECTS = [
    'Financial Accounting',
    'Cost Accounting',
    'Auditing',
    'Taxation',
    'Business Law',
    'Economics',
    'Management Advisory Services'
];
var FLASH_DAILY_LIMIT = 15;
var flashState = { subject: FLASH_SUBJECTS[0], index: 0, showBack: false };

document.addEventListener('DOMContentLoaded', function () {
    var user = Storage.getCurrentUser();
    if (!user) return (window.location.href = 'login.html');

    seedFlashcards();
    var sel = document.getElementById('flashSubject');
    FLASH_SUBJECTS.forEach(function (s) {
        var o = document.createElement('option');
        o.value = s;
        o.textContent = s;
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
    renderFlashcard();
});

function isPremiumUser() {
    return window.AccolySubscription ? AccolySubscription.isPremiumUser() : false;
}

function seedFlashcards() {
    if ((Storage.getFlashcards() || []).length > 0) return;
    FLASH_SUBJECTS.forEach(function (s) {
        Storage.saveFlashcard({ userId: 'seed', subject: s, front: 'Core idea of ' + s + '?', back: 'Review your summary notes and sample problem set for ' + s + '.' });
    });
}

function subjectCards() {
    return Storage.getFlashcardsBySubject(flashState.subject);
}

function todayKey() {
    return new Date().toISOString().slice(0, 10);
}

function dailyProgress(userId) {
    return Storage.getFlashDailyProgress(userId, flashState.subject, todayKey());
}

function renderFlashcard() {
    var user = Storage.getCurrentUser();
    var cards = subjectCards();
    if (flashState.index >= cards.length) flashState.index = 0;

    var progress = dailyProgress(user.id);
    var remaining = Math.max(0, FLASH_DAILY_LIMIT - progress.reviewed);
    document.getElementById('flashDailyInfo').textContent = 'Daily limit: ' + progress.reviewed + '/' + FLASH_DAILY_LIMIT + ' reviewed • Remaining: ' + remaining;
    document.getElementById('flashStatsInfo').textContent = 'Correct: ' + progress.correct + ' • Incorrect: ' + progress.incorrect;

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
    Storage.recordFlashReview(user.id, flashState.subject, todayKey(), correct);
    if (!correct) {
        card.confusionCount = (card.confusionCount || 0) + 1;
        Storage.saveFlashcard(card);
    }
    flashState.showBack = false;
    moveCard(1);
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
    
    // Input validation
    if (!front || !back) {
        AccountifyUI.toast('Both front and back are required', 'warning');
        return;
    }
    
    if (front.length > 500 || back.length > 500) {
        AccountifyUI.toast('Text too long (max 500 characters each)', 'warning');
        return;
    }
    
    // Check for script injection
    if (/<script|javascript:|on\w+=/i.test(front + back)) {
        AccountifyUI.toast('Invalid content detected', 'error');
        return;
    }
    
    try {
        Storage.saveFlashcard({ 
            userId: user.id, 
            subject: flashState.subject, 
            front: front, 
            back: back, 
            confusionCount: 0 
        });
        
        Storage.addNotification({ 
            userId: user.id, 
            message: 'A flashcard was added for ' + esc(flashState.subject) + '.' 
        });
        
        if (window.AccountifyNav) AccountifyNav.refreshNotifications();
        
        closeModal();
        AccountifyUI.toast('Flashcard saved successfully', 'success');
        renderFlashcard();
    } catch (error) {
        console.error('Save flashcard error:', error);
        AccountifyUI.toast('Failed to save flashcard', 'error');
    }
}

function resetDaily() {
    var user = Storage.getCurrentUser();
    Storage.resetFlashDaily(user.id, flashState.subject, todayKey());
    renderFlashcard();
}

function esc(s) {
    var d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
}

function logout() {
    Storage.logout();
    window.location.href = 'login.html';
}
