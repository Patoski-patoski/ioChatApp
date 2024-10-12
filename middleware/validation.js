// middleware/validation.js
import { HTTP_STATUS } from '../public/javascripts/constants.js';

export function validateSignupInput(req, res, next) {
    const { username, sex, password, confirm_password } = req.body;

    if (!username || !sex || !password) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Missing required fields' });
    }

    if (typeof username !== 'string' || username.length < 3) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Username must be a string with at least 3 characters' });
    }

    if (typeof password !== 'string' || password.length < 6) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Password must be a string with at least 6 characters' });
    }

    if (confirm_password !== password) {
        return res.status(HTTP_STATUS.CONFLICT).json({ error: "Password does not match" });
    }

    if (sex !== 'male' && sex !== 'female' && sex !== 'other') {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Sex must be either "male", "female", or "other"' });
    }
    next();
}
export function validateLoginInput(req, res, next) {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Missing required fields' });
    }

    if (typeof username !== 'string' || username.length < 3) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Username must be a string with at least 3 characters' });
    }

    if (typeof password !== 'string' || password.length < 6) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Password must be a string with at least 6 characters' });
    }
    next();
}