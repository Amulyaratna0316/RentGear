console.log('📡 SERVER VERSION 7.0: OWNER DASHBOARD UPGRADE');

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const app = express();

// 1. CORS defined FIRST before routes
app.use(cors({ origin: '*' }));
app.use(express.json());

app.use((req, res, next) => { console.log('Incoming Request:', req.method, req.path); next(); });

const mongoURI = process.env.MONGO_URI || "mongodb+srv://admin:rentgear123@cluster0.itsirgq.mongodb.net/RentGear?retryWrites=true&w=majority";

mongoose.connect(mongoURI)
  .then(() => console.log('✅ Successfully connected to RentGear database inside standalone file'))
  .catch(err => console.log('❌ MongoDB Connection Error:', err.message));

// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────

app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const normalizedIdentifier = String(identifier || '').trim().toLowerCase();
    
    const user = await mongoose.connection.db.collection('users').findOne({
      $or: [{ email: normalizedIdentifier }, { username: normalizedIdentifier }],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, email: user.email, username: user.username, role: user.role }, process.env.JWT_SECRET || 'secret123', {
      expiresIn: '7d',
    });

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, username, email, password, role } = req.body;
    const normalizedUsername = String(username || '').trim().toLowerCase();
    const normalizedEmail = String(email || '').trim().toLowerCase();

    // ── Validation ──────────────────────────────────────────────────────────
    if (!name || !normalizedUsername || !normalizedEmail || !password) {
      return res.status(400).json({ message: 'Name, username, email and password are required' });
    }
    if (normalizedUsername.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters long' });
    }

    // ── Direct MongoDB duplicate checks (Bloom Filter bypassed) ─────────
    // const isAvailable = bloomFilter.check(normalizedUsername); // <--- BYPASSED — was causing false positives
    const existingEmail = await mongoose.connection.db.collection('users').findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    const existingUsername = await mongoose.connection.db.collection('users').findOne({ username: normalizedUsername });
    if (existingUsername) {
      return res.status(409).json({ message: 'Username already taken' });
    }

    // ── Create user ─────────────────────────────────────────────────────────
    const result = await mongoose.connection.db.collection('users').insertOne({
        name,
        username: normalizedUsername,
        email: normalizedEmail,
        password,
        role: role || 'customer',
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    
    const user = { _id: result.insertedId, name, username: normalizedUsername, email: normalizedEmail, role: role || 'customer' };

    const token = jwt.sign({ id: user._id, email: user.email, username: user.username, role: user.role }, process.env.JWT_SECRET || 'secret123', {
      expiresIn: '7d',
    });

    return res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
      return res.status(500).json({ message: 'Sign up failed', error: error.message });
  }
});

// ─── TEST ROUTE ───────────────────────────────────────────────────────────────

app.get('/api/test', (req, res) => {
  res.json({ status: 'ok', message: 'Backend connected to Cluster0' });
});

// ─── GET ALL EQUIPMENT ────────────────────────────────────────────────────────

