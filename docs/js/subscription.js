(function () {
    var KEY_USERS = 'users';
    var KEY_CURRENT = 'currentUser';

    function getUsers() {
        return JSON.parse(localStorage.getItem(KEY_USERS) || '[]');
    }

    function saveUsers(users) {
        localStorage.setItem(KEY_USERS, JSON.stringify(users));
    }

    function getCurrentUserRaw() {
        return JSON.parse(localStorage.getItem(KEY_CURRENT) || 'null');
    }

    function setCurrentUser(user) {
        localStorage.setItem(KEY_CURRENT, JSON.stringify(user));
    }

    function normalizeUser(u) {
        if (!u) return u;
        if (u.subscriptionStatus !== 'free' && u.subscriptionStatus !== 'premium') {
            // migrate from legacy flag
            if (u.isPremium === true) {
                u.subscriptionStatus = 'premium';
                u.subscriptionDate = u.subscriptionDate || new Date().toISOString();
            } else {
                u.subscriptionStatus = 'free';
                u.subscriptionDate = null;
            }
        }
        if (u.subscriptionStatus === 'premium' && !u.subscriptionDate) {
            u.subscriptionDate = new Date().toISOString();
        }
        if (u.subscriptionStatus === 'free') {
            u.subscriptionDate = null;
        }
        return u;
    }

    function getCurrentUserFresh() {
        var raw = getCurrentUserRaw();
        if (!raw || !raw.id) return null;
        var users = getUsers();
        var stored = users.find(function (x) {
            return x.id === raw.id;
        });
        if (!stored) {
            localStorage.removeItem(KEY_CURRENT);
            return null;
        }
        stored = normalizeUser(stored);
        // keep session in sync with stored record
        setCurrentUser(stored);
        // also persist normalized user record
        saveUsers(
            users.map(function (x) {
                return x.id === stored.id ? stored : x;
            })
        );
        return stored;
    }

    function isPremiumUser() {
        var user = getCurrentUserFresh();
        return !!(user && user.subscriptionStatus === 'premium');
    }

    function ensureUpgradeModal() {
        if (document.getElementById('upgradeModal')) return;

        var overlay = document.createElement('div');
        overlay.id = 'upgradeModal';
        overlay.className = 'upgrade-modal-overlay';
        overlay.hidden = true;
        overlay.innerHTML =
            '<div class="upgrade-modal-panel" role="dialog" aria-modal="true" aria-labelledby="upgradeModalTitle">' +
            '<div class="upgrade-modal-header">' +
            '<h2 id="upgradeModalTitle">Upgrade to Premium</h2>' +
            '<button type="button" class="upgrade-modal-close" id="upgradeModalClose" aria-label="Close">×</button>' +
            '</div>' +
            '<div class="upgrade-modal-body">' +
            '<p id="upgradeModalMessage">This feature requires Premium.</p>' +
            '<div class="upgrade-modal-benefits">' +
            '<div class="upgrade-pill">Unlimited flashcards</div>' +
            '<div class="upgrade-pill">Offline quizzes</div>' +
            '<div class="upgrade-pill">Advanced analytics</div>' +
            '<div class="upgrade-pill">Anonymous posting</div>' +
            '</div>' +
            '</div>' +
            '<div class="upgrade-modal-footer">' +
            '<button type="button" class="btn btn-outline" id="upgradeModalCancel">Not now</button>' +
            '<button type="button" class="btn btn-primary" id="upgradeModalUpgrade">Upgrade (Simulated)</button>' +
            '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        function close() {
            overlay.hidden = true;
        }

        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) close();
        });
        document.getElementById('upgradeModalClose').addEventListener('click', close);
        document.getElementById('upgradeModalCancel').addEventListener('click', close);
        document.getElementById('upgradeModalUpgrade').addEventListener('click', function () {
            upgradeToPremium();
            window.location.reload();
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') close();
        });
    }

    function showUpgradeModal(featureName) {
        ensureUpgradeModal();
        var overlay = document.getElementById('upgradeModal');
        var msg = document.getElementById('upgradeModalMessage');
        if (msg) {
            msg.textContent =
                (featureName ? featureName : 'This feature') +
                ' is a Premium feature. Upgrade to unlock it.';
        }
        overlay.hidden = false;
    }

    function checkPremiumAccess(featureName) {
        if (!isPremiumUser()) {
            showUpgradeModal(featureName || 'Premium feature');
            return false;
        }
        return true;
    }

    function upgradeToPremium() {
        var user = getCurrentUserFresh();
        if (!user) return false;
        user.subscriptionStatus = 'premium';
        user.subscriptionDate = new Date().toISOString();

        var users = getUsers();
        users = users.map(function (u) {
            return u.id === user.id ? user : u;
        });
        saveUsers(users);
        setCurrentUser(user);
        if (window.Storage && Storage.addNotification) {
            Storage.addNotification({
                userId: user.id,
                message: 'Subscription upgraded: Premium activated.'
            });
        }
        if (window.AccountifyNav) AccountifyNav.refreshNotifications();
        return true;
    }

    function downgradeToFree() {
        var user = getCurrentUserFresh();
        if (!user) return false;
        user.subscriptionStatus = 'free';
        user.subscriptionDate = null;
        var users = getUsers();
        users = users.map(function (u) {
            return u.id === user.id ? user : u;
        });
        saveUsers(users);
        setCurrentUser(user);
        return true;
    }

    function applyPremiumLocks() {
        var premiumEls = document.querySelectorAll('[data-premium]');
        if (!premiumEls.length) return;
        var premium = isPremiumUser();

        premiumEls.forEach(function (el) {
            var lockText = el.getAttribute('data-premium-lock') || '🔒';
            el.classList.toggle('premium-locked', !premium);
            if (el.tagName === 'BUTTON' || el.tagName === 'A') {
                if (!premium) {
                    el.setAttribute('aria-disabled', 'true');
                    if (el.tagName === 'BUTTON') el.disabled = true;
                    if (!el.dataset.lockApplied) {
                        el.dataset.lockApplied = '1';
                        el.innerHTML = lockText + ' ' + el.innerHTML;
                    }
                } else {
                    el.removeAttribute('aria-disabled');
                    if (el.tagName === 'BUTTON') el.disabled = false;
                }
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        // Validate & normalize on every page load
        getCurrentUserFresh();
        applyPremiumLocks();
    });

    // Global API required by spec
    window.checkPremiumAccess = checkPremiumAccess;

    // Also expose minimal helpers for internal usage
    window.AccolySubscription = {
        isPremiumUser: isPremiumUser,
        upgradeToPremium: upgradeToPremium,
        downgradeToFree: downgradeToFree,
        applyPremiumLocks: applyPremiumLocks,
        getCurrentUserFresh: getCurrentUserFresh
    };
})();

