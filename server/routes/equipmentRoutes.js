const express = require('express');
const Equipment = require('../models/Equipment');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { q = '', category } = req.query;
    const filters = {};

    if (q) {
      filters.$or = [
        { title: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }
    if (category && category !== 'All') filters.category = category;

    const items = await Equipment.find(filters)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });

    console.log('Fetching equipment from DB. Count:', items.length);
    return res.json(items);
  } catch (error) {
    const errorMsg = error.name === 'MongoServerSelectionError' ? 'Database connection failed' : 'Operation blocked';
    return res.status(500).json({ message: 'Failed to fetch equipment: ' + errorMsg, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const item = await Equipment.findById(req.params.id).populate('owner', 'name email');
    if (!item) return res.status(404).json({ message: 'Equipment not found' });
    return res.json(item);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch equipment', error: error.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const qty = Math.max(1, Number(req.body.totalQuantity) || 1);
    const item = await Equipment.create({
      ...req.body,
      owner: req.user.id,
      totalQuantity: qty,
      availableStock: qty,
    });
    return res.status(201).json(item);
  } catch (error) {
    return res.status(400).json({ message: 'Failed to create equipment', error: error.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const item = await Equipment.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Equipment not found' });
    if (String(item.owner) !== req.user.id) {
      return res.status(403).json({ message: 'Only owner can update listing' });
    }

    // Only allow updating safe fields
    const allowedFields = ['title', 'description', 'category', 'pricePerDay', 'location', 'imageEmoji'];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        item[field] = req.body[field];
      }
    }
    await item.save();
    return res.json(item);
  } catch (error) {
    return res.status(400).json({ message: 'Failed to update equipment', error: error.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const item = await Equipment.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Equipment not found' });
    if (String(item.owner) !== req.user.id) {
      return res.status(403).json({ message: 'Only owner can delete listing' });
    }

    await item.deleteOne();
    return res.json({ message: 'Equipment deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete equipment', error: error.message });
  }
});

module.exports = router;
