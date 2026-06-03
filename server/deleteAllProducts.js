import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './src/config/db.js';
import Product from './src/models/Product.js';

const deleteAll = async () => {
  try {
    await connectDB();
    console.log('Connected to DB for deletion...');

    const result = await Product.deleteMany({});
    console.log(`Successfully deleted ${result.deletedCount} products.`);
    
    process.exit(0);
  } catch (error) {
    console.error('Deletion failed:', error);
    process.exit(1);
  }
};

deleteAll();
