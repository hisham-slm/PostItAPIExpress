const mongoose = require('mongoose')
const user = require('./user')
const post = require('./post')

const CommentSchema = new mongoose.Schema({
    post : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'post'
    },
    user : {
        type : mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    comments : {
        type : String,
        require : true
    }
})

module.exports = mongoose.model('comment' , CommentSchema)