// Motheo Morena u24666981

import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";

import upload from "./multer.js";

import { connectToDatabase, getDatabase } from "./db.js";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Allow uploaded images to be accessed
app.use("/uploads", express.static("uploads"));

function serializeUser(user, likes = 0) {
    return {
        _id: user._id.toString(),
        username: user.username,
        name: user.name || user.username,
        profilePicture: user.profilePicture || "",
        bio: user.bio || "",
        following: (user.following || []).map((id) => id.toString()),
        followers: (user.followers || []).map((id) => id.toString()),
        bookmarkedPostIds: (user.bookmarkedPostIds || []).map((id) => id.toString()),
        resharedPostIds: (user.resharedPostIds || []).map((id) => id.toString()),
        likes,
        createdAt: user.createdAt,
    };
}

function serializePost(post, usersById) {
    const author = usersById.get(post.authorId?.toString());
    const comments = (post.comments || []).map((comment) => {
        const commentAuthor = usersById.get(comment.authorId?.toString());
        const createdAt = comment.createdAt || new Date();

        return {
            id: comment._id?.toString(),
            authorId: comment.authorId?.toString(),
            username: commentAuthor?.username || "Unknown",
            handle: `@${commentAuthor?.username || "unknown"}`,
            text: comment.text,
            replyTo: comment.replyTo?.toString() || null,
            createdAt,
            time: new Date(createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            }),
        };
    });

    return {
        id: post._id.toString(),
        authorId: post.authorId?.toString(),
        username: author?.username || "Unknown",
        caption: post.caption || "",
        image: /^https?:\/\//i.test(post.image)
            ? post.image
            : `/uploads/${encodeURIComponent(post.image)}`,
        likes: (post.likes || []).map((userId) => userId.toString()),
        comments,
        createdAt: post.createdAt,
        hidden: post.hidden || false,
        locked: post.locked || false,
        views: post.views || 0,
    };
}

async function getUsersById(db) {
    const users = await db.collection("users").find({}).toArray();
    return new Map(users.map((user) => [user._id.toString(), user]));
}

app.get("/api/users", async (req, res) => {
    try {
        const db = getDatabase();
        const users = await db.collection("users").find({}).toArray();
        const likeCounts = await db.collection("posts").aggregate([
            { $unwind: "$likes" },
            { $group: { _id: "$authorId", count: { $sum: 1 } } },
        ]).toArray();
        const likesByAuthorId = new Map(
            likeCounts.map((item) => [item._id.toString(), item.count])
        );

        res.json(users.map((user) =>
            serializeUser(user, likesByAuthorId.get(user._id.toString()) || 0)
        ));
    } catch (error) {
        console.error("Error loading users:", error);
        res.status(500).json({ message: "Unable to load users." });
    }
});

app.get("/api/posts", async (req, res) => {
    try {
        const db = getDatabase();
        const usersById = await getUsersById(db);
        const posts = await db.collection("posts")
            .find({})
            .sort({ createdAt: -1 })
            .toArray();

        res.json(posts.map((post) => serializePost(post, usersById)));
    } catch (error) {
        console.error("Error loading posts:", error);
        res.status(500).json({ message: "Unable to load posts." });
    }
});

app.post("/api/posts", async (req, res) => {
    try {
        const { userId, image, caption } = req.body;
        if (!ObjectId.isValid(userId) || typeof image !== "string" || !image.trim()) {
            return res.status(400).json({ message: "A user and image are required." });
        }

        const db = getDatabase();
        const author = await db.collection("users").findOne({
            _id: new ObjectId(userId),
        });
        if (!author) {
            return res.status(404).json({ message: "User not found." });
        }

        const post = {
            authorId: author._id,
            image: image.trim(),
            caption: typeof caption === "string" ? caption.trim() : "",
            likes: [],
            comments: [],
            hidden: false,
            locked: false,
            createdAt: new Date(),
        };
        const result = await db.collection("posts").insertOne(post);

        res.status(201).json(serializePost(
            { ...post, _id: result.insertedId },
            new Map([[author._id.toString(), author]])
        ));
    } catch (error) {
        console.error("Error creating post:", error);
        res.status(500).json({ message: "Unable to create post." });
    }
});

app.patch("/api/users/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const { username, name, bio } = req.body;
        if (!ObjectId.isValid(userId) || !username?.trim() || !name?.trim()) {
            return res.status(400).json({ message: "A valid user, name, and username are required." });
        }

        const db = getDatabase();
        const existingUser = await db.collection("users").findOne({
            username: username.trim(),
            _id: { $ne: new ObjectId(userId) },
        });
        if (existingUser) {
            return res.status(409).json({ message: "Username already exists." });
        }

        await db.collection("users").updateOne(
            { _id: new ObjectId(userId) },
            { $set: {
                username: username.trim(),
                name: name.trim(),
                bio: typeof bio === "string" ? bio.trim() : "",
            } }
        );
        const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        res.json(serializeUser(user));
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Unable to update profile." });
    }
});

