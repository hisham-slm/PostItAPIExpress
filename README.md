# Post It API

This project is an API that emulates the core functionalities of Instagram. It allows users to perform actions such as upload and delete images, like and dislike on posts, comment and delete comments and following other users.

Tech Stack:
- JavaScript: The primary programming language for backend development.
- Node.js: The runtime environment for executing JavaScript code on the server-side.
- Express.js: A web application framework for Node.js used to build API endpoints and handle HTTP requests.
- MongoDB: A NoSQL database for storing user data, posts, comments, and related information.
- JWT (JSON Web Tokens): A technology for user authentication and authorization, facilitating secure transmission of information between parties.
- bcrypt: A library for hashing passwords, used for securely storing user credentials.
- multer: A middleware for handling file uploads in Express.js applications.

## Features

- **User Authentication**: Users can sign up, log in, and log out.
- **Post Management**: Users can upload and delete images as posts.
- **Interaction**: Users can like and comment on posts.
- **Follow System**: Users can follow and unfollow other users.

## Installation

1. Clone the repository:

```bash
git clone https://github.com/hisham-slm/PostItAPIExpress
```
2. Install dependencies

```bash
cd postItAPi
npm install
```
3. Create a .env file in the root directory and add the following variables

```bash
DATABASE_URL = url to your database
ACCESS_TOKEN_SECRET = your-access-token-secret
REFRESH_TOKEN_SECRET = your-refresh-token-secret
DEFAULT_PROFILE_PICTURE = image-path-for-default-profile-picture
```
5. Create directories for storing Uploaded images and profile pictures

```bash
mkdir posts profilePics
```

6. Start server

```bash
npm start devStart
```
