const express = require('express');
const Booking = require('../models/Booking');
const Equipment = require('../models/Equipment');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({ renter: req.user.id })
      .populate('equipment', 'title imageEmoji pricePerDay location')
      .populate('owner', 'name')
      .sort({ createdAt: -1 });
    return res.json(bookings);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch bookings', error: error.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { equipmentId, startDate, endDate } = req.body;
    if (!equipmentId || !startDate || !endDate) {
      return res.status(400).json({ message: 'equipmentId, startDate and endDate are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
    }
    if (end < start) {
      return res.status(400).json({ message: 'End date cannot be before start date' });
    }

    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    if (!equipment.available) {
      return res.status(400).json({ message: 'Equipment is currently unavailable' });
    }

    const msPerDay = 1000 * 60 * 60 * 24;
    const durationDays = Math.max(1, Math.ceil((end - start) / msPerDay));
    const totalPrice = durationDays * equipment.pricePerDay;

    // status is intentionally omitted — model default is 'confirmed' (instant booking)
    const booking = await Booking.create({
      equipment: equipment._id,
      renter: req.user.id,
      owner: equipment.owner,
      startDate: start,
      endDate: end,
      totalPrice,
    });

    // Mark equipment unavailable immediately so no one else can book it
    await Equipment.findByIdAndUpdate(equipment._id, { available: false });

    return res.status(201).json(booking);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create booking', error: error.message });
  }
});

module.exports = router;
