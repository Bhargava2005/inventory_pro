import mongoose from 'mongoose';
import 'dotenv/config';

const ATLAS_URI = 'mongodb+srv://Bhargava:Bhargava.2005@cluster0.ek0wcr4.mongodb.net/inventory_pro?retryWrites=true&w=majority&appName=Cluster0';

const check = async () => {
  try {
    const conn = await mongoose.connect(ATLAS_URI);
    console.log('✅ Connected to Atlas');
    
    // Use raw mongodb collection to see exactly what's there
    const users = await conn.connection.db.collection('users').find({}).toArray();
    
    console.log('👥 Raw Users in Atlas:');
    users.forEach(u => {
      console.log(`- ID: ${u._id}, Username: ${u.username}, Role: ${u.role}, StoreId: ${u.storeId}`);
    });
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  }
};

check();
