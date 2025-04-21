// Horas disponibles (base)
const hours = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00',
    '22:00', '23:00'
];

// Variable para almacenar temporalmente el bookingId a cancelar
let currentBookingId = null;

// Función para mostrar el modal de notificación
function showNotification(message, type) {
    const modalContent = document.getElementById('notificationModalContent');
    const modalHeader = document.getElementById('notificationModalHeader');
    const modalLabel = document.getElementById('notificationModalLabel');
    const modalBody = document.getElementById('notificationModalBody');

    // Configurar el estilo y contenido del modal según el tipo (éxito o error)
    modalContent.classList.remove('success', 'error');
    modalHeader.classList.remove('success', 'error');
    if (type === 'success') {
        modalContent.classList.add('success');
        modalHeader.classList.add('success');
        modalLabel.textContent = '¡Éxito!';
    } else {
        modalContent.classList.add('error');
        modalHeader.classList.add('error');
        modalLabel.textContent = 'Error';
    }
    modalBody.textContent = message;

    // Mostrar el modal
    const notificationModal = new bootstrap.Modal(document.getElementById('notificationModal'));
    notificationModal.show();
}

// Función para generar un ID único para cada reserva
function generateBookingId() {
    return 'booking-' + Math.random().toString(36).substr(2, 9);
}

// Función para formatear el número de teléfono mientras se escribe
function formatPhoneNumber(input) {
    let digits = input.value.replace(/\D/g, '');
    if (digits.length > 10) {
        digits = digits.substring(0, 10);
    }
    let formatted = '';
    if (digits.length > 0) {
        formatted = `(${digits.substring(0, 4)}`;
        if (digits.length >= 4) {
            formatted += ') - ';
        }
        if (digits.length >= 4) {
            formatted += digits.substring(4, 7);
        }
        if (digits.length >= 7) {
            formatted += ' - ';
        }
        if (digits.length >= 7) {
            formatted += digits.substring(7, 10);
        }
    }
    input.value = formatted;
}

// Función para validar teléfono
function validatePhone(phone) {
    const cleanedPhone = phone.replace(/[()\s-]/g, '');
    const re = /^[0-9]{10}$/;
    return re.test(cleanedPhone);
}

// Función para obtener la fecha actual en formato YYYY-MM-DD
function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

// Función para verificar si una reserva ya pasó
function isBookingPast(bookingDate, bookingTime) {
    const now = new Date();
    const bookingDateTime = new Date(`${bookingDate}T${bookingTime}:00`);
    return now > bookingDateTime;
}

// Función para abrir el modal de cancelación
function cancelBooking(bookingId) {
    currentBookingId = bookingId;
    const cancelModal = new bootstrap.Modal(document.getElementById('cancelReasonModal'));
    cancelModal.show();
}

