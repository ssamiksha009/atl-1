// Event listener for the login form submission
document.getElementById('loginForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    // Clear previous error messages
    errorMessage.textContent = '';

    // Basic client-side validation
    if (!email || !password) {
        errorMessage.textContent = 'Please enter both email and password';
        return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        errorMessage.textContent = 'Please enter a valid email address';
        return;
    }

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            // Store authentication token in localStorage
            localStorage.setItem('authToken', data.token);

            // Decode the JWT token to get user role
            const payload = JSON.parse(atob(data.token.split('.')[1]));

            // Redirect based on user role
            if (payload.role === 'manager') {
                window.location.href = 'manager-dashboard.html';
            } else {
                window.location.href = 'index.html';
            }
        } else {
            // Display error message
            errorMessage.textContent = data.message || 'Invalid email or password';
        }
    } catch (error) {
        console.error('Login error:', error);
        errorMessage.textContent = 'An error occurred during login. Please try again.';
    }
});

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault(); // <- prevents normal form navigation
    const email = (document.getElementById('email') || {}).value || '';
    const password = (document.getElementById('password') || {}).value || '';
    if (!email || !password) { alert('Email and password required'); return; }

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Login failed');
      if (!data.token) throw new Error('Invalid login response');

      // Persist auth and minimal profile for other pages
      localStorage.setItem('authToken', data.token);
      if (data.user?.email) localStorage.setItem('userEmail', data.user.email);
      if (data.user?.name) localStorage.setItem('userName', data.user.name);
      if (data.user?.role) localStorage.setItem('userRole', data.user.role);

      // Redirect based on role — ensure redirect happens even if something else tries to navigate
      const role = (data.user && data.user.role) || localStorage.getItem('userRole') || 'engineer';
      const target = (role.toLowerCase() === 'manager') ? '/manager-dashboard.html' : '/user-dashboard.html';

      // Primary redirect
      window.location.href = target;
      // Fallback if something prevents immediate navigation (ensures page leaves)
      setTimeout(() => { window.location.replace(target); }, 250);
    } catch (err) {
      console.error('Login error', err);
      alert(err.message || 'Login failed');
    }
  });
});

// Add to your login.js file
document.querySelector('.toggle-password').addEventListener('click', function () {
    const passwordInput = document.querySelector('#password');
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);

    // Toggle icon
    this.classList.toggle('fa-eye');
    this.classList.toggle('fa-eye-slash');
});