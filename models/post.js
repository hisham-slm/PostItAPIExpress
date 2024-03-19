const mongoose = require('mongoose')
const user = require('../models/user')

const PostSchema = new mongoose.Schema({
    post : {
        type : String,
        require : true,
    },
    title : {
        type : String,
        minlength : 1,
        maxlength : 100
    },
    user : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'user'
    },
    likedUsers :[{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'user',
        def : []
    }],
    postedAt : {
        type : Date,
        require : true,
        def : Date.now  
    }
})

module.exports = mongoose.model('post' , PostSchema)