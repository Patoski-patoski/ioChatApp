// public/javascripts/chat.js

// Initialize socket connection
const socket = io();

const msgInput = document.getElementById('message');
const nameInput = document.getElementById('name');
const chatRoom = document.getElementById('room');

const activity = document.querySelector('.activity');
const usersList = document.querySelector('.user-list');
const roomList = document.querySelector('.room-list');
const chatDisplay = document.querySelector('.chat-display');

const currentUser = sessionStorage.getItem('currentUser');
nameInput.value.toLowerCase().trim()

// Add these functions at the beginning of chat.js
const MAX_RECENT_ROOMS = 5;

// also modifies the existing enterRoom function to save recent rooms
function enterRoom(e) {
    e.preventDefault();
    if (nameInput.value && chatRoom.value) {
        sessionStorage.setItem('roomcode', chatRoom.value);
        roomList.textContent += chatRoom.value;
        chatDisplay.value = '';

        // Save to recent rooms
        saveRecentRoom(nameInput.value, chatRoom.value);

        socket.emit('enterRoom', {
            friendName: nameInput.value,
            room: chatRoom.value,
            currentUser,
        });
    }
}

function loadRoom() {
    const savedRoom = sessionStorage.getItem('roomcode');
    if (savedRoom) {
        chatRoom.value = savedRoom;
        roomList.textContent += chatRoom.value;
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
    console.log(nameInput.value);
    console.log(msgInput.value);
    console.log(chatRoom.value);
    if (nameInput.value && msgInput.value && chatRoom.value) {
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
    chatRoom.value = roomCode;
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
chatRoom.addEventListener('keypress', () => {
    nameInput.value = '';
});

msgInput.addEventListener('keypress', () => {
    socket.emit('activity', nameInput.value);
});

socket.on("message", (data) => {
    activity.textContent = '';
    displayMessage(data);
});

// Listen for messages 
function displayMessage(data) {
    const { name, text, time } = data;
    console.log('displaymessage name', name);
    console.log('displaymessae text', text);
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
socket.on("activity", (name) => {
    activity.textContent = `${name} is typing...`

    // Clear after 5 seconds 
    clearTimeout(activityTimer)
    activityTimer = setTimeout(() => {
        activity.textContent = ""
    }, 5000)
})

socket.on('userList', ({ users }) => {
    showUsers(users)
})

function showUsers(users) {
    usersList.textContent = '';
    if (users) {
        usersList.innerHTML = `<em>Conversation in '${chatRoom.value}' between </em>`;
        let count = 0;
        users.forEach((user, i) => {
            if (i == 0) {
                usersList.innerHTML += user.name;
            } else {
                usersList.innerHTML += ' and ' + user.name;
            }
        })
    }
}
