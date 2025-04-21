const express = require('express');
const router = express.Router();

// Simulación de una base de datos de reservas
let bookings = [];

router.get('/', (req, res) => {
    res.json(bookings);
});

router.post('/', (req, res) => {
    const booking = req.body;
    bookings.push(booking);
    res.status(201).json({ success: true, message: 'Reserva creada', booking });
});

router.put('/cancel/:bookingId', (req, res) => {
    const { bookingId } = req.params;
    const { cancellationReason } = req.body;

    const updatedBookings = bookings.map(booking => {
        if (booking.bookingId === bookingId) {
            return { ...booking, status: 'Cancelado', cancellationReason };
        }
        return booking;
    });

    bookings = updatedBookings;
    res.json({ success: true, message: 'Reserva cancelada' });
});

module.exports = router;