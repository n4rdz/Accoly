document.addEventListener('DOMContentLoaded', function () {
    if (window.__authReady) {
        initSettings();
    } else {
        window.addEventListener('authReady', initSettings);
    }
});

function initSettings() {
    var user = Storage.getCurrentUser();
    if (!user) return; // auth.js already redirected

    var emailEl = document.getElementById('settingEmail');
    if (emailEl) emailEl.value = user.email;

    var themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
        themeSelect.value = AccountifyTheme.get();
        themeSelect.addEventListener('change', function () {
            AccountifyTheme.set(themeSelect.value);
        });
    }

    initSubscriptionPanel();
}

function initSubscriptionPanel() {
    var user = Storage.getCurrentUser();
    if (!user) return;
    var planName = document.getElementById('planName');
    var planMeta = document.getElementById('planMeta');
    var planBadge = document.getElementById('planBadge');
    var btnUpgrade = document.getElementById('btnUpgradePremium');
    var statusRow = document.getElementById('premiumActiveRow');
    var activeDate = document.getElementById('premiumSince');

    var isPremium = user.subscriptionStatus === 'premium';

    if (planName) planName.textContent = isPremium ? 'Premium Plan' : 'Basic Plan';
    if (planBadge) planBadge.textContent = isPremium ? 'Active' : 'Recommended';
    if (planMeta) {
        planMeta.textContent = isPremium
            ? 'You have full access to all premium features.'
            : 'Upgrade to unlock premium study tools and offline access.';
    }

    if (statusRow) statusRow.style.display = isPremium ? 'flex' : 'none';
    if (activeDate) {
        activeDate.textContent = isPremium && user.subscriptionDate
            ? new Date(user.subscriptionDate).toLocaleString()
            : '—';
    }

    if (btnUpgrade) {
        btnUpgrade.style.display = isPremium ? 'none' : 'inline-block';
        btnUpgrade.addEventListener('click', function () {
            openSubscribeModal();
        });
    }
}

function openSubscribeModal() {
    var modal = document.getElementById('subscribeModal');
    if (!modal) return;
    modal.classList.add('open');
}

function closeSubscribeModal() {
    var modal = document.getElementById('subscribeModal');
    if (!modal) return;
    modal.classList.remove('open');
}

// Required by your spec
function subscribeToPremium() {
    var user = Storage.getCurrentUser();
    if (!user) return false;

    AccolySubscription.upgradeToPremium()
        .then(function (ok) {
            if (!ok) {
                if (window.AccountifyUI) AccountifyUI.toast('Could not activate Premium. Try again.', 'error');
                return;
            }
            if (AccolySubscription.applyPremiumLocks) AccolySubscription.applyPremiumLocks();
            if (window.AccountifyNav) AccountifyNav.refreshNotifications();
            closeSubscribeModal();
            if (window.AccountifyUI) AccountifyUI.toast('Premium activated. Enjoy!', 'success');
            initSubscriptionPanel();
        })
        .catch(function () {
            if (window.AccountifyUI) AccountifyUI.toast('Could not activate Premium. Try again.', 'error');
        });

    return true;
}

function clearData() {
    if (!confirm('Are you sure? This will delete all your data including quiz attempts and notes.')) {
        return;
    }
    
    try {
        localStorage.clear();
        // Also clear IndexedDB if available
        if (window.indexedDB) {
            indexedDB.deleteDatabase('AccolyDB');
        }
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error clearing data:', error);
        alert('Failed to clear all data. Please try again.');
    }
}

function logout() {
    Storage.logout();
    window.location.href = 'login.html';
}