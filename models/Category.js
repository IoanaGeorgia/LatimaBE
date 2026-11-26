import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    symbol: { type: String, required: true },

});

export default mongoose.model('category', categorySchema, 'categories');