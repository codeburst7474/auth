function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(pageId).classList.remove('hidden');
}

const isLocalFile = window.location.protocol === 'file:';
const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const API_BASE = (isLocalFile || (isLocalHost && window.location.port !== '3000'))
    ? 'http://localhost:3000'
    : '';

async function parseJsonSafe(res) {
    try {
        return await res.json();
    } catch (error) {
        return null;
    }
}

function setupPasswordToggles() {
    document.querySelectorAll('.toggle-password').forEach((btn) => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const isHidden = input.type === 'password';
            input.type = isHidden ? 'text' : 'password';
            btn.classList.toggle('is-visible', isHidden);
            btn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
        });
    });
}

// Handle Registration
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const password = document.getElementById('reg-password').value;

    if (!username || !email || !phone || !password) {
        alert('Please fill all fields');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, phone, password })
        });

        const data = await parseJsonSafe(res);
        if (res.ok) {
            alert('Registration successful! OTP sent to email and phone.');
            document.getElementById('verify-email').value = email;
            document.getElementById('verify-phone').value = phone;
            showPage('verify-page');
        } else {
            alert((data && data.message) || `Registration failed (${res.status})`);
        }
    } catch (err) {
        console.error('Register error:', err);
        alert('Server error. Check backend console.');
    }
});

// Handle OTP Verification
document.getElementById('verify-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('verify-email').value.trim();
    const phone = document.getElementById('verify-phone').value.trim();
    const emailOtp = document.getElementById('verify-email-otp').value.trim();
    const phoneOtp = document.getElementById('verify-phone-otp').value.trim();

    if (emailOtp.length !== 6 || phoneOtp.length !== 6) {
        alert('Enter 6-digit OTPs');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, phone, emailOtp, phoneOtp })
        });

        const data = await parseJsonSafe(res);
        if (res.ok) {
            alert('Verification successful! Please login.');
            showPage('login-page');
            document.getElementById('login-email').value = email;
            document.getElementById('login-password').focus();
        } else {
            alert((data && data.message) || `Verification failed (${res.status})`);
        }
    } catch (err) {
        console.error('Verify error:', err);
        alert('Server error. Check backend console.');
    }
});

// Resend OTP
document.getElementById('resend-otp').addEventListener('click', async () => {
    const email = document.getElementById('verify-email').value.trim();
    const phone = document.getElementById('verify-phone').value.trim();

    try {
        const res = await fetch(`${API_BASE}/api/auth/resend-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, phone })
        });
        const data = await parseJsonSafe(res);
        if (res.ok) {
            alert(data.message || 'OTP resent');
        } else {
            alert((data && data.message) || `Resend failed (${res.status})`);
        }
    } catch (err) {
        console.error('Resend error:', err);
        alert('Server error. Check backend console.');
    }
});

// Handle Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await parseJsonSafe(res);
        if (res.ok) {
            localStorage.setItem('user', JSON.stringify(data.user));
            document.getElementById('display-name').innerText = data.user.username;
            showPage('home-page');
        } else {
            alert((data && data.message) || `Login failed (${res.status})`);
        }
    } catch (err) {
        console.error('Login error:', err);
        alert('Server error. Check backend console.');
    }
});

function logout() {
    localStorage.removeItem('user');
    showPage('login-page');
}

// Auto-login check
window.onload = () => {
    setupPasswordToggles();
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        document.getElementById('display-name').innerText = user.username;
        showPage('home-page');
    }
};
