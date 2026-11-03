require('dotenv').config();
const mongoose = require('mongoose');

async function migrate() {
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required');
    await mongoose.connect(process.env.MONGO_URI);
    const collection = mongoose.connection.collection('returnrequests');
    const indexes = await collection.indexes();
    const legacy = indexes.find(index =>
        index.unique &&
        index.key?.order === 1 &&
        index.key?.product === 1 &&
        Object.keys(index.key).length === 2
    );

    // Create the replacement constraint first. If this fails, the legacy
    // constraint remains untouched and the migration exits safely.
    await collection.createIndex(
        { order: 1, product: 1, originalSize: 1, originalColor: 1 },
        { unique: true, name: 'order_1_product_1_originalSize_1_originalColor_1' }
    );

    if (legacy) await collection.dropIndex(legacy.name);
    console.log('Return request variant index migration completed.');
}

migrate()
    .catch(error => {
        console.error('Return request index migration failed:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
