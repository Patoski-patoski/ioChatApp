/* /public/javascripts/login.js */

async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

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
            console.log('Login successful:');
            window.location.href = `/add_friend?username=${encodeURI(data.username)}`;
        } else {
            console.error('Login failed:', data.error);
            document.getElementById('error-message').textContent = data.error;
        }
    } catch (error) {
        console.error('Login error:', error);
        document.getElementById('error-message').textContent = 'An error occurred. Please try again.';
    }
}
document.querySelector('.login-form').addEventListener('submit', handleLogin);