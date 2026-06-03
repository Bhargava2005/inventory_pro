import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './src/config/db.js';
import Product from './src/models/Product.js';

const migrate = async () => {
  try {
    await connectDB();
    console.log('Connected to DB for migration...');

    const products = await Product.find({});
    console.log(`Found ${products.length} products to migrate.`);

    let count = 0;
    for (const prod of products) {
      const updates = {};
      
      // 1. Rename dimensions to measurements
      // In MongoDB, we use $rename if we want to do it via query, 
      // but here we are doing it via loop for specific logic.
      // We check if 'dimensions' exists (using .get because it might not be in schema anymore)
      const oldDim = prod.get('dimensions');
      if (oldDim !== undefined) {
        updates.measurements = oldDim;
        updates.$unset = { dimensions: 1 };
      } else if (!prod.measurements) {
        updates.measurements = '';
      }

      // 2. Specific logic for BAGS
      // Let's make every 5th product a BAG for testing variety
      if (count % 5 === 0) {
        updates.unit = 'bag';
        updates.pieces_per_box = 1;
        updates.ava_pieces = 0;
        updates.weight_of_unit = 0; 
        updates.measurements = '10 kg to 25 kg';
      } else {
        updates.unit = 'box';
      }

      await Product.updateOne({ _id: prod._id }, updates);
      count++;
    }

    console.log(`Successfully migrated ${count} products.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
