const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required for creating a user'],
        unique: [true, 'Email already exists, please use a different email'],
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    
    },
    name: {
        type: String,
        required: [true, 'Name is required for creating an account'],
    },
    password: {
        type: String,
        required: [true, 'Password is required for creating an account'],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false
    },
    systemUser: {
        type: Boolean,
        default: false,
        immutable: true,
        select: false
    }
}, {
    timestamps: true
})

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return ;
    }

    const hash = await bcrypt.hash(this.password, 10);
    this.password = hash;
  return ;

})

userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password); 
}

const userModel = mongoose.model('user', userSchema);

module.exports = userModel;