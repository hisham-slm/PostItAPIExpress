const express = require('express')
const router = express.Router()

const jwt = require('jsonwebtoken')

const User = require('../models/user')
const Post = require('../models/post')

router.use(authenticateToken)
router.use(updateAccessToken)

router.get('/' , async(req ,res ) =>{
    try{
        const username = req.username.user
        const currentUser = await User.findOne({username  : username})

        const userProfileDetails = {
            username : currentUser.username,
            followers : currentUser.followers.length,
            following : currentUser.following.length,
            profilePicture : currentUser.profilePicture,
            post : currentUser.post.length
        }  

        res.status(200).json(userProfileDetails)
    }catch(error){
        res.status(500).json({message : error.message})
    }
})

router.get('/followers' , async (req , res) => {
    try{
        const username = req.username.user
        const currentUser = await User.findOne({username : username})

        const followersUsers = currentUser.followers
        const followersUsernames = []

        for(const followersUserId of followersUsers){
            const user = await User.findOne({_id : followersUserId})
            followersUsernames.push(user.username)
        }

        res.status(200).json({followers : followersUsernames})
    }catch(error){
        res.send(500).json({message : error.message})
    }
})

router.get('/following' , async(req ,res ) => {
    try{
        const username = req.username.user
        const currentUser = await User.findOne({username : username})

        const followingUsers= currentUser.following
        const followingUserNames = []
        
        for(const followingUserId of followingUsers){
            const user = await User.findOne({_id : followingUserId})
            followingUserNames.push(user.username)
        }

        res.status(200).json({following : followingUserNames})
    }catch(error){
        res.status(500).json({messge : error.message})
    }
})

router.get('/posts' , async (req , res) => {
    try{
        const username = req.username.user
        const user = await User.findOne({username : username})

        const currentUsersPost = await Post.find({user : user._id})

        const totalNumberOfPosts = {'Number of Posts':currentUsersPost.length}
        const postDetails = []
        postDetails.push(totalNumberOfPosts)

        for ( const eachPost of currentUsersPost){
            postDetails.push({
                post : eachPost.post,
                postedAt : eachPost.postedAt,
                numberOfLikes : eachPost.likedUsers.length,
                likedUsers : eachPost.likedUsers
            })
        }

        res.status(200).json(postDetails)
    }catch(error){
        res.status(500).json({message : error.message})
    }
    
})

async function authenticateToken(req , res , next){
    const token = req.cookies.access_token

    if(token == null){
        return res.status(401).json({message : 'Please Login!'})
    }else{
        jwt.verify(token , process.env.ACCESS_TOKEN_SECRET ,  (error , username) => {
            if(error){
                res.status(403).json({message : error.message})
            }
            req.username = username
            next()
        })
    }
}

async function updateAccessToken(req , res , next){
    try{
        const user = await User.findOne({username : req.username.user})

        if (user.refreshToken){
            const updatedAccessToken = jwt.sign({user :  user.username} , process.env.ACCESS_TOKEN_SECRET  , {expiresIn : '10m'})
            res.cookie('access_token' , updatedAccessToken , {httpOnly : true , secure : true , sameSite : "strict"})
            next()
        }else{
            res.status(404).json({message : "Refresh token not found!"})
        }
    }catch(error){
        res.status(500).json({message : error.message})
    }
}

module.exports = router