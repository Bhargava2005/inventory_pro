import mongoose from 'mongoose';
import 'dotenv/config';

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const Product = mongoose.connection.db.collection('products');
    
    const branchStats = await Product.aggregate([
      { $group: { _id: '$branchId', count: { $sum: 1 } } }
    ]).toArray();
    
    console.log('Products per branch:', JSON.stringify(branchStats, null, 2));
    
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};

check();
