import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Poem from "./models/Poem.js";
import Category from "./models/Category.js";
import User from "./models/User.js";
import helmet from 'helmet';
import cors from 'cors';
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'latima_default_fallback_secret_key_123';

app.use(helmet());

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(cookieParser()); 


mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to Mongo DB'))
  .catch((err) => console.log('An error has occurred: ', err));

app.get('/api/poems', async (req, res) => {
  try {
    const poems = await Poem.find();
    res.json({ message: "success", data: poems });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

    const normalizedMail = mail.toLowerCase().trim();
    const foundUser = await User.findOne({ mail: normalizedMail });

    if (foundUser) {
      return res.status(400).json({ error: "Mail already part of an account" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      username: username,
      mail: normalizedMail,
      password: hashedPassword
    });

    const savedUser = await newUser.save();

    const token = jwt.sign({ userId: savedUser._id }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

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

app.post("/api/loginUser", async (req, res) => {
  try {
    const { mail, password } = req.body;

    if (!mail || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const normalizedMail = mail.toLowerCase().trim();
    const foundUserByMail = await User.findOne({ mail: normalizedMail });

    if (!foundUserByMail) {
      return res.status(400).json({ error: "Mail not found", message: "E-mail address not found in database" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, foundUserByMail.password);

    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: foundUserByMail._id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const userResponse = foundUserByMail.toObject();
    delete userResponse.password;

    return res.status(200).json({ message: "User authenticated successfully", data: userResponse });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Error logging user in", error: err.message });
  }
});

app.get('/api/getUser', async (req, res) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const foundUser = await User.findById(decoded.userId);

    if (!foundUser) {
      return res.status(404).json({ error: "User not found!" });
    }

    const userResponse = foundUser.toObject();
    delete userResponse.password;

    return res.status(200).json({ message: "success", data: userResponse });

  } catch (err) {
    return res.status(401).json({
      error: "Invalid or expired token",
      message: err.message
    });
  }
});

// 6. LOGOUT
app.post('/api/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });

  return res.status(200).json({ message: "Logged out successfully" });
});


app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json({ message: 'success', data: categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});