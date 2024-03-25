const express = require('express')
const router = express.Router()

const jwt = require('jsonwebtoken')

const User = require('../models/user')
const Post = require('../models/post')

const bcrypt = require('bcrypt')

const multer = require('multer')
const path = require('path')
const fs = require('fs').promises

const postStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'posts')
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname))
    }
})
const uploadPost = multer({
    storage: postStorage,
    fileFilter: function (req, file, cb) {
        validateImageFile(req, file, cb)
    }
})

const profilePicStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'profiePics')
    },
    filename: (req, file, cb) => {
        cb(null, req.username.user + Date.now() + path.extname(file.originalname))
    }
})
const uploadProfilePic = multer({
    storage: profilePicStorage,
    fileFilter: function (req, file, cb) {
        validateImageFile(req, file, cb)
    }
})

router.use(authenticateToken)
router.use(updateAccessToken)

router.post('/upload_post', uploadPost.single('image'), async (req, res) => {
    try {
        const username = req.username.user
        const user = await User.findOne({ username: username })
        const title = req.body.title

        const newPost = new Post({
            user: user.id,
            post: req.file.path,
            title: title,
            postedAt: Date.now()
        })
        await newPost.save()
        await User.updateOne({ username: username }, { $addToSet: { post: newPost._id } })

        res.status(201).json({ message: 'Image uploaded successfully' })
    } catch (error) {
        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) {
                    console.error('Error deleting uploaded file:', err);
                } else {
                    console.log('Uploaded file deleted successfully');
                }
            });
        }
        res.status(500).json({ message: error.message })
    }
})

