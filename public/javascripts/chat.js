// public/javascripts/chat.js

const socket = io();

const msgInput = document.getElementById('message');
const nameInput = document.getElementById('name');
const chatRoom = document.getElementById('room-list');

const activity = document.querySelector('.activity');
const usersList = document.querySelector('.user-list');
const chatDisplay = document.querySelector('.chat-display');

const currentUser = sessionStorage.getItem('currentUser');
nameInput.value.toLowerCase().trim()

// Add these functions at the beginning of chat.js
const MAX_RECENT_ROOMS = 5;

// also modifies the existing enterRoom function to save recent rooms
function enterRoom(e) {
    if (nameInput.value && chatRoom.innerText) {
        sessionStorage.setItem('roomcode', chatRoom.innerText);
        chatDisplay.innerText = '';

        // Save to recent rooms
        saveRecentRoom(nameInput.value, chatRoom.innerText);

        socket.emit('enterRoom', {
            friendName: nameInput.value,
            room: chatRoom.innerText,
            currentUser,
        });
    }
}

function loadRoom() {
    sessionStorage.setItem('roomcode', chatRoom.innerText);
    const savedRoom = sessionStorage.getItem('roomcode');
    if (savedRoom) {
        chatRoom.innerText = savedRoom;
        chatDisplay.innerHTML = '';
        socket.emit('enterRoom', {
            friendName: nameInput.value,
            room: savedRoom,
            currentUser
        });
    }
    msgInput.focus();
}

function sendMessage(e) {
    e.preventDefault();
    if (nameInput.value && msgInput.value && chatRoom.innerText) {
        socket.emit('message', {
            friendName: nameInput.value,
            currentUser,
            text: msgInput.value
        })
        msgInput.value = "";
    }
    msgInput.focus();
}

function saveRecentRoom(name, roomCode) {
    let recentRooms = JSON.parse(localStorage.getItem('recentRooms') || '[]');

    // Remove if already exists
    recentRooms = recentRooms.filter(room => room.code !== roomCode);

    // Add new room at the beginning
    recentRooms.unshift({
        name: name,
        code: roomCode,
        timestamp: new Date().toISOString()
    });

    // Keep only the most recent rooms
    recentRooms = recentRooms.slice(0, MAX_RECENT_ROOMS);

    localStorage.setItem('recentRooms', JSON.stringify(recentRooms));
    displayRecentRooms();
}

function displayRecentRooms() {
    const recentRoomsList = document.querySelector('.recent-rooms-list');
    const recentRooms = JSON.parse(localStorage.getItem('recentRooms') || '[]');

    recentRoomsList.innerHTML = recentRooms.map(room => `
        <div class="recent-room-item" data-code="${room.code}" data-name="${room.name}">
            <span>${room.name} - ${room.code}</span>
            <button class="remove-room-btn" data-code="${room.code}">×</button>
        </div>
    `).join('');

    // Add click handlers using event delegation
    recentRoomsList.addEventListener('click', handleRecentRoomsClick);
}

function handleRecentRoomsClick(event) {
    const target = event.target;

    // Handle remove button click
    if (target.classList.contains('remove-room-btn')) {
        const roomCode = target.dataset.code;
        removeRecentRoom(roomCode);
        return;
    }

    // Handle room item click
    const roomItem = target.closest('.recent-room-item');
    if (roomItem && !target.classList.contains('remove-room-btn')) {
        const code = roomItem.dataset.code;
        const name = roomItem.dataset.name;
        rejoinRoom(code, name);
    }
}

function removeRecentRoom(roomCode) {
    let recentRooms = JSON.parse(localStorage.getItem('recentRooms') || '[]');
    recentRooms = recentRooms.filter(room => room.code !== roomCode);
    localStorage.setItem('recentRooms', JSON.stringify(recentRooms));
    displayRecentRooms();
}

function rejoinRoom(roomCode, friendName) {
    nameInput.value = friendName;
    chatRoom.innerText = roomCode;
    document.querySelector('.form-join').dispatchEvent(new Event('submit'));
}


// Clean up event listeners when needed
function cleanupRecentRoomsListeners() {
    const recentRoomsList = document.querySelector('.recent-rooms-list');
    recentRoomsList.removeEventListener('click', handleRecentRoomsClick);
}

window.addEventListener('load', () => {
    loadRoom();
    displayRecentRooms();
});


document.querySelector('.form-msg').addEventListener('submit', sendMessage);
document.querySelector('.form-join').addEventListener('submit', enterRoom);

chatRoom.addEventListener('input', () => {
    nameInput.value = '';
});

msgInput.addEventListener('keydown', () => {
    socket.emit('activity', nameInput.value);
});
msgInput.addEventListener('input', () => {
    socket.emit('activity', nameInput.value);
});

socket.on("message", (data) => {
    activity.textContent = '';
    displayMessage(data);
});

socket.on('connect', () => {
    socket.emit('register', currentUser);
});

socket.on('newFriendRequest', ({ from }) => {
    displayFriendRequest(from);
});

function displayFriendRequest(from) {
    const notification = document.createElement('div');
    notification.className = 'friend-request-notification';
    notification.innerHTML = `
        <p>You have a new friend request from ${from}</p>
        <button class="accept-btn">Accept</button>
        <button class="decline-btn">Decline</button>
    `;
    document.body.appendChild(notification);

    notification.querySelector('.accept-btn').addEventListener('click', () => {
        socket.emit('acceptFriendRequest', { from, to: currentUser });
        notification.remove();
    });

    notification.querySelector('.decline-btn').addEventListener('click', () => {
        notification.remove();
    });
}

// Listen for messages 
function displayMessage(data) {
    const { name, text, time } = data;
    const li = document.createElement('li');
    li.className = 'post';

    // Admin messages centered
    if (name === 'Admin') {
        li.classList.add('post--admin');
        li.innerHTML = `<div class="post__text">${text}</div>`;
    }
    // Messages from "You" (current user) aligned to the right
    else if (name === currentUser) {
        li.classList.add('post--you');
        li.innerHTML = `<div class="post__header">
      <span class="post__header--time"><span style="font-weight: bold;">You   </span> ${time}</span>
    </div>
    <div class="post__text">${text}</div>`;
    }
    // Messages from other users aligned to the left
    else {
        li.classList.add('post--others');
        li.innerHTML = `<div class="post__header">
      <span class="post__header--name">${name}
      <span class="post__header--time">${time} </span></span>
    </div>
    <div class="post__text">${text}</div>`;
    }

    // Append the message to the chat display and scroll to the bottom
    document.querySelector('.chat-display').appendChild(li);
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
}

// Listen for chat history
socket.on('chatHistory', (messages) => {
    chatDisplay.innerHTML = '';
    messages.forEach(displayMessage);
});

let activityTimer;
socket.on("activity", () => {
    activity.textContent = `${nameInput.value} is typing...`

    // Clear after 5 seconds 
    clearTimeout(activityTimer)
    activityTimer = setTimeout(() => {
        activity.textContent = "";
    }, 5000)
})