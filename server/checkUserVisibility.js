import mongoose from 'mongoose';
import 'dotenv/config';

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = mongoose.connection.db.collection('users');
    const Product = mongoose.connection.db.collection('products');
    
    const users = await User.find().toArray();
    for (const user of users) {
      const query = { isActive: true, storeId: user.storeId };
      if (user.role !== 'admin' && user.branchId) {
        query.branchId = user.branchId;
      }
      const count = await Product.countDocuments(query);
      console.log(`User: ${user.username}, Role: ${user.role}, Branch: ${user.branchId}, Product Count: ${count}`);
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};

check();