app.get('/api/equipment', async (req, res) => {
  try {
    const items = await mongoose.connection.db.collection('equipment').find({}).toArray();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SEED ROUTE ───────────────────────────────────────────────────────────────

app.get('/api/force-seed', async (req, res) => {
  console.log('Seed route hit!');
  try {
    const owner = await mongoose.connection.db.collection('users').findOne({ role: 'owner' });
    const ownerId = owner ? String(owner._id) : 'mock-owner-id';

    const sampleData = [
      { name: 'Sony A7III', price: 850, unit: 'day', rating: 5, category: 'Cameras', imageEmoji: '📷', status: 'available', totalQuantity: 5, availableStock: 5, available: true, ownerId },
      { name: 'DJI Mavic 3', price: 120, unit: 'day', rating: 4.8, category: 'Drones', imageEmoji: '🚁', status: 'available', totalQuantity: 5, availableStock: 5, available: true, ownerId }
    ];
    await mongoose.connection.db.collection('equipment').deleteMany({});
    await mongoose.connection.db.collection('equipment').insertMany(sampleData);
    
    res.status(200).json({ message: 'SEED ROUTE ACTIVE V7 — with totalQuantity/availableStock' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CREATE EQUIPMENT (with totalQuantity) ────────────────────────────────────

app.post('/api/equipment', async (req, res) => {
  console.log('📥 Equipment Creation Route Hit! Data:', req.body);
  try {
    const { name, price, category, desc, ownerId, totalQuantity } = req.body;
    
    const emojiMap = {
      'Cameras': '📷',
      'Drones': '🚁',
      'Tools': '🛠️',
      'Generators': '⚡',
      'Excavators': '🏗️',
      'Heavy Machinery': '🏗️',
      'Construction': '🔧',
      'Power': '⚡',
      'Access Equipment': '🔝',
      'Other': '📦'
    };

    const qty = Math.max(1, Number(totalQuantity) || 1);

    const newEquipment = {
      name: name || 'Unnamed Equipment',
      price: price ? Number(price) : 0,
      category: category || 'Other',
      description: desc || '',
      ownerId: String(ownerId),
      status: 'available',
      available: true,
      totalQuantity: qty,
      availableStock: qty,
      rating: 5,
      imageEmoji: emojiMap[category] || '📦',
      image: 'https://placehold.co/400',
      createdAt: new Date()
    };

    const result = await mongoose.connection.db.collection('equipment').insertOne(newEquipment);
    console.log('✅ Equipment created with totalQuantity:', qty);
    res.status(201).json({ success: true, message: 'Equipment Created!', equipmentId: result.insertedId });
  } catch (err) {
    console.error('❌ Equipment Creation Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── UPDATE EQUIPMENT (Edit — ownership check) ───────────────────────────────

app.put('/api/equipment/:id', async (req, res) => {
  console.log('📝 Equipment Update Route Hit! ID:', req.params.id, 'Data:', req.body);
  try {
    const { ownerId, name, price, description, category } = req.body;

    if (!ownerId) {
      return res.status(400).json({ message: 'ownerId is required for ownership verification' });
    }

    const equipment = await mongoose.connection.db.collection('equipment').findOne({
      _id: new mongoose.Types.ObjectId(req.params.id)
    });

    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    // Ownership check
    if (String(equipment.ownerId) !== String(ownerId)) {
      return res.status(403).json({ message: 'Only the owner can edit this listing' });
    }

    // Build the $set object with only the fields that were sent
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (price !== undefined) updateFields.price = Number(price);
    if (description !== undefined) updateFields.description = description;
    if (category !== undefined) {
      updateFields.category = category;
      const emojiMap = {
        'Cameras': '📷', 'Drones': '🚁', 'Tools': '🛠️', 'Generators': '⚡',
        'Excavators': '🏗️', 'Heavy Machinery': '🏗️', 'Construction': '🔧',
        'Power': '⚡', 'Access Equipment': '🔝', 'Other': '📦'
      };
      updateFields.imageEmoji = emojiMap[category] || '📦';
    }
    updateFields.updatedAt = new Date();

    await mongoose.connection.db.collection('equipment').updateOne(
      { _id: new mongoose.Types.ObjectId(req.params.id) },
      { $set: updateFields }
    );

    const updated = await mongoose.connection.db.collection('equipment').findOne({
      _id: new mongoose.Types.ObjectId(req.params.id)
    });

    console.log('✅ Equipment updated:', req.params.id);
    res.json({ success: true, message: 'Equipment updated', equipment: updated });
  } catch (err) {
    console.error('❌ Equipment Update Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE EQUIPMENT (Remove — ownership check) ──────────────────────────────

app.delete('/api/equipment/:id', async (req, res) => {
  console.log('🗑️ Equipment Delete Route Hit! ID:', req.params.id);
  try {
    const { ownerId } = req.body || {};
    const ownerIdQuery = ownerId || req.query.ownerId;

    if (!ownerIdQuery) {
      return res.status(400).json({ message: 'ownerId is required for ownership verification' });
    }

    const equipment = await mongoose.connection.db.collection('equipment').findOne({
      _id: new mongoose.Types.ObjectId(req.params.id)
    });

    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    // Ownership check
    if (String(equipment.ownerId) !== String(ownerIdQuery)) {
      return res.status(403).json({ message: 'Only the owner can delete this listing' });
    }

    await mongoose.connection.db.collection('equipment').deleteOne({
      _id: new mongoose.Types.ObjectId(req.params.id)
    });

    console.log('✅ Equipment deleted:', req.params.id);
    res.json({ success: true, message: 'Equipment deleted' });
  } catch (err) {
    console.error('❌ Equipment Delete Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET BOOKINGS (with $lookup for renter names) ─────────────────────────────

app.get('/api/bookings', async (req, res) => {
  try {
    const { userId, ownerId } = req.query;

    // ── Owner path: use aggregation with $lookup to resolve renter names ──
    if (ownerId) {
      console.log(`[GET /api/bookings] Owner lookup for ownerId: ${ownerId}`);

      const pipeline = [
        { $match: { ownerId: String(ownerId) } },
        {
          $addFields: {
            userIdAsObjectId: {
              $cond: {
                if: { $regexMatch: { input: { $ifNull: ['$userId', ''] }, regex: /^[0-9a-fA-F]{24}$/ } },
                then: { $toObjectId: '$userId' },
                else: null
              }
            }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userIdAsObjectId',
            foreignField: '_id',
            as: 'renterDetails'
          }
        },
        {
          $addFields: {
            renterName: {
              $cond: {
                if: { $gt: [{ $size: '$renterDetails' }, 0] },
                then: { $arrayElemAt: ['$renterDetails.name', 0] },
                else: 'Customer'
              }
            }
          }
        },
        { $project: { renterDetails: 0, userIdAsObjectId: 0 } },
        { $sort: { createdAt: -1 } }
      ];

      const bookings = await mongoose.connection.db.collection('bookings').aggregate(pipeline).toArray();
      console.log(`[GET /api/bookings] Found ${bookings.length} booking(s) for owner ${ownerId}`);
      return res.json(bookings);
    }

    // ── Customer path: 3-collection aggregation pipeline ──
    // Step 1 → $match by userId
    // Step 2 → $lookup equipment details (name, emoji)
    // Step 3 → $unwind equipment (left-outer safe with preserveNullAndEmptyArrays)
    // Step 4 → $lookup owner name from users collection via equipment.ownerId
    // Step 5 → $project clean output
    console.log(`[GET /api/bookings] Customer aggregation for userId: ${userId}`);

    const customerPipeline = [
      { $match: { userId: String(userId) } },

      // ── Join equipment collection ──────────────────────────────────────────
      {
        $addFields: {
          equipmentObjId: {
            $cond: {
              if: { $regexMatch: { input: { $ifNull: ['$equipmentId', ''] }, regex: /^[0-9a-fA-F]{24}$/ } },
              then: { $toObjectId: '$equipmentId' },
              else: null,
            },
          },
        },
      },
      {
        $lookup: {
          from: 'equipment',
          localField: 'equipmentObjId',
          foreignField: '_id',
          as: 'equipmentDetails',
        },
      },
      {
        $unwind: {
          path: '$equipmentDetails',
          preserveNullAndEmptyArrays: true, // keep booking even if equipment was deleted
        },
      },

      // ── Join owner from users collection ──────────────────────────────────
      // ownerId can be stored as a string, so we convert it safely first
      {
        $addFields: {
          ownerObjId: {
            $cond: {
              if: {
                $regexMatch: {
                  input: { $ifNull: ['$equipmentDetails.ownerId', ''] },
                  regex: /^[0-9a-fA-F]{24}$/,
                },
              },
              then: { $toObjectId: '$equipmentDetails.ownerId' },
              else: null,
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'ownerObjId',
          foreignField: '_id',
          as: 'ownerDetails',
        },
      },
      {
        $unwind: {
          path: '$ownerDetails',
          preserveNullAndEmptyArrays: true,
        },
      },

      // ── Project clean output ───────────────────────────────────────────────
      {
        $project: {
          _id: 1,
          status: 1,
          startDate: 1,
          endDate: 1,
          totalPrice: 1,
          createdAt: 1,
          // Enriched fields
          equipmentName: { $ifNull: ['$equipmentDetails.name', { $ifNull: ['$equipmentName', 'Unknown Equipment'] }] },
          imageEmoji: { $ifNull: ['$equipmentDetails.imageEmoji', '🛠️'] },
          ownerName: { $ifNull: ['$ownerDetails.name', 'Verified Owner'] },
          // Keep raw ids for debugging
          equipmentId: 1,
          ownerId: 1,
          userId: 1,
        },
      },

      { $sort: { createdAt: -1 } },
    ];

    const items = await mongoose.connection.db
      .collection('bookings')
      .aggregate(customerPipeline)
      .toArray();

    console.log(`[GET /api/bookings] Found ${items.length} booking(s) for customer ${userId}`);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CREATE BOOKING (atomic stock decrement) ──────────────────────────────────

// This catches /api/booking AND /api/bookings
app.post(['/api/booking', '/api/bookings'], async (req, res) => {
  console.log('📥 Booking Route Hit! Data:', req.body);
  try {
    const { equipmentId, startDate, endDate, ...otherData } = req.body;
    
    const equipment = await mongoose.connection.db.collection('equipment').findOne({ _id: new mongoose.Types.ObjectId(equipmentId) });
    if (!equipment) return res.status(404).json({ error: 'Equipment not found' });

    // Check stock before proceeding
    const currentStock = equipment.availableStock !== undefined ? equipment.availableStock : (equipment.stock !== undefined ? equipment.stock : 1);
    if (currentStock <= 0) {
      return res.status(400).json({ error: 'Equipment is out of stock' });
    }

    // Atomic inventory decrement — prevents race conditions
    const updatedEq = await mongoose.connection.db.collection('equipment').findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(equipmentId),
        availableStock: { $gt: 0 }   // only decrement if stock > 0
      },
      { $inc: { availableStock: -1 } },
      { returnDocument: 'after' }
    );

    // Handle the case where findOneAndUpdate returns different shapes
    const updatedDoc = updatedEq?.value || updatedEq;

    if (!updatedDoc) {
      return res.status(400).json({ error: 'Equipment is no longer available (race condition prevented)' });
    }

    // If availableStock has reached 0, mark as unavailable
    if (updatedDoc.availableStock <= 0) {
      await mongoose.connection.db.collection('equipment').updateOne(
        { _id: new mongoose.Types.ObjectId(equipmentId) },
        { $set: { status: 'unavailable', available: false } }
      );
    }

    // Calculate price
    const start = new Date(startDate || Date.now());
    const end = new Date(endDate || Date.now());
    const msPerDay = 1000 * 60 * 60 * 24;
    const durationDays = Math.max(1, Math.ceil((end - start) / msPerDay));
    const totalPrice = durationDays * (equipment.price || equipment.pricePerDay || 0);

    // Insert booking
    const result = await mongoose.connection.db.collection('bookings').insertOne({
      equipmentId,
      equipmentName: otherData.equipmentName || equipment.name || equipment.title || 'Equipment',
      ownerId: equipment.ownerId || String(equipment.owner || ''),
      userId: otherData.userId ? String(otherData.userId) : undefined,
      startDate: start,
      endDate: end,
      totalPrice,
      ...otherData,
      status: 'confirmed',
      createdAt: new Date(),
    });

    console.log('✅ Booking confirmed for:', otherData.equipmentName || equipmentId, '| Remaining stock:', updatedDoc.availableStock);
    res.status(201).json({ success: true, message: 'Booking Successful!', bookingId: result.insertedId });
  } catch (err) {
    console.error('❌ Booking Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── OWNER EARNINGS AGGREGATION ───────────────────────────────────────────────

app.get('/api/owner/earnings', async (req, res) => {
  try {
    const { ownerId } = req.query;
    if (!ownerId) {
      return res.status(400).json({ message: 'ownerId query parameter is required' });
    }

    console.log(`[GET /api/owner/earnings] Aggregating for ownerId: ${ownerId}`);

    const pipeline = [
      { $match: { ownerId: String(ownerId) } },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: { $ifNull: ['$totalPrice', 0] } },
          totalRentals: { $sum: 1 }
        }
      }
    ];

    const result = await mongoose.connection.db.collection('bookings').aggregate(pipeline).toArray();

    const earnings = result.length > 0
      ? { totalEarnings: result[0].totalEarnings, totalRentals: result[0].totalRentals }
      : { totalEarnings: 0, totalRentals: 0 };

    console.log(`[GET /api/owner/earnings] Result:`, earnings);
    res.json(earnings);
  } catch (err) {
    console.error('❌ Earnings Aggregation Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── PER-ITEM EQUIPMENT EARNINGS AGGREGATION ──────────────────────────────────

app.get('/api/owner/equipment-earnings', async (req, res) => {
  try {
    const { ownerId } = req.query;
    if (!ownerId) {
      return res.status(400).json({ message: 'ownerId query parameter is required' });
    }

    console.log(`[GET /api/owner/equipment-earnings] Aggregating for ownerId: ${ownerId}`);

    const pipeline = [
      { $match: { ownerId: String(ownerId) } },
      {
        $group: {
          _id: '$equipmentId',
          totalEarned: { $sum: { $ifNull: ['$totalPrice', 0] } },
          rentalCount: { $sum: 1 }
        }
      }
    ];

    const result = await mongoose.connection.db.collection('bookings').aggregate(pipeline).toArray();

    // Transform from [{ _id: equipmentId, totalEarned, rentalCount }]
    // into a map for easy frontend lookup: { equipmentId: { totalEarned, rentalCount } }
    const earningsMap = {};
    for (const item of result) {
      earningsMap[item._id] = {
        totalEarned: item.totalEarned || 0,
        rentalCount: item.rentalCount || 0
      };
    }

    console.log(`[GET /api/owner/equipment-earnings] Found earnings for ${Object.keys(earningsMap).length} items`);
    res.json(earningsMap);
  } catch (err) {
    console.error('❌ Equipment Earnings Aggregation Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── 404 CATCH-ALL ────────────────────────────────────────────────────────────

// Placed precisely at the end of the route stack so it functions correctly as a 404 catch-all
app.use((req, res) => {
  console.log('🚫 404 ALERT! The app tried to hit:', req.method, req.path);
  res.status(404).json({ error: 'Check Railway logs for the path!' });
});

const PORT = process.env.PORT || 8081;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening natively on ${PORT}`);
});
