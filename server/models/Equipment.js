const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    description: { type: String, default: '' },
    category: { type: String, required: true, trim: true },
    pricePerDay: { type: Number, required: true, min: 0 },
    location: { type: String, default: '' },
    imageEmoji: { type: String, default: '🛠️' },
    totalQuantity: { type: Number, default: 1, min: 1 },
    availableStock: { type: Number, default: 1, min: 0 },
    available: { type: Boolean, default: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Equipment', equipmentSchema);
