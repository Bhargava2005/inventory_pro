import mongoose from 'mongoose';
import 'dotenv/config';

const ATLAS_URI = 'mongodb+srv://Bhargava:Bhargava.2005@cluster0.ek0wcr4.mongodb.net/inventory_pro?retryWrites=true&w=majority&appName=Cluster0';

const check = async () => {
  try {
    const conn = await mongoose.connect(ATLAS_URI);
    console.log('✅ Connected to Atlas');
    
    const User = conn.model('User', new mongoose.Schema({ username: String, role: String }));
    const admin = await User.findOne({ username: 'admin' });
    
    if (admin) {
      console.log('👤 Found Admin User:', admin.username, 'Role:', admin.role);
    } else {
      console.log('❌ Admin User NOT FOUND in inventory_pro database!');
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  }
};

check();