app.post("/api/users/:userId/profile-picture", upload.single("image"), async (req, res) => {
    try {
        const { userId } = req.params;
        if (!ObjectId.isValid(userId) || !req.file) {
            return res.status(400).json({ message: "A valid user and image file are required." });
        }

        const db = getDatabase();
        const result = await db.collection("users").updateOne(
            { _id: new ObjectId(userId) },
            { $set: { profilePicture: req.file.filename } }
        );
        if (!result.matchedCount) {
            return res.status(404).json({ message: "User not found." });
        }

        const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
        res.json(serializeUser(user));
    } catch (error) {
        console.error("Error uploading profile picture:", error);
        res.status(500).json({ message: "Unable to upload profile picture." });
    }
});

app.post("/api/users/:userId/follow", async (req, res) => {
    try {
        const { userId } = req.params;
        const { targetUserId } = req.body;
        if (!ObjectId.isValid(userId) || !ObjectId.isValid(targetUserId) || userId === targetUserId) {
            return res.status(400).json({ message: "Valid, different user IDs are required." });
        }

        const db = getDatabase();
        const usersCollection = db.collection("users");
        const userObjectId = new ObjectId(userId);
        const targetObjectId = new ObjectId(targetUserId);
        const [user, target] = await Promise.all([
            usersCollection.findOne({ _id: userObjectId }),
            usersCollection.findOne({ _id: targetObjectId }),
        ]);
        if (!user || !target) {
            return res.status(404).json({ message: "User not found." });
        }

        const isFollowing = (user.following || []).some(
            (id) => id.toString() === targetUserId
        );
        const update = isFollowing ? "$pull" : "$addToSet";
        await Promise.all([
            usersCollection.updateOne({ _id: userObjectId }, { [update]: { following: targetObjectId } }),
            usersCollection.updateOne({ _id: targetObjectId }, { [update]: { followers: userObjectId } }),
        ]);

        const updatedUser = await usersCollection.findOne({ _id: userObjectId });
        res.json(serializeUser(updatedUser));
    } catch (error) {
        console.error("Error updating follow state:", error);
        res.status(500).json({ message: "Unable to update follow state." });
    }
});

app.patch("/api/users/:userId/post-state", async (req, res) => {
    try {
        const { userId } = req.params;
        const { postId, collection } = req.body;
        if (!ObjectId.isValid(userId) || !ObjectId.isValid(postId) ||
            !["bookmarkedPostIds", "resharedPostIds"].includes(collection)) {
            return res.status(400).json({ message: "Invalid profile post state." });
        }

        const db = getDatabase();
        const userObjectId = new ObjectId(userId);
        const postObjectId = new ObjectId(postId);
        const usersCollection = db.collection("users");
        const [user, post] = await Promise.all([
            usersCollection.findOne({ _id: userObjectId }),
            db.collection("posts").findOne({ _id: postObjectId }),
        ]);
        if (!user || !post) {
            return res.status(404).json({ message: "User or post not found." });
        }

        const alreadySelected = (user[collection] || []).some(
            (id) => id.toString() === postId
        );
        await usersCollection.updateOne(
            { _id: userObjectId },
            alreadySelected
                ? { $pull: { [collection]: postObjectId } }
                : { $addToSet: { [collection]: postObjectId } }
        );

        const updatedUser = await usersCollection.findOne({ _id: userObjectId });
        res.json(serializeUser(updatedUser));
    } catch (error) {
        console.error("Error updating saved or reshared posts:", error);
        res.status(500).json({ message: "Unable to update profile post state." });
    }
});

app.patch("/api/posts/:postId/like", async (req, res) => {
    try {
        const { postId } = req.params;
        const { userId } = req.body;
        if (!ObjectId.isValid(postId) || !ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Valid post and user IDs are required." });
        }

        const db = getDatabase();
        const postObjectId = new ObjectId(postId);
        const userObjectId = new ObjectId(userId);
        const postsCollection = db.collection("posts");
        const post = await postsCollection.findOne({ _id: postObjectId });
        if (!post) {
            return res.status(404).json({ message: "Post not found." });
        }

        const hasLiked = (post.likes || []).some((id) => id.toString() === userId);
        await postsCollection.updateOne(
            { _id: postObjectId },
            hasLiked
                ? { $pull: { likes: userObjectId } }
                : { $addToSet: { likes: userObjectId } }
        );
        const updatedPost = await postsCollection.findOne({ _id: postObjectId });
        res.json(serializePost(updatedPost, await getUsersById(db)));
    } catch (error) {
        console.error("Error updating post like:", error);
        res.status(500).json({ message: "Unable to update post like." });
    }
});

