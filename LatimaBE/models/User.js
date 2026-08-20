import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    mail:{type:String, required:true},
    password:{type:String, required:true},
    in_submission: { type: Number, default:0},   
    is_admin: { type: Number, default: 0 }
},{ timestamps: true });

export default mongoose.model('User', userSchema, 'users');