(function () {
    function normalizeUser(u) {
        if (!u) return u;
        if (u.subscriptionStatus !== 'free' && u.subscriptionStatus !== 'premium') {
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
        var raw = Storage.getCurrentUser();
        if (!raw || !raw.id) return null;
        return normalizeUser(Object.assign({}, raw));
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
            '<div class="upgrade-pill">Detailed quiz explanations</div>' +
            '<div class="upgrade-pill">Group chat</div>' +
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
            upgradeToPremium().finally(function () {
                window.location.reload();
            });
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
        var user = Storage.getCurrentUser();
        if (!user) return Promise.resolve(false);
        var when = new Date().toISOString();
        return SupabaseClient.updateProfile(user.id, {
            subscriptionStatus: 'premium',
            subscriptionDate: when
        }).then(function (ok) {
            if (!ok) return false;
            var next = Object.assign({}, user, {
                subscriptionStatus: 'premium',
                subscriptionDate: when
            });
            Storage.setCurrentUser(next);
            return SupabaseClient.addNotification({
                userId: user.id,
                message: 'Subscription upgraded: Premium activated.'
            }).then(function () {
                if (window.AccountifyNav) {
                    return AccountifyNav.refreshNotifications();
                }
            }).then(function () {
                return true;
            });
        });
    }

    function downgradeToFree() {
        var user = Storage.getCurrentUser();
        if (!user) return Promise.resolve(false);
        return SupabaseClient.updateProfile(user.id, {
            subscriptionStatus: 'free',
            subscriptionDate: null
        }).then(function (ok) {
            if (!ok) return false;
            var next = Object.assign({}, user, {
                subscriptionStatus: 'free',
                subscriptionDate: null
            });
            Storage.setCurrentUser(next);
            return true;
        });
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
        getCurrentUserFresh();
        applyPremiumLocks();
    });

    window.checkPremiumAccess = checkPremiumAccess;

    window.AccolySubscription = {
        isPremiumUser: isPremiumUser,
        upgradeToPremium: upgradeToPremium,
        downgradeToFree: downgradeToFree,
        applyPremiumLocks: applyPremiumLocks,
        getCurrentUserFresh: getCurrentUserFresh
    };
})();
