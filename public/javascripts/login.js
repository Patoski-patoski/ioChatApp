/* /public/javascripts/login.js */

async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value.toLowerCase();
    console.log(username);
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
        sessionStorage.setItem('currentUser', username);

        const data = await response.json();
        if (response.ok) {
            window.location.href = '/add_friend';
        } else {
            errorText.textContent = data.error;
        }
    } catch (error) {
        errorText.textContent = 'An error occurred. Please try again.';
    }
}
document.querySelector('.login-form').addEventListener('submit', handleLogin);