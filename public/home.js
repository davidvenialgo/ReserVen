// Función para cerrar sesión
function logout() {
    // Limpiar el indicador de sesión en localStorage
    localStorage.removeItem('userSession');
    // Redirigir a la página de login
    window.location.href = 'login.html';
}