const mongoose=require('mongoose');

async function connectdb() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("database connected successfully");
    } catch (error) {
        console.error("database connection failed", error);
        throw error;
    }
}

module.exports=connectdb;
