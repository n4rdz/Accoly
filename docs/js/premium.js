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
        return false;
    }

    function downgradeToBasic() {
        if (window.AccolySubscription) return AccolySubscription.downgradeToFree();
        return false;
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

