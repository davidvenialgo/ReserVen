// Función para verificar si hay una sesión activa
function checkSession() {
    console.log('[Auth] Iniciando verificación de sesión');
    const sessionRaw = localStorage.getItem('userSession');
    console.log('[Auth] Session RAW:', sessionRaw);
    
    if (!sessionRaw) {
        // Agregar parámetro de redirección
        const currentPage = window.location.pathname.split('/').pop();
        window.location.href = `login.html?redirect=${encodeURIComponent(currentPage)}`;
        return;
    }

    try {
        const session = JSON.parse(sessionRaw);
        const now = new Date().getTime();
        
        if (now > session.expiresAt) {
            localStorage.removeItem('userSession');
            window.location.href = 'login.html?reason=session_expired';
            return;
        }
        
        // Actualizar solo si quedan menos de 2 horas
        if (session.expiresAt - now < 2 * 60 * 60 * 1000) {
            session.expiresAt = now + (8 * 60 * 60 * 1000);
            localStorage.setItem('userSession', JSON.stringify(session));
        }
        
    } catch (e) {
        console.error('Error verificando sesión:', e);
        localStorage.removeItem('userSession');
        window.location.href = 'login.html?reason=invalid_session';
    }
}

// Ejecutar la verificación al cargar la página
document.addEventListener('DOMContentLoaded', checkSession);

// En su lugar, agregar este nuevo evento:
window.addEventListener('pagehide', (event) => {
    console.log('[Auth] Evento pagehide - persisted:', event.persisted);
    if (event.persisted) {
        // La página se está guardando para posible reutilización (como en el cache de navegación)
        return;
    }
    
    const sessionRaw = localStorage.getItem('userSession');
    if (sessionRaw) {
        const session = JSON.parse(sessionRaw);
        if (!session.keepLoggedIn) {
            localStorage.removeItem('userSession');
        }
    }
});