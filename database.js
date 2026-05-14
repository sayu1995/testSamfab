const mongoose = require('mongoose');
require('dotenv').config();


// Global variable to cache the mongoose connection
let cachedDb = null;

const connectDB = async () => {
    if (cachedDb) {
        console.log('Using cached MongoDB connection');
        return cachedDb;
    }

    try {
        const uri = process.env.MONGO_URI || 'mongodb+srv://test:test%40123@cluster0.3t4qpai.mongodb.net/?appName=Cluster0';
        
        // Log connection attempt (hiding password)
        const sanitizedUri = uri.replace(/:([^@]+)@/, ':****@');
        console.log(`Connecting to MongoDB: ${sanitizedUri}`);

        const db = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 10000, // 10s timeout
            connectTimeoutMS: 10000
        });
        
        cachedDb = db;
        console.log('Successfully connected to MongoDB');
        return db;
    } catch (err) {
        console.error('CRITICAL: MongoDB Connection Error!');
        console.error('Error Code:', err.code);
        console.error('Message:', err.message);
        
        if (err.message.includes('ECONNREFUSED') || err.message.includes('querySrv')) {
            console.error('\nTIP: This error usually means your network is blocking MongoDB SRV records.');
            console.error('Try switching to a different network or use a non-SRV connection string in your .env file.\n');
        }
        
        throw err;
    }
};


// -- SCHEMAS --

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    business_name: { type: String, required: true },
    whatsapp_number: { type: String },
    marketplace_enabled: { type: Boolean, default: false },
    role: { type: String, default: 'user' }
});

const ProductSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    item_id: { type: String },
    name: { type: String, required: true },
    quantity: { type: Number, default: 0 },
    price: { type: Number, default: 0.0 },
    image: { type: String },
    category: { type: String, enum: ['Trailer', 'Trailer Parts', 'Sheets', 'Tools'], default: 'Trailer' }
}, { timestamps: true });

const InvoiceItemSchema = new mongoose.Schema({
    product_name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    subtotal: { type: Number, required: true }
});

const InvoiceSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    invoice_number: { type: String, required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    time: { type: String, required: true }, // Format: HH:MM
    total_amount: { type: Number, default: 0.0 },
    items: [InvoiceItemSchema]
});

// -- MODELS --
const User = mongoose.model('User', UserSchema);
const Product = mongoose.model('Product', ProductSchema);
const Invoice = mongoose.model('Invoice', InvoiceSchema);

// Create default admin user
const initializeDatabase = async () => {
    try {
        const adminExists = await User.findOne({ email: 'Admin' });
        if (!adminExists) {
            await User.create({
                email: 'Admin',
                password: 'Samfab@2002',
                business_name: 'Admin Portal',
                role: 'admin'
            });
            console.log('Admin user created.');
        } else {
            await User.updateOne({ email: 'Admin' }, { 
                password: 'Samfab@2002',
                role: 'admin' 
            });
            console.log('Admin credentials updated.');
        }
    } catch (err) {
        console.error('Error initializing default user:', err.message);
    }
};

module.exports = {
    connectDB,
    initializeDatabase,
    User,
    Product,
    Invoice
};
