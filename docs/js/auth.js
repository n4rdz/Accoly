// ============================================
// AUTHENTICATION LOGIC
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    Storage.sanitizeUsers();
    
    // Get current page name
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const isAuthPage = currentPage.includes('login') || currentPage.includes('signup') || currentPage === 'index.html';
    const isProtectedPage = !isAuthPage && currentPage !== '';
    
    const currentUser = Storage.getCurrentUser();
    
    // Redirect logic
    if (currentUser && isAuthPage && currentPage !== 'index.html') {
        // Logged in but on auth page, redirect to dashboard
        window.location.href = 'dashboard.html';
        return;
    } else if (!currentUser && isProtectedPage) {
        // Not logged in but trying to access protected page
        window.location.href = 'login.html';
        return;
    }
    
    // User is properly authenticated or on public page, continue

    // Handle login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLogin();
        });
    }

    // Handle signup form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
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

    // Find user
    const user = Storage.getUserByEmail(email);
    
    if (!user) {
        setFieldError('email', 'No account found for this email.');
        showError(errorDiv, 'User not found. Please check your email.');
        return;
    }

    // Verify password (support both legacy plaintext and new hashed passwords)
    let passwordValid = false;
    if (user.password.length === 64 && /^[a-f0-9]{64}$/i.test(user.password)) {
        // New hashed password
        passwordValid = await Storage.verifyPassword(password, user.password);
    } else {
        // Legacy plaintext password - migrate to hash
        passwordValid = user.password === password;
        if (passwordValid) {
            // Migrate to hashed password
            user.password = await Storage.hashPassword(password);
            Storage.updateUser(user);
        }
    }

    if (!passwordValid) {
        setFieldError('password', 'Incorrect password.');
        showError(errorDiv, 'Incorrect password. Please try again.');
        return;
    }

    // Migrate legacy premium flag (if any)
    if (user && user.subscriptionStatus !== 'free' && user.subscriptionStatus !== 'premium') {
        if (user.isPremium === true) {
            user.subscriptionStatus = 'premium';
            user.subscriptionDate = user.subscriptionDate || new Date().toISOString();
        } else {
            user.subscriptionStatus = 'free';
            user.subscriptionDate = null;
        }
        Storage.updateUser(user);
    }

    // Login successful
    Storage.setCurrentUser(user);
    window.location.href = 'dashboard.html';
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

    // Enhanced password validation
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

    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setFieldError('email', 'Please enter a valid email address.');
        showError(errorDiv, 'Please enter a valid email address.');
        return;
    }

    // Check if user already exists
    if (Storage.getUserByEmail(email)) {
        setFieldError('email', 'Email already registered.');
        showError(errorDiv, 'Email already registered. Please login instead.');
        return;
    }

    try {
        // Hash password
        const hashedPassword = await Storage.hashPassword(password);

        // Create new user
        const generatedId = (typeof crypto !== 'undefined' && crypto.randomUUID)
            ? crypto.randomUUID()
            : Date.now().toString() + '-' + Math.random().toString(36).slice(2, 8);
        const newUser = {
            id: generatedId,
            fullName,
            email,
            password: hashedPassword,
            role: "basic",
            subscriptionStatus: "free",
            subscriptionDate: null,
            createdAt: new Date().toISOString()
        };

        Storage.saveUser(newUser);
        Storage.setCurrentUser(newUser);
        
        // Initialize user stats
        let stats = JSON.parse(localStorage.getItem('userStats') || '{}');
        stats[newUser.id] = {
            totalQuizzes: 0,
            totalXP: 0,
            accuracyPercentage: 0,
            currentStreak: 0,
            bestScore: 0,
            level: 1,
            lastAttemptDate: null
        };
        localStorage.setItem('userStats', JSON.stringify(stats));

        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } catch (error) {
        showError(errorDiv, 'Registration failed. Please try again.');
        console.error('Signup error:', error);
    }
}

function showError(errorDiv, message) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function clearFieldErrors() {
    document.querySelectorAll('.field-error').forEach(function (el) {
        el.textContent = '';
    });
    document.querySelectorAll('.input-invalid').forEach(function (el) {
        el.classList.remove('input-invalid');
    });
}

function setFieldError(fieldId, message) {
    var input = document.getElementById(fieldId);
    if (input) input.classList.add('input-invalid');
    var err = document.getElementById(fieldId + 'Error');
    if (err) err.textContent = message;
}
