/**
 * Role-based access control middleware.
 * Usage: router.delete('/...', auth, role(['admin']), handler)
 */
const role = (allowedRoles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
            error: `Access denied. Required role: ${allowedRoles.join(' or ')}.`,
        });
    }
    next();
};

module.exports = role;
