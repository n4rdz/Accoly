// ============================================
// Toast & shared UI helpers
// ============================================

(function () {
    var container;

    function ensureContainer() {
        if (container) return container;
        container = document.createElement('div');
        container.className = 'toast-container';
        container.setAttribute('aria-live', 'polite');
        document.body.appendChild(container);
        return container;
    }

    function toast(message, type) {
        type = type || 'success';
        ensureContainer();
        var el = document.createElement('div');
        el.className = 'toast toast-' + type;
        el.textContent = message;
        container.appendChild(el);
        requestAnimationFrame(function () {
            el.classList.add('toast-visible');
        });
        setTimeout(function () {
            el.classList.remove('toast-visible');
            setTimeout(function () {
                el.remove();
            }, 300);
        }, 3200);
    }

    window.AccountifyUI = {
        toast: toast,
        /** @returns {Promise<boolean>} */
        confirmDelete: function (message) {
            return new Promise(function (resolve) {
                var ok = window.confirm(message || 'Delete this item? This cannot be undone.');
                resolve(ok);
            });
        }
    };
})();