router.delete('/delete_post', async (req, res) => {
    try {
        const username = req.username.user
        const user = await User.findOne({ username: username })
        const postId = req.body.post_id
        const post = await Post.findOne({ _id: postId })

        if (!post) {
            return res.status(404).json({ message: "Post not found" })
        } else if (post.user.toString() !== user._id.toString()) {
            return res.status(403).json({ message: "You do not own this post" })
        }

        const imagePath = post.post
        await fs.unlink(imagePath)
        await Post.deleteOne({ _id: postId })
        await User.updateOne({ username: username }, { $pull: { post: postId } })
        return res.status(200).json({ message: "Deleted successfully" })
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
})

router.put('/update_profile_picture', uploadProfilePic.single('profile_picture'), async (req, res) => {
    try {
        const username = req.username.user
        const user = await User.findOne({username : username})
        const currentProfilePicturePath = user.profilePicture
     
        if(currentProfilePicturePath){
            fs.unlink(currentProfilePicturePath)
        }

        await User.updateOne({ username: username }, { $set: { profilePicture: req.file.path } })
        return res.status(200).json({ message: 'Profile picture updated successfully' })
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
})

router.put('/remove_profile_picture' , async (req , res) => {
    try{
        const username = req.username.user
        const user = await User.findOne({username : username})
        const currentProfilePicturePath = user.profilePicture
        
        if(currentProfilePicturePath){
            fs.unlink(currentProfilePicturePath)
        }

        const defaultProfilePicture = process.env.DEFAULT_PROFILE_PICTURE

        await User.updateOne({username : username} , { $set : {profilePicture : defaultProfilePicture}})

        return res.status(200).json({message : "Profile picture removed succesfully"})
    }catch(error){
        return res.status(500).json({message : error.message})
    }
})

router.post('/follow', async (req, res) => {
    try {
        const followerUsername = req.username.user
        const followingUsername = req.body.following
        let followerUser = await User.findOne({ username: followerUsername })
        let followingUser = await User.findOne({ username: followingUsername })

        if (followerUsername == followingUsername) {
            return res.status(401).json({ message: "You can't follow yourself" })
        }

        if (!followingUser) {
            return res.status(404).json({ message: 'User not found' })
        }
        await User.updateOne({ _id: followerUser._id }, { $addToSet: { following: followingUser._id } })
        await User.updateOne({ _id: followingUser._id }, { $addToSet: { followers: followerUser._id } })

        res.status(200).json({ message: 'Following successfull' })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

router.post('/unfollow', async (req, res) => {
    const unfollowingUser = await User.findOne({ username: req.body.unfollow })
    const username = req.username.user
    const user = await User.findOne({ username: username })

    try {
        if (user.following.includes(unfollowingUser._id)) {
            await User.updateOne({ username: username }, { $pull: { following: unfollowingUser._id } });
            await User.updateOne({ username: req.body.unfollow }, { $pull: { followers: user._id } })
            res.status(200).json({ message: "Successfully unfollowed" })
        } else {
            res.status(404).json({ message: "User not found or You're not following him" })
        }
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

router.put('/update_password', async (req, res) => {
    try {
        const username = req.username.user
        const currentPassword = req.body.current_password
        const newPassword = req.body.new_password

        const user = await User.findOne({ username: username })

        const passwordComparison = await bcrypt.compare(currentPassword, user.password)

        if (!passwordComparison) {
            return res.status(401).json({ message: "Incorrect Password!" })
        } else if (currentPassword == newPassword) {
            return res.status(403).json({ message: "You cant use same password to update" })
        }
        const salt = await bcrypt.genSalt()
        const hashedPassword = await bcrypt.hash(newPassword, salt)
        await User.updateOne({ username: username }, { $set: { password: hashedPassword } })

        return res.status(200).json({ message: "Password Updated!" })

    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
})

router.put('/update_username', async (req, res) => {
    try {
        const currentUsername = req.username.user
        const newUsername = req.body.new_username
        const passwordEntered = req.body.password
        const user = await User.findOne({ username: currentUsername })

        const passwordComparison = bcrypt.compare(passwordEntered, user.password)

        if (!passwordComparison) {
            return res.status(401).json({ message: "Incorrect password!" })
        }
        const newAccessToken = jwt.sign({ user: newUsername }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10m' })
        res.cookie('access_token', newAccessToken, { httpOnly: true, secure: true, sameSite: "strict" })

        await User.updateOne({ username: currentUsername }, { $set: { username: newUsername } })

        return res.status(200).json({ message: "Username updated!" })

    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
})

router.delete('/delete_account', async (req, res) => {
    try {
        const username = req.username.user
        const user = await User.findOne({ username: username })

        await User.deleteOne({ username: username })
        await User.updateMany({ following: user._id }, { $pull: { following: user._id } })
        await User.updateMany({ followers: user._id }, { $pull: { followers: user._id } })
        await Post.deleteMany({ user: user._id })
        await Post.updateMany({ likedUsers: user._id }, { $pull: { likedUsers: user._id } })

        res.clearCookie('access_token')
        res.status(200).json({ message: "Successfully deleted" })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

router.post('/like', async (req, res) => {
    try {
        const username = req.username.user
        const user = await User.findOne({ username: username })
        const postId = req.body.post_id
        const post = await Post.findOne({ _id: postId })

        if (!post) {
            return res.status(404).json({ message: "Post not found" })
        } else if (post.likedUsers.includes(user._id)) {
            return res.status(409).json({ message: "Already Liked" })
        }

        await Post.updateOne({ _id: postId }, { $addToSet: { likedUsers: user._id } })

        return res.status(200).json({ message: "Liked!" })
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
})

router.post('/dislike', async (req, res) => {
    try {
        const username = req.username.user
        const user = await User.findOne({ username: username })

        const postId = req.body.post_id
        const post = await Post.findOne({ _id: postId })

        if (!post) {
            return res.status(404).json({ message: "Post not found" })
        } else if (!post.likedUsers.includes(user._id)) {
            return res.status(404).json({ message: "You've not liked this post" })
        }

        await Post.updateOne({ _id: postId }, { $pull: { likedUsers: user._id } })

        return res.status(200).json({ message: 'Disliked' })

    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
})

//middlewares

const validateImageFile = (req, file, cb) => {
    const allowedFileTypes = /jpeg|jpg|png|gif/;
    const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = allowedFileTypes.test(file.mimetype);

    if (extname && mimeType) {
        return cb(null, true);
    } else {
        return cb(new Error('Only image files are allowed'));
    }
};

async function authenticateToken(req, res, next) {
    const token = req.cookies.access_token

    if (token == null) {
        res.status(401).json({ message: 'Please Login!' })
    } else {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, username) => {
            if (error) {
                res.status(403).json({ message: error.message })
            } else {
                req.username = username
                next()
            }
        })
    }
}

async function updateAccessToken(req, res, next) {
    try {
        const user = await User.findOne({ username: req.username.user })

        if (user.refreshToken) {
            const updatedAccessToken = jwt.sign({ user: user.username }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10m' })
            res.cookie('access_token', updatedAccessToken, { httpOnly: true, secure: true, sameSite: "strict" })
            next()
        } else {
            res.status(404).json({ message: "Refresh token not found!" })
        }
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

module.exports = router