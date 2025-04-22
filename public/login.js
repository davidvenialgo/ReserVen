// Función para mostrar notificaciones usando el modal
function showNotification(title, message, type = 'success') {
    const modalContent = document.getElementById('notificationModalContent');
    const modalHeader = document.getElementById('notificationModalHeader');
    const modalTitle = document.getElementById('notificationModalLabel');
    const modalBody = document.getElementById('notificationModalBody');

    // Estilo según el tipo de notificación
    modalContent.className = 'modal-content';
    modalHeader.className = 'modal-header';
    if (type === 'success') {
        modalContent.classList.add('border-success');
        modalHeader.classList.add('bg-success', 'text-white');
    } else if (type === 'error') {
        modalContent.classList.add('border-danger');
        modalHeader.classList.add('bg-danger', 'text-white');
    }

    modalTitle.textContent = title;
    modalBody.textContent = message;

    const modal = new bootstrap.Modal(document.getElementById('notificationModal'));
    modal.show();
}

// Función para manejar el login
async function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Validación de campos vacíos
    if (username === '' || password === '') {
        showNotification('¡Faltan datos!', '¡No tan rápido! Por favor, completa todos los campos para continuar. 😊', 'error');
        return;
    }

    try {
        console.log('Enviando:', JSON.stringify({ username, password }));
        const API_URL = 'https://reser-ven.vercel.app';
        // Enviar las credenciales al backend
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            // Lee el texto para mostrar un mensaje de error claro
            const mensaje = await response.text();
            showNotification('Error HTTP ' + response.status, mensaje, 'error');
            return;
        }

        const data = await response.json();

        if (data.success) {
            // Almacenar sesión con timestamp
            const sessionData = {
                username: data.username,
                loggedInAt: new Date().getTime(),
                // Tiempo de expiración (8 horas)
                expiresAt: new Date().getTime() + (8 * 60 * 60 * 1000)
            };
            
            localStorage.setItem('userSession', JSON.stringify(sessionData));
            
            // Redirección inteligente
            const urlParams = new URLSearchParams(window.location.search);
            const redirect = urlParams.get('redirect') || 'home.html';
            window.location.href = redirect;
        } else {
            showNotification('Algo salió mal', data.message || 'Oops, parece que el usuario o la contraseña no coinciden. ¿Probamos de nuevo? 🤔', 'error');
        }
    } catch (error) {
        showNotification('Error', 'Hubo un problema al intentar iniciar sesión. Por favor, intenta de nuevo.', 'error');
        console.error('Error en la autenticación:', error);
    }
}

// Archivo público para manejar sesiones
function checkSession() {
    const sessionData = JSON.parse(localStorage.getItem('userSession') || '{}');
    console.log("[Auth] Verificando sesión:", sessionData);
    
    // Si no hay sesión, redirigir al login
    if (!sessionData.username) {
        return false;
    }
    
    // Verificar si la sesión ha expirado
    if (sessionData.expiresAt && sessionData.expiresAt < new Date().getTime()) {
        console.log("[Auth] Sesión expirada");
        localStorage.removeItem('userSession');
        return false;
    }
    
    // Verificar la sesión con el servidor
    fetch('/api/auth/validate-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: sessionData.username })
    })
    .then(response => response.json())
    .then(data => {
        if (!data.valid) {
            console.log("[Auth] Sesión inválida según servidor");
            localStorage.removeItem('userSession');
            window.location.href = '/login.html';
        }
    });
    
    return true;
}

// Borrar todas las sesiones
function clearAllSessions() {
    localStorage.removeItem('userSession');
    console.log("[Auth] Todas las sesiones eliminadas");
    window.location.href = '/login.html';
}