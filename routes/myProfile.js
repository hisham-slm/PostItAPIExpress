const express = require('express')
const router = express.Router()

const jwt = require('jsonwebtoken')

const User = require('../models/user')

router.use(authenticateToken)

router.get('/' , async(req ,res ) =>{
    try{
        const username = req.username.user 
        const currentUser = await User.findOne({username  : username})

        const userProfileDetails = {
            username : currentUser.username,
            followers : currentUser.followers.length,
            following : currentUser.following.length,
            profilePicture : currentUser.profilePicture
        }
        const updatedAccessToken = await updateAccessToken(username)
        res.cookie("access_token" , updatedAccessToken, {httpOnly :true , sameSite : "strict" , secure : true})  

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