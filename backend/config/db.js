const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let memoryServer;

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI && process.env.MONGO_URI.trim() ? process.env.MONGO_URI.trim() : '';

        if (!mongoUri && process.env.NODE_ENV === 'production') {
            throw new Error('MONGO_URI is required in production. Refusing to start with temporary in-memory storage.');
        }

        if (!mongoUri) {
            memoryServer = await MongoMemoryServer.create();
            const uri = memoryServer.getUri();
            const conn = await mongoose.connect(uri);
            console.log(`MongoDB Connected (in-memory): ${conn.connection.host}`);
            return;
        }

        const conn = await mongoose.connect(mongoUri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        const mongoUri = process.env.MONGO_URI && process.env.MONGO_URI.trim() ? process.env.MONGO_URI.trim() : '';
        const shouldUseMemoryFallback = process.env.NODE_ENV !== 'production' && (mongoUri.includes('127.0.0.1') || mongoUri.includes('localhost') || !mongoUri);

        if (shouldUseMemoryFallback && error && error.message && error.message.includes('ECONNREFUSED')) {
            try {
                memoryServer = await MongoMemoryServer.create();
                const uri = memoryServer.getUri();
                const conn = await mongoose.connect(uri);
                console.log(`MongoDB Connected (fallback in-memory): ${conn.connection.host}`);
                return;
            } catch (fallbackError) {
                console.error(`Fallback MongoDB connection error: ${fallbackError.message}`);
            }
        }

        console.error(`MongoDB connection error: ${error.message}`);
        console.error('If you are running locally, make sure MongoDB is installed and running, or set MONGO_URI in your environment.');
        process.exit(1);
    }
};

module.exports = connectDB;