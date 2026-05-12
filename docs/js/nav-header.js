// ============================================
// Top bar: user menu + notifications (all app pages)
// ============================================

(function () {
    var notifOpen = false;
    var userOpen = false;

    function $(id) {
        return document.getElementById(id);
    }

    function setExpanded(btn, open) {
        if (!btn) return;
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function closeNotif() {
        var panel = $('navNotifPanel');
        var btn = $('navNotifBtn');
        if (panel) {
            panel.classList.remove('nav-dropdown--open');
            panel.hidden = true;
        }
        setExpanded(btn, false);
        notifOpen = false;
    }

    function closeUser() {
        var panel = $('navUserPanel');
        var btn = $('navUserBtn');
        if (panel) {
            panel.classList.remove('nav-dropdown--open');
            panel.hidden = true;
        }
        setExpanded(btn, false);
        userOpen = false;
    }

    function closeAll() {
        closeNotif();
        closeUser();
    }

    function toggleNotif() {
        var user = Storage.getCurrentUser();
        var panel = $('navNotifPanel');
        var btn = $('navNotifBtn');
        if (!panel || !btn) return;

        if (notifOpen) {
            closeNotif();
            return;
        }
        closeUser();
        if (user) {
            Storage.markAllNotificationsRead(user.id);
            updateBadge();
        }
        renderNotifications();
        panel.hidden = false;
        requestAnimationFrame(function () {
            panel.classList.add('nav-dropdown--open');
        });
        setExpanded(btn, true);
        notifOpen = true;
    }

    function toggleUser() {
        var panel = $('navUserPanel');
        var btn = $('navUserBtn');
        if (!panel || !btn) return;

        if (userOpen) {
            closeUser();
            return;
        }
        closeNotif();
        panel.hidden = false;
        requestAnimationFrame(function () {
            panel.classList.add('nav-dropdown--open');
        });
        setExpanded(btn, true);
        userOpen = true;
    }

    function renderNotifications() {
        var listEl = $('navNotifList');
        if (!listEl) return;

        var user = Storage.getCurrentUser();
        if (!user) {
            listEl.innerHTML = '';
            return;
        }

        var items = Storage.getNotificationsForUser(user.id);

        if (items.length === 0) {
            listEl.innerHTML =
                '<li class="nav-dropdown-empty">No notifications</li>';
            return;
        }

        listEl.innerHTML = items
            .map(function (n) {
                var d = new Date(n.date);
                var timeStr = d.toLocaleString();
                var esc = function (s) {
                    var x = document.createElement('div');
                    x.textContent = s;
                    return x.innerHTML;
                };
                return (
                    '<li class="nav-notif-item">' +
                    '<span class="nav-notif-msg">' +
                    esc(n.message) +
                    '</span>' +
                    '<span class="nav-notif-date">' +
                    esc(timeStr) +
                    '</span>' +
                    '</li>'
                );
            })
            .join('');
    }

    function updateBadge() {
        var badge = $('navNotifBadge');
        var user = Storage.getCurrentUser();
        if (!badge || !user) return;
        var n = Storage.getUnreadNotificationCount(user.id);
        if (n > 0) {
            badge.textContent = n > 99 ? '99+' : String(n);
            badge.hidden = false;
        } else {
            badge.hidden = true;
        }
    }

    function fillUserChip() {
        var user = Storage.getCurrentUser();
        var av = $('navUserAvatar');
        var nm = $('navUserName');
        if (!user) return;
        var initials = user.fullName
            .split(' ')
            .map(function (x) {
                return x[0];
            })
            .join('')
            .toUpperCase()
            .slice(0, 2);
        if (av) av.textContent = initials || 'U';
        if (nm) nm.textContent = user.fullName;
    }

    function onLogout() {
        Storage.logout();
        window.location.href = 'login.html';
    }

    function onDocClick(e) {
        var shellNotif = document.querySelector('.dropdown-shell--notif');
        var shellUser = document.querySelector('.dropdown-shell--user');
        var sidebar = document.querySelector('.sidebar');
        var toggleBtn = document.getElementById('sidebarToggleBtn');
        if (shellNotif && shellNotif.contains(e.target)) return;
        if (shellUser && shellUser.contains(e.target)) return;
        if (sidebar && sidebar.contains(e.target)) return;
        if (toggleBtn && toggleBtn.contains(e.target)) return;
        document.body.classList.remove('sidebar-open');
        closeAll();
    }

    function onKey(e) {
        if (e.key === 'Escape') closeAll();
    }

    document.addEventListener('DOMContentLoaded', function () {
        var notifBtn = $('navNotifBtn');
        var userBtn = $('navUserBtn');
        var logoutBtn = $('navLogoutBtn');

        if (!notifBtn && !userBtn) return;

        var topBar = document.querySelector('.top-bar');
        if (topBar && !document.getElementById('sidebarToggleBtn')) {
            var toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.id = 'sidebarToggleBtn';
            toggle.className = 'sidebar-toggle';
            toggle.setAttribute('aria-label', 'Toggle sidebar');
            toggle.textContent = '☰';
            topBar.insertBefore(toggle, topBar.firstChild);
            toggle.addEventListener('click', function () {
                document.body.classList.toggle('sidebar-open');
            });
        }

        fillUserChip();
        updateBadge();
        renderNotifications();

        if (notifBtn) {
            notifBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                toggleNotif();
            });
        }

        if (userBtn) {
            userBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                toggleUser();
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', function () {
                onLogout();
            });
        }

        document.addEventListener('click', onDocClick);
        document.addEventListener('keydown', onKey);

        // Cross-tab / same-browser realtime refresh
        window.addEventListener('storage', function (e) {
            if (!e || !e.key) return;
            if (e.key === 'notifications' || e.key === 'currentUser') {
                fillUserChip();
                renderNotifications();
                updateBadge();
            }
        });
    });

    window.AccountifyNav = {
        refreshNotifications: function () {
            renderNotifications();
            updateBadge();
        },
        updateBadge: updateBadge
    };
})();
