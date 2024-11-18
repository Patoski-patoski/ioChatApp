import { HTTP_STATUS } from '../public/javascripts/constants.js';

export function validateSignupInput(req, res, next) {
    const { username, email, sex, password, confirm_password } = req.body;
    
    if (!username || !email || !sex || !password || !confirm_password) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json(
            { error: ' Missing required fields' });
    }

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();
    const trimmedEmail = email.trim();
    const trimmedConfirmPassword = confirm_password;

    if (typeof trimmedUsername !== 'string' || trimmedUsername.length < 3 || trimmedUsername.length > 25) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json(
            { error: 'Invalid username format' });
    }

    if (typeof trimmedPassword !== 'string' || trimmedPassword.length < 6 || trimmedPassword.length > 25) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json(
            { error: 'Invalid password format' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Invalid email format' });
    }

    if (trimmedConfirmPassword !== trimmedPassword) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json(
            { error: 'Passwords do not match' });
    }

    if (!['male', 'female', 'other'].includes(sex)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json(
            { error: 'Invalid sex value' });
    }

    // Assign trimmed values back to req.body
    req.body.username = trimmedUsername;
    req.body.password = trimmedPassword;
    req.body.email = trimmedEmail;
    req.body.confirm_password = trimmedConfirmPassword;

    next();
}

export function validateLoginInput(req, res, next) {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json(
            { error: 'Missing required fields' });
    }

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (typeof trimmedUsername !== 'string' || trimmedUsername.length < 3 || trimmedUsername.length > 50) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json(
            { error: 'Invalid username format' });
    }

    if (typeof trimmedPassword !== 'string' || trimmedPassword.length < 6 || trimmedPassword.length > 100) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json(
            { error: 'Invalid password format' });
    }

    // Assign trimmed values back to req.body
    req.body.username = trimmedUsername;
    req.body.password = trimmedPassword;

    next();
}