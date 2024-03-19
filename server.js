require('dotenv').config()

const express = require('express')
const mongoose  = require('mongoose')
const app = express()

app.use(express.json())

const User = require('./models/user')
const Post = require('./models/post')

mongoose.connect(process.env.DATABASE_URL)
const db = mongoose.connection
db.on('error', (error) => console.log(error))
db.once('open', () => console.log('Connected to database'))

const bcrypt = require('bcrypt')

const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
app.use(cookieParser())

const myProfileRoutes = require('./routes/myProfile')
const userRoutes = require('./routes/user')
app.use('/myprofile' , myProfileRoutes)
app.use('/user' , userRoutes)

app.get('/' , async (req, res) => {
    res.send("Welcome to postIt")
})


app.post('/signup' , async( req, res) => {
        const username = req.body.username 
        const email = req.body.email
        const password = req.body.password

        const existing_user = await User.findOne({username : username})  || await User.findOne({email : username})

        if (!existing_user){
            try{
                const salt = await bcrypt.genSalt()
            const hashedPassword = await bcrypt.hash(password , salt)

            const newUser = await new User({
                username : username,
                password : hashedPassword,
                email : email
            })

            await newUser.save()

            res.status(201).json({message : `New user ${username} added`})
            }catch(error){
                res.status(500).json({message : error.message})   
            }
        }else{
            res.status(200).json({message : 'Username already in use'})
        }
})

app.post('/login', async (req, res) => {
    const username = req.body.username
    const email = req.body.email 
    const password = req.body.password
    let user;

    try {
        if (username) {
            user = await User.findOne({ username: username });
        } else if (email) {
            user = await User.findOne({ email: email });
        }

        if (!user) {
            return res.status(401).json({ message: 'User not found!' });
        }

        const passwordComparison = await bcrypt.compare(password, user.password);   

        if (!passwordComparison) {
            return res.status(401).json({ message: 'Incorrect Password!' });
        }

        const accessToken = jwt.sign({ user: user.username }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10m' });
        const refreshToken = jwt.sign({ user: user.username }, process.env.REFRESH_TOKEN_SECRET);

        await User.updateOne({ username: user.username }, { $set: { refreshToken: refreshToken } });

        res.cookie('access_token', accessToken, { httpOnly: true, secure: true, sameSite: 'strict' });

        res.status(200).json({ message: 'Successfully logged in' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/follow' , authenticateToken , async(req , res) =>{
    try{
        const followerUsername = req.username.user
        const followingUsername = req.body.following

        if(followerUsername == followingUsername){
            return res.status(401).json({message : "You can't follow yourself"})
        }

        let followerUser = await User.findOne({username : followerUsername})
        let followingUser = await User.findOne({username : followingUsername})

        if(!followingUser){
            return res.status(404).json({message : 'User not found'})
        }
        await User.updateOne({_id : followerUser._id} , { $addToSet: { following: followingUser._id } })
        await User.updateOne({_id : followingUser._id} , { $addToSet: { followers: followerUser._id } })

        const updatedAccessToken = await updateAccessToken(followerUsername)
        res.cookie('access_token' , updatedAccessToken , {httpOnly : true , secure : true , sameSite : "strict"})

        res.status(200).json({message : 'Following successfull'})
    }catch(error){
        res.status(500).json({message : error.message})
    }
})

app.get('/:username', async(req , res ) => {
    const username  = req.params.username
    try {
        const user = await User.findOne({username : username})
        if(!user){
            return res.status(404).json({message : "User not found!"})
        }
        const userProfileDetails = {
            username : user.username,
            profilePicture : user.profilePicture,
            followers : user.followers.length,
            following : user.following.length,
            post : user.post.length
        }

        res.status(200).json({user : userProfileDetails})
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

app.listen(3000, () => {
    console.log('server listening on port 3000')
})
