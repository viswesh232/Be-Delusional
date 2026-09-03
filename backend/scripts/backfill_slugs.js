const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log('Connected to DB');
    const products = await Product.find({ slug: { $exists: false } });
    console.log(`Found ${products.length} products without slug`);
    
    for (const p of products) {
        await p.save();
        console.log(`Updated product: ${p.name}`);
    }
    
    const allProducts = await Product.find();
    for (const p of allProducts) {
        if (!p.slug && p.name) {
            p.slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            await Product.updateOne({ _id: p._id }, { $set: { slug: p.slug } });
            console.log(`Manually updated product: ${p.name} with slug: ${p.slug}`);
        }
    }
    
    console.log('Done');
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
