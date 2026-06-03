import mongoose from 'mongoose';
import 'dotenv/config';

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    
    const collections = ['users', 'products', 'sales', 'stores', 'branches'];
    for (const col of collections) {
      const count = await db.collection(col).countDocuments();
      console.log(`${col}: ${count}`);
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};

check();
