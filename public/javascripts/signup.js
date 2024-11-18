//  /public/javascripts/signup.js

async function handleSignup(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const sex = document.getElementById('sex').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirm_password = document.getElementById('confirm_password').value;

    try {
        const response = await fetch('/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password, email, sex, confirm_password }),
        });
        const data = await response.json();
        
        if (response.ok) {
            console.log('Signup successful:');
            window.location.href = '/login'
        } else {
            console.error('Login failed:', data.error);
            document.getElementById('error-message').textContent = data.error;
        }
    } catch (error) {
        console.error('Signup error:', error);
        document.getElementById('error-message').textContent = 'An error occurred. Please try again.';
    }
}
document.querySelector('.signup-form').addEventListener('submit', handleSignup);
