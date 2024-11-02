/* /public/javascripts/add_friend.js */

async function checkAuth() {
    try {
        const response = await fetch('/users/auth-status');
        const data = await response.json();
        if (data.isAuthenticated) {
            console.log(data);
        } else {
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        window.location.href = '/login';
    }
}
checkAuth();

async function verifyFriend(event) {
    event.preventDefault();
    const successText = document.getElementById('success-message');
    const errorText = document.getElementById('error-message');
    const username = document.getElementById('friend-username').value;

    try {
        const response = await fetch('/add_friend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ username }),
        });
   
        const data = await response.json();
        if (response.ok) {
            errorText.textContent = '';
            successText.textContent = data.message;
            setTimeout(() => {
                window.location.href = '/rooms';
            }, 2500);
        } else {
            errorText.textContent = data.error;
        }
    } catch {
        errorText.textContent = 'An error occurred. Please try again.';
    }
}

document.querySelector('.add-friend-form').addEventListener('submit', verifyFriend);