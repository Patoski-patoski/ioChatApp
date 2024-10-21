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
    const username = document.getElementById('friend-username').value;

    try {
        const response = await fetch('/add_friend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username }),
        });
        const data = await response.json();
        if (response.ok) {
            console.log('Friend found:', data.message);
            window.location.href = `/rooms?friendUsername=${encodeURI(data.username)}`;
        } else {
            console.error('Friend search failed:', data.error);
            document.getElementById('error-message').textContent = data.error;
        }
    } catch {
        console.error('Friend search error:', error);
        document.getElementById('error-message').textContent = 'An error occurred. Please try again.';
    }
}

document.querySelector('.add-friend-form').addEventListener('submit', verifyFriend);