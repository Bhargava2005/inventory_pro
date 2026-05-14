import mongoose from 'mongoose';
import 'dotenv/config';

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const Product = mongoose.connection.db.collection('products');
    
    const count = await Product.countDocuments();
    console.log(`Total products: ${count}`);
    
    const storeIds = await Product.distinct('storeId');
    console.log(`Unique storeIds: ${storeIds}`);
    
    const activeCount = await Product.countDocuments({ isActive: true });
    console.log(`Active products: ${activeCount}`);
    
    const sample = await Product.findOne();
    console.log('Sample product:', JSON.stringify(sample, null, 2));
    
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};

check();
