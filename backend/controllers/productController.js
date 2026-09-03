const Product = require('../models/Product');
const mongoose = require('mongoose');

// @desc  Get products with advanced fashion filters, sorting & search
// @route GET /api/products
exports.getProducts = async (req, res) => {
    try {
        const {
            all, gender, category, subCategory, size, color,
            minPrice, maxPrice, isNewDrop, isBestseller,
            search, sort
        } = req.query;

        let filter = all === 'true' ? {} : { isAvailable: true, isHidden: { $ne: true } };

        if (gender && gender !== 'All') {
            filter.gender = { $in: [gender, 'Unisex'] };
        }

        if (category && category !== 'All') {
            filter.category = new RegExp(`^${category}$`, 'i');
        }

        if (subCategory) {
            filter.subCategory = new RegExp(subCategory, 'i');
        }

        if (size) {
            filter.sizes = size;
        }

        if (color) {
            filter['colors.name'] = new RegExp(color, 'i');
        }

        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        if (isNewDrop === 'true') filter.isNewDrop = true;
        if (isBestseller === 'true') filter.isBestseller = true;

        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            filter.$or = [
                { name: searchRegex },
                { brand: searchRegex },
                { category: searchRegex },
                { subCategory: searchRegex },
                { description: searchRegex },
                { tags: searchRegex }
            ];
        }

        // Sorting options
        let sortOption = { createdAt: -1 };
        if (sort === 'price-asc') sortOption = { price: 1 };
        if (sort === 'price-desc') sortOption = { price: -1 };
        if (sort === 'bestseller') sortOption = { isBestseller: -1, createdAt: -1 };
        if (sort === 'newest') sortOption = { createdAt: -1 };

        const products = await Product.find(filter).sort(sortOption);
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc  Get single product by MongoDB ID or slug
// @route GET /api/products/:idOrSlug
exports.getProductByIdOrSlug = async (req, res) => {
    try {
        const { idOrSlug } = req.params;
        let product;
        if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
            product = await Product.findById(idOrSlug);
        }
        if (!product) {
            product = await Product.findOne({ slug: idOrSlug });
        }

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Helper to safely parse JSON or array
const safeParse = (val, fallback = []) => {
    if (!val) return fallback;
    if (typeof val === 'string') {
        try { return JSON.parse(val); } catch (e) { return fallback; }
    }
    return val;
};

// @desc  Create apparel product
// @route POST /api/products
exports.createProduct = async (req, res) => {
    try {
        const {
            name, brand, price, discountPrice, category, subCategory, gender,
            description, isAvailable, isNewDrop, isBestseller,
            material, fit, careInstructions, modelStats,
            sizes, colors, variants, sizeGuide, tags,
            urlImages
        } = req.body;

        if (!name || !price || !category || !description) {
            return res.status(400).json({ message: 'Name, price, category and description are required' });
        }

        // Collect URL images + uploaded Multer files
        let images = [];
        if (urlImages) {
            images = Array.isArray(urlImages) ? urlImages : [urlImages];
        }
        if (req.files && req.files.length > 0) {
            const filePaths = req.files.map(f => `/uploads/${f.filename}`);
            images = [...images, ...filePaths];
        }

        const parsedSizes = safeParse(sizes, ['S', 'M', 'L', 'XL']);
        const parsedColors = safeParse(colors, []);
        let parsedVariants = safeParse(variants, []);
        const parsedSizeGuide = safeParse(sizeGuide, []);
        const parsedTags = safeParse(tags, []);

        // If no variants provided, generate default variants for each size
        if ((!parsedVariants || parsedVariants.length === 0) && parsedSizes.length > 0) {
            parsedVariants = parsedSizes.map(s => ({
                sku: `${name.substring(0, 3).toUpperCase()}-${s}`,
                size: s,
                color: parsedColors.length > 0 ? parsedColors[0].name : 'Standard',
                colorHex: parsedColors.length > 0 ? parsedColors[0].hex : '#000000',
                stock: 20,
                price: Number(price)
            }));
        }

        const product = new Product({
            name,
            brand: brand || 'True Threads',
            price: Number(price),
            discountPrice: discountPrice ? Number(discountPrice) : 0,
            gender: gender || 'Unisex',
            category,
            subCategory: subCategory || '',
            description,
            isAvailable: isAvailable === 'true' || isAvailable === true,
            isNewDrop: isNewDrop === 'true' || isNewDrop === true,
            isBestseller: isBestseller === 'true' || isBestseller === true,
            images,
            sizes: parsedSizes,
            colors: parsedColors,
            variants: parsedVariants,
            material: material || '100% Combed Cotton',
            fit: fit || 'Regular Fit',
            careInstructions: careInstructions || 'Machine wash cold with like colors. Tumble dry low.',
            modelStats: modelStats || '',
            sizeGuide: parsedSizeGuide,
            tags: parsedTags
        });

        await product.save();
        res.status(201).json(product);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc  Update product — handles FormData or JSON
// @route PUT /api/products/:id
exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        const isJson = req.headers['content-type']?.includes('application/json');

        if (isJson) {
            const body = req.body;
            Object.keys(body).forEach(key => {
                if (key === 'price' || key === 'discountPrice') {
                    product[key] = Number(body[key]);
                } else if (body[key] !== undefined) {
                    product[key] = body[key];
                }
            });
        } else {
            const {
                name, brand, price, discountPrice, category, subCategory, gender,
                description, isAvailable, isNewDrop, isBestseller,
                material, fit, careInstructions, modelStats,
                sizes, colors, variants, sizeGuide, tags,
                urlImages
            } = req.body;

            if (name) product.name = name;
            if (brand) product.brand = brand;
            if (price !== undefined) product.price = Number(price);
            if (discountPrice !== undefined) product.discountPrice = Number(discountPrice);
            if (category) product.category = category;
            if (subCategory !== undefined) product.subCategory = subCategory;
            if (gender) product.gender = gender;
            if (description) product.description = description;
            if (isAvailable !== undefined) product.isAvailable = isAvailable === 'true' || isAvailable === true;
            if (isNewDrop !== undefined) product.isNewDrop = isNewDrop === 'true' || isNewDrop === true;
            if (isBestseller !== undefined) product.isBestseller = isBestseller === 'true' || isBestseller === true;
            if (material !== undefined) product.material = material;
            if (fit !== undefined) product.fit = fit;
            if (careInstructions !== undefined) product.careInstructions = careInstructions;
            if (modelStats !== undefined) product.modelStats = modelStats;

            if (sizes) product.sizes = safeParse(sizes, product.sizes);
            if (colors) product.colors = safeParse(colors, product.colors);
            if (variants) product.variants = safeParse(variants, product.variants);
            if (sizeGuide) product.sizeGuide = safeParse(sizeGuide, product.sizeGuide);
            if (tags) product.tags = safeParse(tags, product.tags);

            let images = [];
            if (urlImages) {
                images = Array.isArray(urlImages) ? urlImages : [urlImages];
            }
            if (req.files && req.files.length > 0) {
                const filePaths = req.files.map(f => `/uploads/${f.filename}`);
                images = [...images, ...filePaths];
            }
            if (images.length > 0) {
                product.images = images;
            }
        }

        await product.save();
        res.json(product);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc  Delete a product
// @route DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        await product.deleteOne();
        res.json({ message: 'Product removed from store catalog' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};