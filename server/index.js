console.log('📡 SERVER VERSION 6.0: MULTI-PATH BOOKINGS ACTIVE');

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken'); // Need jwt for the auth route token generation

const app = express();

// 1. CORS defined FIRST before routes
app.use(cors({ origin: '*' }));
app.use(express.json());

app.use((req, res, next) => { console.log('Incoming Request:', req.method, req.path); next(); });

const mongoURI = process.env.MONGO_URI || "mongodb+srv://admin:rentgear123@cluster0.itsirgq.mongodb.net/RentGear?retryWrites=true&w=majority";

mongoose.connect(mongoURI)
  .then(() => console.log('✅ Successfully connected to RentGear database inside standalone file'))
  .catch(err => console.log('❌ MongoDB Connection Error:', err.message));

// 2. Route Prefixing - explicitly declaring /api/auth/login and /api/auth/register here to bypass deleted routers
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
    
    const existingUser = await mongoose.connection.db.collection('users').findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already exists' });
    }

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


app.get('/api/test', (req, res) => {
  res.json({ status: 'ok', message: 'Backend connected to Cluster0' });
});

app.get('/api/equipment', async (req, res) => {
  try {
    const items = await mongoose.connection.db.collection('equipment').find({}).toArray();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/force-seed', async (req, res) => {
  console.log('Seed route hit!');
  try {
    const owner = await mongoose.connection.db.collection('users').findOne({ role: 'owner' });
    const ownerId = owner ? String(owner._id) : 'mock-owner-id';

    const sampleData = [
      { name: 'Sony A7III', price: 850, unit: 'day', rating: 5, category: 'Cameras', imageEmoji: '📷', status: 'available', stock: 5, available: true, ownerId },
      { name: 'DJI Mavic 3', price: 120, unit: 'day', rating: 4.8, category: 'Drones', imageEmoji: '🚁', status: 'available', stock: 5, available: true, ownerId }
    ];
    await mongoose.connection.db.collection('equipment').deleteMany({});
    await mongoose.connection.db.collection('equipment').insertMany(sampleData);
    
    res.status(200).json({ message: 'SEED ROUTE ACTIVE V5' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/bookings', async (req, res) => {
  try {
    const { userId, ownerId } = req.query;
    const query = {};
    if (userId) query.userId = String(userId);
    if (ownerId) query.ownerId = String(ownerId);

    const items = await mongoose.connection.db.collection('bookings').find(query).toArray();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// This catches /api/booking AND /api/bookings
app.post(['/api/booking', '/api/bookings'], async (req, res) => {
  console.log('📥 Booking Route Hit! Data:', req.body);
  try {
    const { equipmentId, startDate, endDate, ...otherData } = req.body;
    
    const equipment = await mongoose.connection.db.collection('equipment').findOne({ _id: new mongoose.Types.ObjectId(equipmentId) });
    if (!equipment) return res.status(404).json({ error: 'Equipment not found' });

    // Inventory depreciation
    const updatedEq = await mongoose.connection.db.collection('equipment').findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(equipmentId) },
      { $inc: { stock: -1 } },
      { returnDocument: 'after' }
    );
    
    if (updatedEq && updatedEq.value && updatedEq.value.stock <= 0) {
      await mongoose.connection.db.collection('equipment').updateOne(
        { _id: new mongoose.Types.ObjectId(equipmentId) },
        { $set: { status: 'unavailable', available: false } }
      );
    }
    
    // Natively inserting into the RentGear 'bookings' collection
    const result = await mongoose.connection.db.collection('bookings').insertOne({
      equipmentId,
      ownerId: equipment.ownerId,
      startDate: new Date(startDate || Date.now()),
      endDate: new Date(endDate || Date.now()),
      ...otherData,
      status: 'confirmed',
      createdAt: new Date(),
    });

    console.log('✅ Booking confirmed for:', req.body.equipmentName || equipmentId);
    res.status(201).json({ success: true, message: 'Booking Successful!', bookingId: result.insertedId });
  } catch (err) {
    console.error('❌ Booking Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Placed precisely at the end of the route stack so it functions correctly as a 404 catch-all
app.use((req, res) => {
  console.log('🚫 404 ALERT! The app tried to hit:', req.method, req.path);
  res.status(404).json({ error: 'Check Railway logs for the path!' });
});

const PORT = process.env.PORT || 8081;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening natively on ${PORT}`);
});
