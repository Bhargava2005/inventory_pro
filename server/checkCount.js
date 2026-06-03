import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './src/config/db.js';
import Product from './src/models/Product.js';

const check = async () => {
  await connectDB();
  const count = await Product.countDocuments();
  console.log('Total products:', count);
  process.exit(0);
};
check();
