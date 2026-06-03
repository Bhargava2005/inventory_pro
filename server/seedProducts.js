import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './src/config/db.js';
import Product from './src/models/Product.js';
import Store from './src/models/Store.js';
import Category from './src/models/Category.js';
import Branch from './src/models/Branch.js';

const seedData = async () => {
  try {
    await connectDB();
    console.log('Connected to Database');

    // 1. Get or Create a Store
    let store = await Store.findOne();
    if (!store) {
      store = await Store.create({
        name: 'Main Warehouse',
        code: 'WH-01',
        location: 'Industrial Zone',
        phone: '9876543210',
        email: 'warehouse@inventorypro.com'
      });
      console.log('Created default store:', store.name);
    }

    // 2. Get or Create Branches
    let naniBranch = await Branch.findOne({ name: /nani/i, storeId: store._id });
    if (!naniBranch) {
      naniBranch = await Branch.create({
        name: 'Nani Branch',
        code: 'NANI-01',
        location: 'Downtown',
        storeId: store._id
      });
      console.log('Created Branch: Nani Branch');
    }

    let kiranBranch = await Branch.findOne({ name: /kiran/i, storeId: store._id });
    if (!kiranBranch) {
      kiranBranch = await Branch.create({
        name: 'Kirans Branch',
        code: 'KIRAN-01',
        location: 'Uptown',
        storeId: store._id
      });
      console.log('Created Branch: Kirans Branch');
    }

    // 3. Get or Create Categories
    let tilesCategory = await Category.findOne({ name: 'Tiles', storeId: store._id });
    if (!tilesCategory) {
      tilesCategory = await Category.create({
        name: 'Tiles',
        storeId: store._id,
        description: 'Ceramic and Vitrified Tiles'
      });
      console.log('Created Category: Tiles');
    }

    let powderCategory = await Category.findOne({ name: 'Powders', storeId: store._id });
    if (!powderCategory) {
      powderCategory = await Category.create({
        name: 'Powders',
        storeId: store._id,
        description: 'Paints, Putti, and Cement'
      });
      console.log('Created Category: Powders');
    }

    // 4. Clear existing products
    const deleteResult = await Product.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} existing products.`);

    const products = [];

    // Helper URLs for random images
    const tileImages = [
      'https://images.unsplash.com/photo-1516156008625-3a9d6067fab5?q=80&w=400',
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=400',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=400',
      'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?q=80&w=400'
    ];

    const powderImages = [
      'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=400',
      'https://images.unsplash.com/photo-1595841696677-52033005a769?q=80&w=400',
      'https://images.unsplash.com/photo-1621460244084-5da960e7e72a?q=80&w=400',
      'https://images.unsplash.com/photo-1534398079543-7ae6d016b86a?q=80&w=400',
      'https://images.unsplash.com/photo-1562259949-e8e76833c040?q=80&w=400'
    ];

    const generateProducts = (branchId, count, branchName) => {
      for (let i = 1; i <= count; i++) {
        const isTile = i % 2 === 0;
        const brand = ['Kajaria', 'Somany', 'Asian Paints', 'Birla White', 'JK Lakshmi'][Math.floor(Math.random() * 5)];
        
        if (isTile) {
          // BOX UNIT PRODUCT (Tile)
          const dimensions = [`${300 + (i % 10) * 100}mm*${200 + (i % 5) * 100}mm`, '600mm*600mm', '800mm*800mm', '1200mm*600mm'][Math.floor(Math.random() * 4)];
          const piecesPerBox = [8, 10, 12, 15, 20][Math.floor(Math.random() * 5)];
          
          products.push({
            name: `${brand} Premium Tile ${i}`, // Removed dimensions from name
            brand: brand,
            sku: `TL-${branchName.slice(0, 2).toUpperCase()}-${i}`,
            category: tilesCategory._id,
            description: `High-quality ${brand} tile for interior and exterior use. Durable and stylish with a polished finish. Part of our exclusive ${branchName} collection.`,
            price: 500 + (i % 50) * 10,
            costPrice: 400 + (i % 50) * 10,
            quantity: 10 + (i % 100),
            unit: 'box',
            storeId: store._id,
            branchId: branchId,
            pieces_per_box: piecesPerBox,
            ava_pieces: i % piecesPerBox,
            weight_of_unit: 10 + (i % 20),
            measurements: dimensions,
            image: tileImages[i % tileImages.length]
          });
        } else {
          // BAG UNIT PRODUCT (Powder/Paint)
          const weight = [1, 5, 10, 25, 40, 50][Math.floor(Math.random() * 6)];
          const productType = ['Wall Putty', 'White Cement', 'Powder Paint', 'Tile Adhesive', 'Grout'][Math.floor(Math.random() * 5)];
          
          products.push({
            name: `${brand} ${productType} ${i}`, // Removed weight from name
            brand: brand,
            sku: `PW-${branchName.slice(0, 2).toUpperCase()}-${i}`,
            category: powderCategory._id,
            description: `Professional grade ${productType} by ${brand}. Ideal for construction and renovation projects. Available now at ${branchName}.`,
            price: 200 + (i % 100) * 5,
            costPrice: 150 + (i % 100) * 5,
            quantity: 50 + (i % 200),
            unit: 'bag',
            storeId: store._id,
            branchId: branchId,
            pieces_per_box: 1,
            ava_pieces: 0,
            weight_of_unit: weight,
            measurements: `${weight} kg`,
            image: powderImages[i % powderImages.length]
          });
        }
      }
    };

    console.log('Generating 500 products for Nani Branch...');
    generateProducts(naniBranch._id, 500, 'Nani');
    
    console.log('Generating 400 products for Kirans Branch...');
    generateProducts(kiranBranch._id, 400, 'Kiran');

    // Insert in batches of 100 to avoid memory issues or bulk limits
    const batchSize = 100;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      await Product.insertMany(batch);
      console.log(`Inserted batch ${i / batchSize + 1}/${Math.ceil(products.length / batchSize)}`);
    }

    console.log(`Successfully seeded ${products.length} products.`);
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
