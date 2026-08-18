import mongoose from 'mongoose';

const poemSchema = new mongoose.Schema({
author: { type: String, required: true, default: 'Anonymous' },
    text: { type: String, required: true },
    title: { type: String, required: true },
    categories: { type: [String], default: [] },        
    main_category: { type: String, default: '' },  
    tags: { type: [String], default: [] },        
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Poem', poemSchema, 'poems');