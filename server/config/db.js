const mongoose = require('mongoose');

const connectDB = () => {
  const uri = process.env.MONGO_URI || "mongodb+srv://admin:rentgear123@cluster0.itsirgq.mongodb.net/RentGear?retryWrites=true&w=majority";
  return mongoose.connect(uri)
    .then(() => console.log('✅ Successfully connected to RentGear database'))
    .catch(err => console.log('❌ MongoDB Connection Error:', err.message));
};

module.exports = connectDB;
