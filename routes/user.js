const express = require('express')
const router = express.Router()

const jwt = require('jsonwebtoken')

const User = require('../models/user')
const Post = require('../models/post')

const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
    destination : (req, file, cb) => {
        cb(null ,'media' )
    },
    filename : (req , file , cb) =>{
        cb(null , Date.now() +  path.extname(file.originalname))
    }
})
const upload = multer({storage : storage})

router.use(authenticateToken)

router.post('/upload_post', upload.single('image'), async( req ,res) =>{
    try{
        const username = req.username.user
        const user = await User.findOne({username : username})
        const title = req.body.title
console.log(req.file.path)
        const newPost = await new Post({
            user : user.id,
            post : `media/${req.file.path}`,
            title : title,
            postedAt : new Date.now().toISOString()
        })
        await newPost.save()
        
        await User.updateOne({username : username} , { $set : {post : newPost._id}})

        const updatedAccessToken = await updateAccessToken(username)
        res.cookie("access_token" , updatedAccessToken , {httpOnly : true , secure : true , sameSite : 'strict'})
        res.status(201).json({message : 'Image uploaded successfully'})
    }catch(error){
        res.status(500).json({message : error.message})
    }
})

//middlewares
async function authenticateToken(req , res , next){
    const token = req.cookies.access_token

    if(token == null){
        res.status(401).json({message : 'Please Login!'})
    }else{
        jwt.verify(token , process.env.ACCESS_TOKEN_SECRET ,  (error , username) => {
            if(error){
                res.status(403).json({message : error.message})
            } else {
                req.username = username
                next()
            }
        })
    }
}


async function updateAccessToken(username){
    try{
        const user = await User.findOne({username : username})
        let updatedAccessToken

        if (user.refreshToken){
            const updatedAccessToken = jwt.sign({user :  username} , process.env.ACCESS_TOKEN_SECRET  , {expiresIn : '10m'})
            return updatedAccessToken
        }else{
            updatedAccessToken = 'Refresh token not found Please login'
            return updatedAccessToken
        }
    }catch(error){
        throw error(updateAccessToken)
    }
}

module.exports = router