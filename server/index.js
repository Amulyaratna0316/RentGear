console.log('🔥🔥🔥 VERSION 2.0 LIVE 🔥🔥🔥');

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

const mongoURI = process.env.MONGO_URI || "mongodb+srv://admin:rentgear123@cluster0.itsirgq.mongodb.net/RentGear?retryWrites=true&w=majority";

mongoose.connect(mongoURI)
  .then(() => console.log('✅ Successfully connected to RentGear database inside standalone file'))
  .catch(err => console.log('❌ MongoDB Connection Error:', err.message));

app.get('/', (req, res) => {
  res.send('✅ RentGear Express Standalone API Running');
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
  try {
    const sampleData = [
      { name: 'Sony A7III', price: 50, category: 'Cameras', image: 'https://placehold.co/400' },
      { name: 'DJI Mavic 3', price: 80, category: 'Drones', image: 'https://placehold.co/400' }
    ];
    // Wipe first to prevent duplicates stacking if visited multiple times
    await mongoose.connection.db.collection('equipment').deleteMany({});
    await mongoose.connection.db.collection('equipment').insertMany(sampleData);
    res.send('✅ Success! Data forced into RentGear DB.');
  } catch (err) {
    res.status(500).send('❌ Error: ' + err.message);
  }
});

const PORT = process.env.PORT || 8081;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening natively on ${PORT}`);
});
