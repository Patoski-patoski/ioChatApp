// models/users.js

import mongoose from 'mongoose';

// User Schema

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        minlength: [3, 'Username must be at least 3 characters'],
        unique: true,
        trim: true,
        lowercase: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        match: [/.+\@.+\..+/, 'Please enter a valid email'],
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6, 
    },
    sex: {
        type: String,
        required: true
    },
    id: String,
    friends: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        status: { type: String, enum: ['pending', 'accepted'], default: 'pending' },
        roomCode: { type: String }
    }],
});

const messageSchema = new mongoose.Schema({
    room: String,
    name: String,
    text: String,
    time: String,
    timestamp: Date
});

const sessionUserSchema = new mongoose.Schema({
    id: String,
    username: String,
    room: String
});


export const SessionUser = mongoose.model('SessionUser', sessionUserSchema);
export const User = mongoose.model('User', userSchema);
export const Message = mongoose.model('Message', messageSchema);

