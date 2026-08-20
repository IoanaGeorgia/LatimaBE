import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Poem from "./models/Poem.js"
import Category from "./models/Category.js"
import User from "./models/User.js"
import helmet from 'helmet'
import cors from 'cors'


dotenv.config();

const app = express()

const PORT = process.env.port || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to Mongo DB'))
  .catch((err) => console.log('An eror has occured, ', err))

app.get('/api/poems', async (req, res) => {
  try {
    const poems = await Poem.find();
    res.json({ message: "success", data: poems });

  } catch (err) {
    res.status(500).json({ error: err.messge })
  }
})

app.post('/api/poems', async (req, res) => {
  try {
    const { title, text, categories, main_category, tags, author } = req.body;

    if (!title || !text) {
      return res.status(400).json({
        message: "fail",
        error: "Title and text are required fields."
      });
    }

    const newPoem = new Poem({
      title: title.trim(),
      text,
      categories: categories || [],
      main_category: main_category || '',
      tags: tags || [],
      author: author || 'default'
    });

    const savedPoem = await newPoem.save();
    res.status(201).json({ message: "success", data: savedPoem });
  } catch (err) {
    res.status(400).json({ message: "fail", error: err.message });
  }
});


app.post('/api/createUser', async (req, res) => {
  try {
    const { username, mail, password } = req.body;

    if (!username || !mail || !password) {
      return res.status(400).json({ error: "Username, mail and password are required fields" });
    }

    const newUser = new User({
      username: username,
      mail: mail,
      password: password
    });

    const savedUser = await newUser.save();

    const userResponse = savedUser.toObject();
    delete userResponse.password;

    res.status(201).json({ message: "success", data: userResponse });

  } catch (err) {

    res.status(400).json({
      error: err.message,
      message: "Couldn't create user"
    });

  }
});




app.post('/api/getUser', async (req, res) => {
  try {
    const { secret } = req.body;

    if (!secret) {
      return res.status(400).json({ error: "No secret sent to server!" });
    }

    const foundUser = await User.findById(secret);

    if (!foundUser) {
      return res.status(404).json({ error: "User not found!" });
    }

    const userResponse = foundUser.toObject();
    delete userResponse.password;

    res.status(200).json({ message: "success", data: userResponse });

  } catch (err) {
    res.status(400).json({
      error: err.message,
      message: "Couldn't retrieve user"
    });
  }
});


app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json({ message: 'success', data: categories })
  }
  catch (err) {
    res.status(500).json({ error: err.message })
  }
})


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})