app.post("/api/posts/:postId/comments", async (req, res) => {
    try {
        const { postId } = req.params;
        const { userId, text, replyTo } = req.body;
        if (!ObjectId.isValid(postId) || !ObjectId.isValid(userId) || !text?.trim()) {
            return res.status(400).json({ message: "A valid post, user, and comment are required." });
        }

        const db = getDatabase();
        const author = await db.collection("users").findOne({ _id: new ObjectId(userId) });
        if (!author) {
            return res.status(404).json({ message: "User not found." });
        }

        const comment = {
            _id: new ObjectId(),
            authorId: author._id,
            text: text.trim(),
            replyTo: ObjectId.isValid(replyTo) ? new ObjectId(replyTo) : null,
            createdAt: new Date(),
        };
        const result = await db.collection("posts").updateOne(
            { _id: new ObjectId(postId) },
            { $push: { comments: comment } }
        );
        if (!result.matchedCount) {
            return res.status(404).json({ message: "Post not found." });
        }

        const post = await db.collection("posts").findOne({ _id: new ObjectId(postId) });
        res.status(201).json(serializePost(post, await getUsersById(db)));
    } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).json({ message: "Unable to add comment." });
    }
});

app.patch("/api/posts/:postId/visibility", async (req, res) => {
    try {
        const { postId } = req.params;
        const { userId, property, value } = req.body;
        if (!ObjectId.isValid(postId) || !ObjectId.isValid(userId) ||
            !["hidden", "locked"].includes(property) || typeof value !== "boolean") {
            return res.status(400).json({ message: "Invalid post visibility update." });
        }

        const db = getDatabase();
        const result = await db.collection("posts").updateOne(
            { _id: new ObjectId(postId), authorId: new ObjectId(userId) },
            { $set: { [property]: value } }
        );
        if (!result.matchedCount) {
            return res.status(404).json({ message: "Post not found." });
        }

        const post = await db.collection("posts").findOne({ _id: new ObjectId(postId) });
        res.json(serializePost(post, await getUsersById(db)));
    } catch (error) {
        console.error("Error updating post visibility:", error);
        res.status(500).json({ message: "Unable to update post visibility." });
    }
});

app.delete("/api/posts/:postId", async (req, res) => {
    try {
        const { postId } = req.params;
        const { userId } = req.body;
        if (!ObjectId.isValid(postId) || !ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Valid post and user IDs are required." });
        }

        const result = await getDatabase().collection("posts").deleteOne({
            _id: new ObjectId(postId),
            authorId: new ObjectId(userId),
        });
        if (!result.deletedCount) {
            return res.status(404).json({ message: "Post not found." });
        }

        res.status(204).end();
    } catch (error) {
        console.error("Error deleting post:", error);
        res.status(500).json({ message: "Unable to delete post." });
    }
});

app.delete("/api/users/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        if (!ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "A valid user ID is required." });
        }

        const db = getDatabase();
        const userObjectId = new ObjectId(userId);
        const usersCollection = db.collection("users");
        const result = await usersCollection.deleteOne({ _id: userObjectId });
        if (!result.deletedCount) {
            return res.status(404).json({ message: "User not found." });
        }

        await Promise.all([
            db.collection("posts").deleteMany({ authorId: userObjectId }),
            db.collection("posts").updateMany(
                { "comments.authorId": userObjectId },
                { $pull: { comments: { authorId: userObjectId } } }
            ),
            usersCollection.updateMany(
                {},
                { $pull: { followers: userObjectId, following: userObjectId } }
            ),
        ]);
        res.status(204).end();
    } catch (error) {
        console.error("Error deleting account:", error);
        res.status(500).json({ message: "Unable to delete account." });
    }
});

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
                ...serializeUser(user),
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
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required.",
            });
        }

        const db = getDatabase();

        const existingUser = await db.collection("users").findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email already exists.",
            });
        }

        // Encrypt the password before storing it in the database
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create new user
        const userId = new ObjectId();
        const username = `user_${userId.toString().slice(-8)}`;
        const newUser = {
            _id: userId,
            username,
            email,
            password: hashedPassword,
            name: username,
            profilePicture: null,
            bio: "",
            followers: [],
            following: [],
            bookmarkedPostIds: [],
            resharedPostIds: [],
            createdAt: new Date(),
        };

        const result = await db.collection("users").insertOne(newUser);

        res.status(201).json({
            success: true,
            message: "Account created successfully",
            user: {
                ...serializeUser({ ...newUser, _id: result.insertedId }),
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
        const { userId, caption } = req.body;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "An image file is required for upload.",
            });
        }

        const db = getDatabase();
        const author = ObjectId.isValid(userId)
            ? await db.collection("users").findOne({ _id: new ObjectId(userId) })
            : null;

        if (!author) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        const post = {
            authorId: author._id,
            caption: caption || "",
            image: req.file.filename,
            likes: [],
            comments: [],
            createdAt: new Date(),
        };

        const result = await db.collection("posts").insertOne(post);

        res.status(201).json(serializePost(
            { ...post, _id: result.insertedId },
            new Map([[author._id.toString(), author]])
        ));
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

app.use((error, req, res, next) => {
    if (error.code === "LIMIT_FILE_SIZE" || error.code === "INVALID_FILE_TYPE") {
        return res.status(400).json({ message: error.message });
    }

    console.error("Unhandled server error:", error);
    res.status(500).json({ message: "An unexpected server error occurred." });
});