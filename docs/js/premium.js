(function () {
    function getCurrentUserSafe() {
        return window.Storage ? Storage.getCurrentUser() : null;
    }

    function isPremiumUser() {
        var user = getCurrentUserSafe();
        if (window.AccolySubscription) return AccolySubscription.isPremiumUser();
        return !!(user && user.isPremium === true);
    }

    function requirePremium(feature) {
        if (window.checkPremiumAccess) return checkPremiumAccess(feature || 'Premium feature');
        if (!isPremiumUser()) {
            window.alert((feature || 'This') + ' is a Premium feature.');
            return false;
        }
        return true;
    }

    function upgradeToPremium() {
        if (window.AccolySubscription) return AccolySubscription.upgradeToPremium();
        var user = getCurrentUserSafe();
        if (!user) return false;
        user.isPremium = true;
        Storage.updateUser(user);
        Storage.setCurrentUser(user);
        Storage.addNotification({ userId: user.id, message: 'Welcome to Premium! Unlocking features now.' });
        if (window.AccountifyNav) AccountifyNav.refreshNotifications();
        return true;
    }

    function downgradeToBasic() {
        if (window.AccolySubscription) return AccolySubscription.downgradeToFree();
        var user = getCurrentUserSafe();
        if (!user) return false;
        user.isPremium = false;
        Storage.updateUser(user);
        Storage.setCurrentUser(user);
        return true;
    }

    window.AccolyPremium = {
        isPremiumUser: isPremiumUser,
        requirePremium: requirePremium,
        upgradeToPremium: upgradeToPremium,
        downgradeToBasic: downgradeToBasic
    };

    window.isPremiumUser = isPremiumUser;
    window.requirePremium = requirePremium;
})();

