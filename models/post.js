const mongoose = require('mongoose')
const user = require('./user')
const comment = require('./comment')

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
    comments : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'comment'
    }],
    postedAt : {
        type : Date,
        require : true,
    }
})

module.exports = mongoose.model('post' , PostSchema)