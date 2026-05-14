const { connectDB, User, Product } = require('../database');

async function checkData() {
    await connectDB();
    const users = await User.find({ marketplace_enabled: true });
    console.log('Users with marketplace enabled:');
    users.forEach(u => console.log(`- ${u.business_name}`));
    
    if (users.length > 0) {
        const products = await Product.find({ user_id: users[0]._id });
        console.log(`Products for ${users[0].business_name}:`, products.length);
    } else {
        // Find any user and enable marketplace
        const anyUser = await User.findOne();
        if (anyUser) {
            anyUser.marketplace_enabled = true;
            await anyUser.save();
            console.log(`Enabled marketplace for: ${anyUser.business_name}`);
        }
    }
    process.exit();
}

checkData();
