import mongoose from 'mongoose';
import 'dotenv/config';

const ATLAS_URI = 'mongodb+srv://Bhargava:Bhargava.2005@cluster0.ek0wcr4.mongodb.net/inventory_pro?retryWrites=true&w=majority&appName=Cluster0';

const check = async () => {
  try {
    const conn = await mongoose.connect(ATLAS_URI);
    console.log('✅ Connected to Atlas');
    
    const stores = await conn.connection.db.collection('stores').find({}).toArray();
    
    console.log('🏢 Stores in Atlas:');
    stores.forEach(s => {
      console.log(`- Name: ${s.name}, Code: ${s.code}, ID: ${s._id}`);
    });
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  }
};

check();
