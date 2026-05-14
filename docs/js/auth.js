// ============================================
// AUTHENTICATION LOGIC — Supabase edition
// ============================================
// Depends on: supabase-client.js loaded before this file

// Inject loading overlay immediately — before DOMContentLoaded
(function () {
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

ddocument.addEventListener('DOMContentLoaded', function () {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    var isAuthPage = currentPage.includes('login') ||
                     currentPage.includes('signup') ||
                     currentPage === 'index.html';
    var isProtectedPage = !isAuthPage && currentPage !== '';

    // Skip auth check if we just signed up or logged in
    if (sessionStorage.getItem('just-authed')) {
        sessionStorage.removeItem('just-authed');
        removeOverlay();
        if (session) {
            SupabaseClient.getProfile(session.user.id).then(function (profile) {
                if (profile) Storage.setCurrentUser(profile);
            });
        }
        return;
    }

    SupabaseClient.getSession().then(function (session) {
        if (session && isAuthPage && currentPage !== 'index.html') {
            window.location.replace('dashboard.html');
            return;
        }
        if (!session && isProtectedPage) {
            window.location.replace('login.html');
            return;
        }
        removeOverlay();
        if (session) {
            SupabaseClient.getProfile(session.user.id).then(function (profile) {
                if (profile) Storage.setCurrentUser(profile);
            });
        }
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
    }).catch(function () {
        removeOverlay();
    });
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
        if (profile) Storage.setCurrentUser(profile);
       sessionStorage.setItem('just-signed-up', '1');
        setTimeout(function () { window.location.replace('dashboard.html'); }, 500);
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

    // Validation
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
            // Email confirmation required
            showError(errorDiv, 'Check your email to confirm your account, then login.');
            return;
        }

        const profile = await SupabaseClient.getProfile(session.user.id);
        if (profile) Storage.setCurrentUser(profile);
        setTimeout(function () { window.location.replace('dashboard.html'); }, 500);
    } catch (err) {
        console.error('Signup error:', err);
        showError(errorDiv, 'Registration failed. Please try again.');
    }
}

// Called from sidebar logout buttons
async function logout() {
    await SupabaseClient.signOut();
    Storage.logout();
    window.location.href = 'login.html';
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