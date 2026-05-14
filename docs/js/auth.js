// ============================================
// AUTHENTICATION LOGIC — Supabase edition
// ============================================
// Depends on: supabase-client.js loaded before this file

// Inject loading overlay immediately — before DOMContentLoaded
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

// Build a minimal profile from the Supabase session when the profiles table
// row is missing (e.g. RLS blocked the upsert, or email not yet confirmed).
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

// Load profile from DB; fall back to session metadata if missing.
function loadProfileAndReady(session) {
    SupabaseClient.getProfile(session.user.id).then(function (profile) {
        var resolved_profile = profile || profileFromSession(session);
        Storage.setCurrentUser(resolved_profile);
        // If the profile row was missing, try to create it now in the background
        if (!profile) {
            _sb.from('profiles').upsert({
                id: session.user.id,
                full_name: resolved_profile.fullName,
                email: resolved_profile.email,
                role: 'basic',
                subscription_status: 'free',
                created_at: resolved_profile.createdAt
            }).then(function() {}).catch(function() {});
        }
        window.__authReady = true;
        window.dispatchEvent(new Event('authReady'));
        removeOverlay();
    }).catch(function () {
        var fallback = profileFromSession(session);
        Storage.setCurrentUser(fallback);
        window.__authReady = true;
        window.dispatchEvent(new Event('authReady'));
        removeOverlay();
    });
}

// Global flag so other scripts (dashboard.js, etc.) know auth is ready
window.__authReady = false;

// ── Core auth check — runs immediately, NOT inside DOMContentLoaded ──────────
// Supabase fires onAuthStateChange with (null session) first on some page loads
// before the real session token is read from storage. Putting this inside
// DOMContentLoaded made the race worse. Running it immediately gives Supabase
// the maximum time to resolve the session before the page JS tries to use it.
(function () {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    var isAuthPage = currentPage.includes('login') ||
                     currentPage.includes('signup') ||
                     currentPage === 'index.html';
    var isProtectedPage = !isAuthPage && currentPage !== '';

    var resolved = false;

    // Use getSession() first — it reads from localStorage synchronously and is
    // reliable. onAuthStateChange alone can fire INITIAL_SESSION with null on
    // the first tick, causing a false redirect before the token is verified.
    _sb.auth.getSession().then(function (result) {
        if (resolved) return;

        var session = result && result.data && result.data.session;

        if (session) {
            // Valid session — load profile then signal ready
            resolved = true;
            if (isAuthPage && currentPage !== 'index.html') {
                window.location.replace('dashboard.html');
                return;
            }
            loadProfileAndReady(session);
        } else {
            // No session from storage — wait briefly for onAuthStateChange
            // in case Supabase is still verifying a token (e.g. OAuth callback)
            // The timeout below acts as the final fallback.
        }
    }).catch(function () {
        // getSession failed — fall through to onAuthStateChange / timeout
    });

    // onAuthStateChange handles token refreshes and post-login events
    _sb.auth.onAuthStateChange(function (event, session) {
        if (resolved) return;

        // Ignore the very first INITIAL_SESSION null — getSession() above
        // already handled the no-session case more reliably.
        if (!session && event === 'INITIAL_SESSION') return;

        resolved = true;

        if (session) {
            if (isAuthPage && currentPage !== 'index.html') {
                window.location.replace('dashboard.html');
                return;
            }
            loadProfileAndReady(session);
        } else {
            if (isProtectedPage) {
                window.location.replace('login.html');
                return;
            }
            window.__authReady = true;
            window.dispatchEvent(new Event('authReady'));
            removeOverlay();
        }
    });

    // Safety fallback: if neither getSession nor onAuthStateChange resolve in 4s
    setTimeout(function () {
        if (!resolved) {
            resolved = true;
            if (isProtectedPage) {
                window.location.replace('login.html');
            } else {
                window.__authReady = true;
                window.dispatchEvent(new Event('authReady'));
                removeOverlay();
            }
        }
    }, 4000);
})();

// ── Bind login/signup forms after DOM is ready ───────────────────────────────
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
        const { session, error } = await SupabaseClient.signIn(email, password);
        if (error) {
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
        const { session, error } = await SupabaseClient.signUp(email, password, fullName);

        if (error) {
            if (error.message && error.message.toLowerCase().includes('already')) {
                setFieldError('email', 'Email already registered.');
                showError(errorDiv, 'Email already registered. Please login instead.');
            } else {
                showError(errorDiv, error.message || 'Registration failed. Please try again.');
            }
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

// Called from sidebar logout buttons
async function logout() {
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