// Configurar el botón de confirmación del modal de cancelación
document.getElementById('confirmCancelButton').addEventListener('click', async () => {
    const reason = document.getElementById('cancelReason').value;
    const cancellationReason = reason.trim() ? reason.trim() : 'No se especificó motivo';

    if (currentBookingId) {
        try {
            const response = await fetch(`/api/bookings/cancel/${currentBookingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cancellationReason })
            });

            const data = await response.json();
            if (data.success) {
                updateTimeOptions();
                updateCalendar();
                updateBookingsList();
            } else {
                showNotification('Error al cancelar la reserva', 'error');
            }
        } catch (error) {
            showNotification('Error al cancelar la reserva', 'error');
            console.error('Error:', error);
        }
    }

    // Limpiar el campo y cerrar el modal
    document.getElementById('cancelReason').value = '';
    const cancelModal = bootstrap.Modal.getInstance(document.getElementById('cancelReasonModal'));
    cancelModal.hide();
});

// Limpiar el campo cuando se cierra el modal de cancelación sin confirmar
document.getElementById('cancelReasonModal').addEventListener('hidden.bs.modal', () => {
    document.getElementById('cancelReason').value = '';
    currentBookingId = null;
});

// Función para obtener las reservas desde el backend
async function fetchBookings() {
    try {
        const response = await fetch('/api/bookings');
        return await response.json();
    } catch (error) {
        console.error('Error al obtener reservas:', error);
        return [];
    }
}

// Función para actualizar las opciones de hora en el dropdown
async function updateTimeOptions() {
    const court = document.getElementById('court').value;
    const date = document.getElementById('date').value;
    const timeSelect = document.getElementById('time');

    timeSelect.innerHTML = '<option value="">Seleccione una hora</option>';

    if (!court || !date) return;

    const bookings = await fetchBookings();
    const bookedTimes = bookings
        .filter(booking => booking.court === court && booking.date === date && booking.status !== 'Cancelado')
        .map(booking => booking.time);

    hours.forEach(hour => {
        if (!bookedTimes.includes(hour)) {
            const option = document.createElement('option');
            option.value = hour;
            option.textContent = hour;
            timeSelect.appendChild(option);
        }
    });
}

// Función para reservar una cancha
async function bookCourt() {
    const court = document.getElementById('court').value;
    let date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    const hoursNum = parseInt(document.getElementById('hours').value);
    const name = document.getElementById('name').value;
    const surname = document.getElementById('surname').value;
    const phone = document.getElementById('phone').value;
    const payment = document.getElementById('payment').value;

    // Validaciones
    if (!court || !date || !time || !hoursNum || !name || !surname || !phone || !payment) {
        showNotification('Por favor, complete todos los campos.', 'error');
        return;
    }

    if (!validatePhone(phone)) {
        showNotification('El número de teléfono debe tener 10 dígitos en el formato (0991) - 123 - 123.', 'error');
        return;
    }

    // Normalizar formato de fecha
    date = new Date(date).toISOString().split('T')[0];

    // Verificar si la fecha y hora están en el pasado
    if (isBookingPast(date, time)) {
        showNotification('No se pueden hacer reservas para un horario anterior al actual.', 'error');
        return;
    }

    const bookings = await fetchBookings();
    const [startHour, startMinute] = time.split(':').map(Number);
    let conflict = false;

    for (let i = 0; i < hoursNum; i++) {
        const checkHour = `${(startHour + i).toString().padStart(2, '0')}:00`;
        if (!hours.includes(checkHour)) {
            showNotification('La hora solicitada excede el horario disponible.', 'error');
            return;
        }
        const isBooked = bookings.some(booking =>
            booking.court === court &&
            booking.date === date &&
            booking.time === checkHour &&
            booking.status !== 'Cancelado'
        );
        if (isBooked) {
            conflict = true;
            break;
        }
    }

    if (conflict) {
        showNotification('El horario seleccionado ya está reservado.', 'error');
        return;
    }

    const bookingId = generateBookingId();
    const newBookings = [];
    for (let i = 0; i < hoursNum; i++) {
        const bookingTime = `${(startHour + i).toString().padStart(2, '0')}:00`;
        const booking = {
            court,
            date,
            time: bookingTime,
            name,
            surname,
            phone,
            payment,
            status: 'Confirmada',
            bookingId,
            cancellationReason: null
        };
        newBookings.push(booking);

        // Enviar al backend
        await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(booking)
        });
    }

    // Limpiar formulario
    document.getElementById('court').value = '';
    document.getElementById('date').value = getTodayDate();
    document.getElementById('time').value = '';
    document.getElementById('hours').value = '1';
    document.getElementById('name').value = '';
    document.getElementById('surname').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('payment').value = '';

    // Mostrar mensaje de éxito
    showNotification('¡Reservado Exitosamente!', 'success');

    updateTimeOptions();
    updateCalendar();
    updateBookingsList();
}

// Función para actualizar el calendario
async function updateCalendar() {
    const court = document.getElementById('calendar-court').value;
    const date = document.getElementById('calendar-date').value;
    const calendar = document.getElementById('calendar');

    if (!date) return;

    calendar.innerHTML = '';

    const bookings = await fetchBookings();
    hours.forEach(hour => {
        const header = document.createElement('div');
        const isBooked = bookings.some(booking =>
            booking.court === court &&
            booking.date === date &&
            booking.time === hour &&
            booking.status !== 'Cancelado'
        );
        header.className = 'header' + (isBooked ? ' booked' : ' available');
        header.textContent = `${hour}`;
        calendar.appendChild(header);
    });
}

// Función para actualizar la lista de reservas
async function updateBookingsList() {
    const bookingsList = document.getElementById('bookings-list');
    let filterDate = document.getElementById('calendar-date').value || getTodayDate();

    // Normalizar formato de fecha para el filtro
    filterDate = new Date(filterDate).toISOString().split('T')[0];

    const bookings = await fetchBookings();
    const filteredBookings = bookings.filter(booking => booking.date === filterDate);

    bookingsList.innerHTML = '';

    // Agrupar reservas por bookingId
    const groupedBookings = {};
    filteredBookings.forEach(booking => {
        if (!groupedBookings[booking.bookingId]) {
            groupedBookings[booking.bookingId] = [];
        }
        groupedBookings[booking.bookingId].push(booking);
    });

    // Convertir grupos en una lista ordenada por hora de inicio
    const bookingGroups = Object.values(groupedBookings).sort((a, b) => a[0].time.localeCompare(b[0].time));

    bookingGroups.forEach(group => {
        const firstBooking = group[0];
        const lastBooking = group[group.length - 1];
        const isCanceled = firstBooking.status === 'Cancelado';
        const isPast = isBookingPast(firstBooking.date, firstBooking.time);

        // Calcular el rango de tiempo (hora de inicio - hora de fin)
        const startTime = firstBooking.time;
        const endHour = parseInt(lastBooking.time.split(':')[0], 10) + 1;
        const endTime = `${endHour.toString().padStart(2, '0')}:00`;
        const timeRange = `${startTime} - ${endTime}`;

        const item = document.createElement('div');
        item.className = 'booking-item' + (isPast ? ' completed' : '') + (isCanceled ? ' canceled' : '');
        const status = isPast ? 'Completada' : firstBooking.status;

        const bookingDetails = document.createElement('div');
        let detailsHTML = `
            <strong>Cancha:</strong> ${firstBooking.court}<br>
            <strong>Fecha:</strong> ${firstBooking.date}<br>
            <strong>Horario:</strong> ${timeRange}<br>
            <strong>Cliente:</strong> ${firstBooking.name} ${firstBooking.surname}<br>
            <strong>Teléfono:</strong> ${firstBooking.phone}<br>
            <strong>Pago:</strong> ${firstBooking.payment}<br>
            <strong>Estado:</strong> ${status}
        `;
        if (isCanceled && firstBooking.cancellationReason) {
            detailsHTML += `<br><strong>Motivo de Cancelación:</strong> ${firstBooking.cancellationReason}`;
        }

        bookingDetails.innerHTML = detailsHTML;
        item.appendChild(bookingDetails);

        if (status === 'Confirmada' && !isPast) {
            const cancelButton = document.createElement('button');
            cancelButton.className = 'btn-cancel';
            cancelButton.textContent = 'Cancelar';
            cancelButton.onclick = () => cancelBooking(firstBooking.bookingId);
            item.appendChild(cancelButton);
        }

        bookingsList.appendChild(item);
    });
}

// Inicializar campos y vistas
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('date').value = getTodayDate();
    document.getElementById('calendar-date').value = getTodayDate();

    document.getElementById('date').setAttribute('min', getTodayDate());
    document.getElementById('calendar-date').setAttribute('min', getTodayDate());

    updateTimeOptions();
    updateCalendar();
    updateBookingsList();

    setInterval(updateBookingsList, 60000);
});