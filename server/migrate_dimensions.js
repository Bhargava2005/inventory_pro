import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './src/models/Product.js';

dotenv.config();

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const products = await Product.find({ dimensions: { $exists: false } });
    console.log(`Found ${products.length} products without dimensions`);

    const dimensionRegex = /(\d+(?:\.\d+)?\s*[xX*]\s*\d+(?:\.\d+)?(?:\s*[xX*]\s*\d+(?:\.\d+)?)?)/;
    
    let updatedCount = 0;
    for (const product of products) {
      const match = product.name.match(dimensionRegex);
      if (match) {
        product.dimensions = match[0].trim().toLowerCase().replace(/\s/g, '');
        await product.save();
        updatedCount++;
      }
    }

    console.log(`Successfully updated ${updatedCount} products`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
