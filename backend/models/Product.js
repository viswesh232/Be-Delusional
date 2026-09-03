const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
    sku:           { type: String, default: '' },
    size:          { type: String, required: true },
    color:         { type: String, default: 'Standard' },
    colorHex:      { type: String, default: '#000000' },
    stock:         { type: Number, default: 0, min: 0 },
    price:         { type: Number }, // Optional variant-specific override
});

const sizeGuideSchema = new mongoose.Schema({
    size:     { type: String, required: true },
    chest:    { type: String, default: '' },
    length:   { type: String, default: '' },
    shoulder: { type: String, default: '' },
    waist:    { type: String, default: '' },
});

const productSchema = new mongoose.Schema({
    name:            { type: String, required: true, trim: true },
    slug:            { type: String, unique: true },
    brand:           { type: String, default: 'True Threads', trim: true },
    description:     { type: String, required: true },
    price:           { type: Number, required: true }, // base regular price
    discountPrice:   { type: Number, default: 0 },    // sale price (if any)
    
    // Apparel categorization
    gender:          { type: String, enum: ['Men', 'Women', 'Unisex', 'Kids'], default: 'Unisex' },
    category:        { type: String, required: true }, // e.g. T-Shirts, Shirts, Hoodies, Pants, etc.
    subCategory:     { type: String, default: '' },   // e.g. Oversized, Graphic, Cargo, Cropped
    
    // Apparel variants & options
    sizes:           { type: [String], default: ['S', 'M', 'L', 'XL'] },
    colors:          [{ name: { type: String, required: true }, hex: { type: String, default: '#000000' } }],
    variants:        [variantSchema], // Matrix of size + color + stock + sku

    // Media
    images:          { type: [String], default: [] }, // Array of image URLs/paths

    // Garment specifications
    material:        { type: String, default: '100% Combed Cotton' },
    fit:             { type: String, default: 'Regular Fit' },
    careInstructions:{ type: String, default: 'Machine wash cold with like colors. Do not bleach. Tumble dry low.' },
    modelStats:      { type: String, default: '' }, // e.g. 'Model is 6\'1" wearing size L'
    sizeGuide:       [sizeGuideSchema],

    // Merchandising flags
    isAvailable:     { type: Boolean, default: true },
    isHidden:        { type: Boolean, default: false },
    isNewDrop:       { type: Boolean, default: false },
    isBestseller:    { type: Boolean, default: false },
    tags:            { type: [String], default: [] },

    // Backward compatibility with previous schema
    weights:         [{ weight: String, price: Number }],
}, { timestamps: true });

productSchema.pre('save', async function(next) {
    if (this.isModified('name') || !this.slug) {
        let baseSlug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        let newSlug = baseSlug;
        
        if (this.isNew || this.isModified('name')) {
            const ProductModel = mongoose.models.Product || mongoose.model('Product');
            let slugExists = await ProductModel.exists({ slug: newSlug, _id: { $ne: this._id } });
            let count = 1;
            while (slugExists) {
                newSlug = `${baseSlug}-${count}`;
                slugExists = await ProductModel.exists({ slug: newSlug, _id: { $ne: this._id } });
                count++;
            }
        }
        this.slug = newSlug;
    }
    if (typeof next === 'function') next();
});

module.exports = mongoose.model('Product', productSchema);