const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const Equipment = require('./models/Equipment');
const authRoutes = require('./routes/authRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const TitleTrie = require('./utils/trie');
const { initializeUsernameBloomFilter, getUsernameBloomMeta } = require('./utils/bloom');

dotenv.config({ path: `${__dirname}/.env` });

const app = express();
const equipmentTrie = new TitleTrie();

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/bookings', bookingRoutes);

app.get('/api/test', (req, res) => res.json({ message: 'Backend is alive!' }));

app.get('/api/health', (_req, res) =>
  res.json({
    status: 'ok',
    bloom: getUsernameBloomMeta(),
  })
);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/api/equipment-search/trie', async (req, res) => {
  const { q = '' } = req.query;
  if (!q) return res.json({ suggestions: [] });
  return res.json({ suggestions: equipmentTrie.searchPrefix(String(q), 15) });
});

const buildTrieFromDB = async () => {
  const equipment = await Equipment.find({}, 'title').lean();
  equipment.forEach((item) => equipmentTrie.insert(item.title));
};

const startServer = async () => {
  await connectDB();
  await buildTrieFromDB();
  await initializeUsernameBloomFilter();

// This tells the app: Use Railway's port if available, otherwise use 5001 locally
 const PORT = process.env.PORT || 5001;

 app.listen(PORT, '0.0.0.0', () => {
    console.log(`RentGear server running on port ${PORT}`);
  });
}; 

startServer();

Equipment.watch().on('change', async () => {
  // Lightweight rebuild keeps trie and DB in sync after CRUD operations.
  const freshTrie = new TitleTrie();
  const equipment = await Equipment.find({}, 'title').lean();
  equipment.forEach((item) => freshTrie.insert(item.title));
  Object.assign(equipmentTrie, freshTrie);
});

const mongoURI = "mongodb+srv://admin:Amulya%400316@cluster0.itsirgq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(mongoURI)
  .then(() => {
    console.log("🚀 SUCCESS: Connected to MongoDB Atlas");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });
