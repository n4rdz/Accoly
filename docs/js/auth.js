// ============================================
// AUTHENTICATION LOGIC — Supabase edition
// ============================================
// Depends on: supabase-client.js loaded before this file

(function () {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    var isAuthPage = currentPage.includes('login') ||
                     currentPage.includes('signup') ||
                     currentPage === 'index.html';
    if (isAuthPage) return;
    var overlay = document.createElement('div');
    overlay.id = 'auth-overlay';
    overlay.style.cssText = [
        'position:fixed', 'inset:0', 'z-index:99999',
        'background:#f8fafc', 'display:flex',
        'align-items:center', 'justify-content:center',
        'font-family:sans-serif', 'font-size:1rem',
        'color:#64748b'
    ].join(';');
    overlay.textContent = 'Loading...';
    document.documentElement.appendChild(overlay);
})();

function removeOverlay() {
    var el = document.getElementById('auth-overlay');
    if (el) el.remove();
}

function profileFromSession(session) {
    var u = session.user;
    var meta = (u.user_metadata) || {};
    var fullName = meta.full_name || meta.name || (u.email ? u.email.split('@')[0] : 'Student');
    return {
        id: u.id,
        fullName: fullName,
        email: u.email || '',
        role: 'basic',
        subscriptionStatus: 'free',
        subscriptionDate: null,
        createdAt: u.created_at || new Date().toISOString(),
        password: ''
    };
}

var _profileLoadPromise = null;
var _authReadyUserId = null;

function fireAuthReadyOnce() {
    var user = Storage.getCurrentUser();
    var uid = user && user.id;
    if (window.__authReady && _authReadyUserId === uid) return;
    _authReadyUserId = uid || null;
    window.__authReady = true;
    window.dispatchEvent(new Event('authReady'));
    removeOverlay();
}

function resetAuthReadyState() {
    _profileLoadPromise = null;
    _authReadyUserId = null;
    window.__authReady = false;
}

function clearStaleAuthAndRedirect(isProtectedPage) {
    resetAuthReadyState();
    Storage.logout();
    if (typeof clearSupabaseAuthStorage === 'function') clearSupabaseAuthStorage();
    var done = function () {
        if (isProtectedPage) {
            window.location.replace('login.html');
        } else {
            fireAuthReadyOnce();
        }
    };
    if (window._sb && _sb.auth) {
        _sb.auth.signOut({ scope: 'local' }).then(done).catch(done);
    } else {
        done();
    }
}

function loadProfileAndReady(session) {
    if (!session || !session.user) return Promise.resolve();
    if (_profileLoadPromise) return _profileLoadPromise;

    _profileLoadPromise = SupabaseClient.getProfile(session.user.id).then(function (profile) {
        var resolved_profile = profile || profileFromSession(session);
        Storage.setCurrentUser(resolved_profile);
        if (!profile) {
            _sb.from('profiles').upsert({
                id: session.user.id,
                full_name: resolved_profile.fullName,
                email: resolved_profile.email,
                role: 'basic',
                subscription_status: 'free',
                created_at: resolved_profile.createdAt
            }).then(function () {}).catch(function () {});
        }
        fireAuthReadyOnce();
    }).catch(function () {
        Storage.setCurrentUser(profileFromSession(session));
        fireAuthReadyOnce();
    });

    return _profileLoadPromise;
}

window.__authReady = false;

(function () {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    var isAuthPage = currentPage.includes('login') ||
                     currentPage.includes('signup') ||
                     currentPage === 'index.html';
    var isProtectedPage = !isAuthPage && currentPage !== '';

    var resolved = false;

    function finishWithSession(session) {
        if (!session) return;
        if (isAuthPage && currentPage !== 'index.html') {
            window.location.replace('dashboard.html');
            return;
        }
        loadProfileAndReady(session);
    }

    function finishSignedOut() {
        if (isProtectedPage) {
            clearStaleAuthAndRedirect(true);
        } else {
            fireAuthReadyOnce();
        }
    }

    _sb.auth.getSession().then(function (result) {
        if (resolved) return;

        var err = result && result.error;
        if (err && isInvalidRefreshTokenError(err)) {
            resolved = true;
            clearStaleAuthAndRedirect(isProtectedPage);
            return;
        }

        var session = result && result.data && result.data.session;
        if (!session) return;

        return _sb.auth.getUser().then(function (userResult) {
            if (resolved) return;
            var userErr = userResult && userResult.error;
            if (userErr && isInvalidRefreshTokenError(userErr)) {
                resolved = true;
                clearStaleAuthAndRedirect(isProtectedPage);
                return;
            }
            if (userResult && userResult.data && userResult.data.user) {
                resolved = true;
                finishWithSession(session);
            }
        });
    }).catch(function (err) {
        if (isInvalidRefreshTokenError(err)) {
            resolved = true;
            clearStaleAuthAndRedirect(isProtectedPage);
        }
    });

    _sb.auth.onAuthStateChange(function (event, session) {
        if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
            if (isProtectedPage) {
                clearStaleAuthAndRedirect(true);
            } else {
                resetAuthReadyState();
                Storage.logout();
                fireAuthReadyOnce();
            }
            return;
        }

        if (resolved) return;
        if (!session && event === 'INITIAL_SESSION') return;

        resolved = true;

        if (session) {
            finishWithSession(session);
        } else {
            finishSignedOut();
        }
    });

    setTimeout(function () {
        if (!resolved) {
            resolved = true;
            if (isProtectedPage) {
                window.location.replace('login.html');
            } else {
                fireAuthReadyOnce();
            }
        }
    }, 4000);
})();

