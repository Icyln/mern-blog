const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const User = require('./models/User');
const Post = require('./models/Post');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const fs = require('fs');

const app = express();
const uploadMiddleware = multer({ dest: 'uploads/' });
const salt = bcrypt.genSaltSync(10);
const secret = 'asdfe45we45w345wegw345werjktjwertkj';

// CORS settings
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));

// MongoDB connection
mongoose.connect('mongodb+srv://blog:Btsarmy2005@cluster0.qatw0za.mongodb.net/mern-blog?retryWrites=true&w=majority');

// ===== AUTH ROUTES =====
app.post('/register', async (req,res) => {
  const {username,password} = req.body;
  try{
    const userDoc = await User.create({
      username,
      password:bcrypt.hashSync(password,salt),
    });
    res.json(userDoc);
  } catch(e) {
    console.log(e);
    res.status(400).json(e);
  }
});

app.post('/login', async (req,res) => {
  const {username,password} = req.body;
  const userDoc = await User.findOne({username});
  if (!userDoc) return res.status(400).json('Wrong credentials');

  const passOk = bcrypt.compareSync(password, userDoc.password);
  if (passOk) {
    jwt.sign({username,id:userDoc._id}, secret, {}, (err,token) => {
      if (err) throw err;
      res.cookie('token', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false
      }).json({ id:userDoc._id, username });
    });
  } else {
    res.status(400).json('Wrong credentials');
  }
});

app.get('/profile', (req,res) => {
  const {token} = req.cookies;
  if (!token) return res.status(401).json('No token provided');
  jwt.verify(token, secret, {}, (err,info) => {
    if (err) return res.status(403).json('Invalid token');
    res.json(info);
  });
});

app.post('/logout', (req,res) => {
  res.cookie('token', '', { httpOnly: true, sameSite: 'lax', secure: false }).json('ok');
});

// ===== POSTS ROUTES =====
app.post('/post', uploadMiddleware.single('file'), async (req,res) => {
  try {
    const {originalname,path} = req.file;
    const ext = originalname.split('.').pop();
    const newPath = path + '.' + ext;
    fs.renameSync(path, newPath);

    const {token} = req.cookies;
    if (!token) return res.status(401).json('No token');

    jwt.verify(token, secret, {}, async (err,info) => {
      if (err) return res.status(403).json('Invalid token');

      const {title,summary,content} = req.body;
      const postDoc = await Post.create({
        title,
        summary,
        content,
        cover:newPath,
        author:info.id,
      });
      res.json(postDoc);
    });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.post('/post/update', uploadMiddleware.single('file'), async (req,res) => {
  try {
    let newPath = null;
    if (req.file) {
      const ext = req.file.originalname.split('.').pop();
      newPath = req.file.path + '.' + ext;
      fs.renameSync(req.file.path, newPath);
    }

    const {token} = req.cookies;
    if (!token) return res.status(401).json('No token');

    jwt.verify(token, secret, {}, async (err,info) => {
      if (err) return res.status(403).json('Invalid token');

      const {id,title,summary,content} = req.body;
      const postDoc = await Post.findById(id);
      if (!postDoc) return res.status(404).json('Post not found');

      if (String(postDoc.author) !== String(info.id))
        return res.status(403).json('You are not the author');

      await postDoc.updateOne({
        title,
        summary,
        content,
        cover: newPath ? newPath : postDoc.cover,
      });

      res.json({ success: true });
    });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Get latest 20 posts
app.get('/post', async (req,res) => {
  try {
    const posts = await Post.find()
      .populate('author', ['username'])
      .sort({createdAt:-1})
      .limit(20);
    res.json(posts);
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get single post by ID
app.get('/post/:id', async (req,res) => {
  try {
    const postDoc = await Post.findById(req.params.id).populate('author',['username']);
    res.json(postDoc);
  } catch(err) {
    console.error(err);
    res.status(404).json({ error: 'Post not found' });
  }
});

// ===== START SERVER =====
app.listen(4000, () => console.log('Server running on port 4000'));
