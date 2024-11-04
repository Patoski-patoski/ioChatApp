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

function sendMessage(e) {
    e.preventDefault()
    if (nameInput.value && msgInput.value && chatRoom.value) {
        socket.emit('message', {
            name: nameInput.value,
            text: msgInput.value
        })
        msgInput.value = "";
    }
    msgInput.focus();
}
function enterRoom(e) {
    e.preventDefault();
    if (nameInput.value && chatRoom.value) {
        // clear chat display before joining new room
        chatDisplay.innerHTML = '';
        socket.emit('enterRoom', {
            name: nameInput.value,
            room: chatRoom.value
        })
    }
}

document.querySelector('.form-msg')
    .addEventListener('submit', sendMessage)

document.querySelector('.form-join')
    .addEventListener('submit', enterRoom)

msgInput.addEventListener('keypress', () => {
    socket.emit('activity', nameInput.value)
})

socket.on("message", (data) => {
   activity.textContent = '';
    displayMessage(data);
});

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
    else if (name === nameInput.value) {
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

let activityTimer
socket.on("activity", (name) => {
    activity.textContent = `${name} is typing...`

    // Clear after 3 seconds 
    clearTimeout(activityTimer)
    activityTimer = setTimeout(() => {
        activity.textContent = ""
    }, 10000)
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
            console.log(user.name, i);
        })
    }
}
