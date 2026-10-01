// Motheo Morena u24666981

import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";

import upload from "./multer.js";

import { connectToDatabase, getDatabase } from "./db.js";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Allow uploaded images to be accessed
app.use("/uploads", express.static("uploads"));

/*
===================== AUTHENTICATION ENDPOINTS =====================
*/

// Login endpoint (Fixed)
app.post("/api/auth/login", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Ensure required fields exist
        const identifier = username || email;
        if (!identifier || !password) {
            return res.status(400).json({
                success: false,
                message: "Username/email and password are required.",
            });
        }

        const db = getDatabase();

        // Search for user by either username or email
        const user = await db.collection("users").findOne({
            $or: [{ username: identifier }, { email: identifier }],
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials.",
            });
        }

        // Verify password hash
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials.",
            });
        }

        res.json({
            success: true,
            message: "Login successful",
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("Error logging in: ", error);
        res.status(500).json({
            success: false,
            message: "Error logging in",
        });
    }
});

// Signup endpoint
app.post("/api/auth/signup", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required.",
            });
        }

        const db = getDatabase();

        // Check if username or email already exists
        const existingUser = await db.collection("users").findOne({
            $or: [{ username }, { email }],
        });

        if (existingUser) {
            const conflictField = existingUser.username === username ? "Username" : "Email";
            return res.status(400).json({
                success: false,
                message: `${conflictField} already exists`,
            });
        }

        // Encrypt the password before storing it in the database
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create new user
        const newUser = {
            username,
            email,
            password: hashedPassword,
            createdAt: new Date(),
        };

        const result = await db.collection("users").insertOne(newUser);

        res.status(201).json({
            success: true,
            message: "Account created successfully",
            user: {
                _id: result.insertedId,
                username,
                email,
            },
        });
    } catch (error) {
        console.error("Error creating user: ", error);
        res.status(500).json({
            success: false,
            message: "Error creating user",
        });
    }
});

/*
===================== IMAGE UPLOAD ENDPOINT =====================
*/

// Image upload endpoint
app.post("/api/upload", upload.single("image"), async (req, res) => {
    try {
        const { username, caption } = req.body;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "An image file is required for upload.",
            });
        }

        const db = getDatabase();

        const post = {
            username: username || "Anonymous",
            caption: caption || "",
            image: req.file.filename,
            likes: 0,
            comments: [],
            createdAt: new Date(),
        };

        const result = await db.collection("posts").insertOne(post);

        res.status(201).json({
            success: true,
            message: "Post created successfully",
            post: {
                _id: result.insertedId,
                ...post,
            },
        });
    } catch (error) {
        console.error("Error creating post: ", error);
        res.status(500).json({
            success: false,
            message: "Error creating post",
        });
    }
});

/*
===================== SERVER INITIALIZATION =====================
*/

connectToDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Backend running on http://localhost:${PORT}`);
    });
}).catch((err) => {
    console.error("Failed to connect to the database:", err);
});