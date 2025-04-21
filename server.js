const express = require('express');
const authRouter = require('./auth');
const app = express();

// Middlewares esenciales
app.use(express.json({
    verify: (req, res, buf) => {
        try {
            JSON.parse(buf);
        } catch (e) {
            res.status(400).json({ error: 'JSON malformado' });
            throw new Error('Invalid JSON');
        }
    }
}));
app.use(express.urlencoded({ extended: true }));

// CORS más preciso
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5500');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
});

// Rutas
app.use('/api/auth', authRouter);

app.listen(3000, () => console.log('Servidor en puerto 3000')); 