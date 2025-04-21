const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const user = process.env.username;
const password = process.env.password;

// Simulación de una base de datos de usuarios
const users = [
    {
        username: `${user}`,
        password: `${password}` // Contraseña en texto plano
    }
];

router.use(express.json()); // Middleware para parsear JSON

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = users.find(u => u.username === username);
        
        if (!user) {
            return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
        }

        // Comparación directa sin bcrypt
        if (password === user.password) {
            res.json({ success: true, username: user.username });
        } else {
            res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;