const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // Tomar token del header
    const authHeader = req.header('Authorization');

    // Validar si existe el token en el formato "Bearer <token>"
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Acceso denegado, token no provisto o con formato incorrecto' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verificar el token
        const secret = process.env.JWT_SECRET || 'tasa_secret_key_app';
        const decoded = jwt.verify(token, secret);

        // Agregar los datos del usuario decodificados al objeto req
        req.user = decoded;
        next();
    } catch (err) {
        console.error('[-] Error verificando JWT:', err.message);
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
};

module.exports = authMiddleware;
