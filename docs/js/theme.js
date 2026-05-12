// ============================================
// THEME (Light / Dark) — Settings integration
// ============================================

(function () {
    var KEY = 'accountifyTheme';

    function apply() {
        var t = localStorage.getItem(KEY) || 'light';
        if (t === 'auto') {
            t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        document.documentElement.setAttribute('data-theme', t === 'dark' ? 'dark' : 'light');
    }

    window.AccountifyTheme = {
        KEY: KEY,
        apply: apply,
        set: function (theme) {
            localStorage.setItem(KEY, theme);
            apply();
        },
        get: function () {
            return localStorage.getItem(KEY) || 'light';
        }
    };

    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
            if ((localStorage.getItem(KEY) || 'light') === 'auto') apply();
        });
    }

    apply();
})();
