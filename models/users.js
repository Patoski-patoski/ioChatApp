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
    friends: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        status: { type: String, enum: ['pending', 'accepted'], default: 'pending' },
        roomCode: { type: String }
    }],
}, {timestamps: true});

const messageSchema = new mongoose.Schema({
    room: String,
    name: String,
    text: String,
    time: String,
    timestamp: Date
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
export const Message = mongoose.model('Message', messageSchema);

