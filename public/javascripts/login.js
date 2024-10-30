/* /public/javascripts/login.js */

async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorText = document.getElementById('error-message');

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();
        if (response.ok) {
            window.location.href = `/add_friend?username=${encodeURI(
                data.username)}`;
        } else {
            errorText.textContent = data.error;
        }
    } catch (error) {
        console.error('Login error:', error);
        errorText.textContent = 'An error occurred. Please try again.';
    }
}
document.querySelector('.login-form').addEventListener('submit', handleLogin);

async function handleLogout(event) {
    event.preventDefault();
    const errorText = document.getElementById('error-message');

    try {
        const response = await fetch('/logout', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();
        if (response.ok) {
            window.location.href = '/login';
        } else {
            errorText.textContent = data.message;
        }
    } catch (error) {
        console.error('Login error:', error);
        errorText.textContent = 'An error occurred. Please try again.';
    }   
}

document.querySelector('.logout-button').addEventListener('click', handleLogin);
