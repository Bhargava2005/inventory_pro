import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const REMOTE_URI = "mongodb+srv://Bhargava:Bhargava.2005@cluster0.ek0wcr4.mongodb.net/inventory_pro?retryWrites=true&w=majority&appName=Cluster0";
const LOCAL_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/inventory_pro";

async function syncDatabase() {
    console.log('🚀 Starting Database Sync...');
    console.log('---------------------------------');
    
    const remoteClient = new MongoClient(REMOTE_URI);
    const localClient = new MongoClient(LOCAL_URI);

    try {
        await remoteClient.connect();
        console.log('✅ Connected to REMOTE database');
        
        await localClient.connect();
        console.log('✅ Connected to LOCAL database');

        const remoteDb = remoteClient.db();
        const localDb = localClient.db();

        const collections = await remoteDb.listCollections().toArray();
        console.log(`📦 Found ${collections.length} collections to sync.`);

        for (const colDef of collections) {
            const colName = colDef.name;
            console.log(`\n🔄 Syncing collection: ${colName}...`);

            // Clear local collection
            await localDb.collection(colName).deleteMany({});
            console.log(`   🗑️ Cleared local ${colName}`);

            // Fetch remote data
            const data = await remoteDb.collection(colName).find({}).toArray();
            
            if (data.length > 0) {
                // Insert into local
                await localDb.collection(colName).insertMany(data);
                console.log(`   ✅ Copied ${data.length} documents to local ${colName}`);
            } else {
                console.log(`   ℹ️ Collection ${colName} is empty, skipped insert.`);
            }
        }

        console.log('\n---------------------------------');
        console.log('🎉 Database sync completed successfully!');

    } catch (error) {
        console.error('\n❌ Error during sync:', error);
    } finally {
        await remoteClient.close();
        await localClient.close();
        console.log('🔌 Connections closed.');
    }
}

syncDatabase();