document.addEventListener('DOMContentLoaded', function () {
    var loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            handleLogin();
        });
    }
    var signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', function (e) {
            e.preventDefault();
            handleSignup();
        });
    }
});

async function handleLogin() {
    clearFieldErrors();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('error-message');

    if (!email || !password) {
        showError(errorDiv, 'Email and password are required.');
        return;
    }

    try {
        resetAuthReadyState();
        const { session, error } = await SupabaseClient.signIn(email, password);
        if (error) {
            if (isInvalidRefreshTokenError(error)) {
                clearStaleAuthAndRedirect(false);
            }
            if (error.message && error.message.toLowerCase().includes('invalid')) {
                showError(errorDiv, 'Incorrect email or password.');
                setFieldError('password', 'Incorrect email or password.');
            } else {
                showError(errorDiv, error.message || 'Login failed. Please try again.');
            }
            return;
        }
        const profile = await SupabaseClient.getProfile(session.user.id);
        Storage.setCurrentUser(profile || profileFromSession(session));
        window.location.replace('dashboard.html');
    } catch (err) {
        console.error('Login error:', err);
        showError(errorDiv, 'Login failed. Please try again.');
    }
}

async function handleSignup() {
    clearFieldErrors();
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorDiv = document.getElementById('error-message');

    if (!fullName || !email || !password || !confirmPassword) {
        showError(errorDiv, 'All fields are required.');
        if (!fullName) setFieldError('fullName', 'Full name is required.');
        if (!email) setFieldError('email', 'Email is required.');
        if (!password) setFieldError('password', 'Password is required.');
        if (!confirmPassword) setFieldError('confirmPassword', 'Confirm your password.');
        return;
    }

    if (password.length < 8) {
        setFieldError('password', 'Password must be at least 8 characters.');
        showError(errorDiv, 'Password must be at least 8 characters.');
        return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        setFieldError('password', 'Password must contain uppercase, lowercase, and number.');
        showError(errorDiv, 'Password must contain uppercase, lowercase, and number.');
        return;
    }

    if (password !== confirmPassword) {
        setFieldError('confirmPassword', 'Passwords do not match.');
        showError(errorDiv, 'Passwords do not match.');
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setFieldError('email', 'Please enter a valid email address.');
        showError(errorDiv, 'Please enter a valid email address.');
        return;
    }

    try {
        resetAuthReadyState();
        const { session, error } = await SupabaseClient.signUp(email, password, fullName);

        if (error) {
            showError(errorDiv, error.message || 'Registration failed. Please try again.');
            return;
        }

        if (!session) {
            showError(errorDiv, 'Check your email to confirm your account, then login.');
            return;
        }

        const profile = await SupabaseClient.getProfile(session.user.id);
        Storage.setCurrentUser(profile || profileFromSession(session));
        window.location.replace('dashboard.html');
    } catch (err) {
        console.error('Signup error:', err);
        showError(errorDiv, 'Registration failed. Please try again.');
    }
}

async function logout() {
    resetAuthReadyState();
    await SupabaseClient.signOut();
    Storage.logout();
    window.location.replace('login.html');
}

function showError(errorDiv, message) {
    if (!errorDiv) return;
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(function () { errorDiv.style.display = 'none'; }, 5000);
}

function clearFieldErrors() {
    document.querySelectorAll('.field-error').forEach(function (el) { el.textContent = ''; });
    document.querySelectorAll('.input-invalid').forEach(function (el) { el.classList.remove('input-invalid'); });
}

function setFieldError(fieldId, message) {
    var input = document.getElementById(fieldId);
    if (input) input.classList.add('input-invalid');
    var err = document.getElementById(fieldId + 'Error');
    if (err) err.textContent = message;
}
