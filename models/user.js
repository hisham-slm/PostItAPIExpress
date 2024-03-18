require('dotenv').config()
const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    username : {
        type : String,
        require : true
    },
    password: {
        type : String ,
        require : true
    },
    email : {
        type : String,
        require : true
    },
    refreshToken : {
        type : String,
        require : true,
        default : ' '
    },
    profilePicture : {
        type : String,
        default : process.env.DEFAULT_PROFILE_PICTURE
    },
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
})

module.exports = mongoose.model('user' , UserSchema)