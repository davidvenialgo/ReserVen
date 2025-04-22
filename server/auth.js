delete require.cache[require.resolve('dotenv')];
require('dotenv').config({ path: './.env', override: true });
console.log("Contenido directo del .env:", require('fs').readFileSync('./.env', 'utf8'));

const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const user = process.env.username;
const password = process.env.password;

// Simulación de una base de datos de usuarios
const users = [
    {
        username: user,
        password: password
    }
];

// Agregar esta función después de la definición de users
function validateSession(session) {
    console.log("[Auth] Validando sesión:", session);
    // Verificar si el usuario de la sesión existe en la base de datos actual
    return users.some(u => u.username === session.username);
}

router.use(express.json()); // Middleware para parsear JSON

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log('Intento de login recibido:', { username, password });
        console.log('Credenciales almacenadas:', {
            envUser: process.env.username,
            envPass: process.env.password
        });
        
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

console.log("Usuario cargado:", process.env.username);
console.log("Contraseña cargada:", process.env.password);

// Agregar este endpoint después del endpoint de login
router.post('/validate-session', (req, res) => {
    const { username } = req.body;
    console.log("[Auth] Validando sesión para:", username);
    
    // Verificar si el usuario existe en la base de datos actual
    const valid = users.some(u => u.username === username);
    console.log("[Auth] ¿Sesión válida?:", valid);
    
    res.json({ valid });
});

// Puedes agregar este código en un archivo session.js
function clearSessions() {
    localStorage.removeItem('userSession');
    console.log("[Auth] Sesiones eliminadas");
    return true;
}

module.exports = router;