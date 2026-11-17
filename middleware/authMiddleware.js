
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        console.error('JWT_SECRET belum dikonfigurasi');

        return res.status(500).json({
            status: 'error',
            message: 'Konfigurasi autentikasi server belum tersedia'
        });
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            status: 'error',
            message: 'Akses ditolak. Token Bearer tidak disediakan.'
        });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
        return res.status(401).json({
            status: 'error',
            message: 'Token tidak disediakan.'
        });
    }

    try {
        const decoded = jwt.verify(token, secret, {
            algorithms: ['HS256']
        });

        if (!decoded.id_nik) {
            return res.status(403).json({
                status: 'error',
                message: 'Identitas pengguna dalam token tidak valid.'
            });
        }

        req.user = decoded;
        next();

    } catch (error) {
        return res.status(403).json({
            status: 'error',
            message: 'Token tidak valid atau kedaluwarsa.'
        });
    }
};
