import { HTTP_STATUS } from '../public/javascripts/constants.js';

export default function isAuthenticated(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    res.status(HTTP_STATUS.UNAUTHORIZED).json({error: 'Not authenticated'});
}