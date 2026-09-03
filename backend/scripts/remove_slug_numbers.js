const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log('Connected to DB');
    
    const allProducts = await Product.find();
    for (const p of allProducts) {
        if (p.name) {
            let baseSlug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            let newSlug = baseSlug;
            
            let slugExists = await Product.exists({ slug: newSlug, _id: { $ne: p._id } });
            let count = 1;
            while (slugExists) {
                newSlug = `${baseSlug}-${count}`;
                slugExists = await Product.exists({ slug: newSlug, _id: { $ne: p._id } });
                count++;
            }
            
            p.slug = newSlug;
            await Product.updateOne({ _id: p._id }, { $set: { slug: newSlug } });
            console.log(`Updated product: ${p.name} with slug: ${newSlug}`);
        }
    }
    
    console.log('Done');
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
