// Motheo Morena u24666981

import express from "express";
import cors from "cors";
import { ObjectId } from "mongodb";

import upload from "./multer.js";

import { connectToDatabase, getDatabase } from "./db.js";

const app = express();
const PORT = 3000;
const defaultProfilePictures = {
    motheo: "seed-1.jpg",
    alex: "seed-2.jpg",
    sarah: "seed-3.jpg",
};
const defaultReportReasons = [
    "Spam",
    "Harassment",
    "Misleading content",
    "Hate speech",
    "Inappropriate content",
];

app.use(cors());
app.use(express.json());

// Allow uploaded images to be accessed
app.use("/uploads", express.static("uploads"));

function serializeUser(user, likes = 0) {
    return {
        _id: user._id.toString(),
        username: user.username,
        name: user.name || user.username,
        profilePicture: user.profilePicture || defaultProfilePictures[user.username] || "",
        bio: user.bio || "",
        following: (user.following || []).map((id) => id.toString()),
        followers: (user.followers || []).map((id) => id.toString()),
        bookmarkedPostIds: (user.bookmarkedPostIds || []).map((id) => id.toString()),
        resharedPostIds: (user.resharedPostIds || []).map((id) => id.toString()),
        likes,
        isAdmin: Boolean(user.isAdmin),
        verified: Boolean(user.verified),
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
        hashtags: post.hashtags || [],
        image: /^https?:\/\//i.test(post.image)
            ? post.image
            : `/uploads/${encodeURIComponent(post.image)}`,
        likes: (post.likes || []).map((userId) => userId.toString()),
        comments,
        createdAt: post.createdAt,
        hidden: post.hidden || false,
        locked: post.locked || false,
        views: post.views || 0,
        reports: (post.reports || []).map((report) => ({
            ...report,
            reporterId: report.reporterId?.toString?.() || report.reporterId,
            createdAt: report.createdAt || new Date(),
        })),
    };
}

function normalizeHashtags(hashtags) {
    if (!Array.isArray(hashtags)) return [];
    return [...new Set(hashtags
        .filter((hashtag) => typeof hashtag === "string")
        .map((hashtag) => hashtag.trim().replace(/^#+/, "").toLowerCase())
        .filter((hashtag) => /^[a-z0-9_]+$/.test(hashtag))
    )].slice(0, 30);
}

function serializeAlbum(album, usersById) {
    const owner = usersById.get(album.ownerId.toString());
    return {
        id: album._id.toString(),
        ownerId: album.ownerId.toString(),
        ownerUsername: owner?.username || "Unknown",
        name: album.name,
        description: album.description || "",
        hashtags: album.hashtags || [],
        postIds: (album.postIds || []).map((id) => id.toString()),
        createdAt: album.createdAt,
        updatedAt: album.updatedAt,
    };
}

async function getUsersById(db) {
    const users = await db.collection("users").find({}).toArray();
    return new Map(users.map((user) => [user._id.toString(), user]));
}

async function ensureAdminAccount() {
    const db = getDatabase();
    const adminEmail = process.env.ADMIN_EMAIL || "admin@astrea.app";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

    const existingAdmin = await db.collection("users").findOne({ email: adminEmail });
    const reportReasons = await db.collection("reportReasons").find({}).toArray();
    if (reportReasons.length === 0) {
        await db.collection("reportReasons").insertMany(
            defaultReportReasons.map((reason) => ({ reason, createdAt: new Date() }))
        );
    }

    if (existingAdmin) {
        await db.collection("users").updateOne(
            { _id: existingAdmin._id },
            { $set: { isAdmin: true, verified: true, name: "Astrea Admin", username: "admin" } }
        );
        return;
    }

    await db.collection("users").insertOne({
        _id: new ObjectId(),
        username: "admin",
        name: "Astrea Admin",
        email: adminEmail,
        password: adminPassword,
        profilePicture: "",
        bio: "Platform administrator",
        followers: [],
        following: [],
        bookmarkedPostIds: [],
        resharedPostIds: [],
        isAdmin: true,
        verified: true,
        createdAt: new Date(),
    });
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

app.get("/api/albums", async (req, res) => {
    try {
        const db = getDatabase();
        const [albums, usersById] = await Promise.all([
            db.collection("albums").find({}).sort({ updatedAt: -1 }).toArray(),
            getUsersById(db),
        ]);
        res.json(albums.map((album) => serializeAlbum(album, usersById)));
    } catch (error) {
        console.error("Error loading albums:", error);
        res.status(500).json({ message: "Unable to load albums." });
    }
});

app.get("/api/admin/report-reasons", async (req, res) => {
    try {
        const db = getDatabase();
        const reasons = await db.collection("reportReasons")
            .find({})
            .sort({ createdAt: 1 })
            .toArray();
        res.json(reasons.map((reason) => ({ id: reason._id.toString(), reason: reason.reason })));
    } catch (error) {
        console.error("Error loading report reasons:", error);
        res.status(500).json({ message: "Unable to load report reasons." });
    }
});

app.post("/api/admin/report-reasons", async (req, res) => {
    try {
        const { reason, userId } = req.body;
        if (!reason || typeof reason !== "string" || !reason.trim()) {
            return res.status(400).json({ message: "A valid report reason is required." });
        }

        const db = getDatabase();
        const actingUser = ObjectId.isValid(userId)
            ? await db.collection("users").findOne({ _id: new ObjectId(userId) })
            : null;
        if (!actingUser?.isAdmin) {
            return res.status(403).json({ message: "Admin access required." });
        }

        const trimmedReason = reason.trim();
        const existingReason = await db.collection("reportReasons").findOne({
            reason: { $regex: new RegExp(`^${trimmedReason}$`, "i") },
        });
        if (existingReason) {
            return res.status(409).json({ message: "That report reason already exists." });
        }

        const insertResult = await db.collection("reportReasons").insertOne({
            reason: trimmedReason,
            createdAt: new Date(),
        });

        res.status(201).json({
            id: insertResult.insertedId.toString(),
            reason: trimmedReason,
        });
    } catch (error) {
        console.error("Error creating report reason:", error);
        res.status(500).json({ message: "Unable to create report reason." });
    }
});

app.get("/api/admin/reports", async (req, res) => {
    try {
        const { userId } = req.query;
        const db = getDatabase();
        if (!ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "A valid admin user ID is required." });
        }

        const actingUser = await db.collection("users").findOne({ _id: new ObjectId(userId) });
        if (!actingUser?.isAdmin) {
            return res.status(403).json({ message: "Admin access required." });
        }

        const posts = await db.collection("posts")
            .find({ reports: { $exists: true, $ne: [] } })
            .sort({ createdAt: -1 })
            .toArray();
        const usersById = await getUsersById(db);
        res.json(posts.map((post) => serializePost(post, usersById)));
    } catch (error) {
        console.error("Error loading reported posts:", error);
        res.status(500).json({ message: "Unable to load reported posts." });
    }
});

app.post("/api/albums", async (req, res) => {
    try {
        const { userId, name, description, hashtags, postIds = [] } = req.body;
        if (!ObjectId.isValid(userId) || typeof name !== "string" || !name.trim()) {
            return res.status(400).json({ message: "A valid user and album name are required." });
        }
        if (name.trim().length > 80 ||
            (description !== undefined &&
                (typeof description !== "string" || description.length > 500)) ||
            !Array.isArray(postIds) || postIds.some((id) => !ObjectId.isValid(id))) {
            return res.status(400).json({ message: "Album details are invalid." });
        }

        const db = getDatabase();
        const owner = await db.collection("users").findOne({ _id: new ObjectId(userId) });
        if (!owner) return res.status(404).json({ message: "User not found." });

        const selectedPostIds = [...new Set(postIds)].map((id) => new ObjectId(id));
        if (selectedPostIds.length) {
            const validPostCount = await db.collection("posts").countDocuments({
                _id: { $in: selectedPostIds },
                hidden: { $ne: true },
                locked: { $ne: true },
            });
            if (validPostCount !== selectedPostIds.length) {
                return res.status(400).json({ message: "Albums can only include available posts." });
            }
        }

        const album = {
            ownerId: owner._id,
            name: name.trim(),
            description: typeof description === "string" ? description.trim() : "",
            hashtags: normalizeHashtags(hashtags),
            postIds: selectedPostIds,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const result = await db.collection("albums").insertOne(album);
        res.status(201).json(serializeAlbum(
            { ...album, _id: result.insertedId },
            new Map([[owner._id.toString(), owner]])
        ));
    } catch (error) {
        console.error("Error creating album:", error);
        res.status(500).json({ message: "Unable to create album." });
    }
});

app.patch("/api/albums/:albumId", async (req, res) => {
    try {
        const { albumId } = req.params;
        const { userId, name, description, hashtags, postIds } = req.body;
        if (!ObjectId.isValid(albumId) || !ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Valid album and user IDs are required." });
        }

        const db = getDatabase();
        const actingUser = await db.collection("users").findOne({ _id: new ObjectId(userId) });
        const existingAlbum = await db.collection("albums").findOne({ _id: new ObjectId(albumId) });
        if (!existingAlbum) return res.status(404).json({ message: "Album not found." });
        if (!actingUser?.isAdmin && existingAlbum.ownerId.toString() !== userId) {
            return res.status(403).json({ message: "You can only edit your own album." });
        }

        const updates = {};
        if (name !== undefined) {
            if (typeof name !== "string" || !name.trim() || name.trim().length > 80) {
                return res.status(400).json({ message: "Album name must be between 1 and 80 characters." });
            }
            updates.name = name.trim();
        }
        if (description !== undefined) {
            if (typeof description !== "string" || description.length > 500) {
                return res.status(400).json({ message: "Album description is invalid." });
            }
            updates.description = description.trim();
        }
        if (hashtags !== undefined) updates.hashtags = normalizeHashtags(hashtags);
        if (postIds !== undefined) {
            if (!Array.isArray(postIds) || postIds.some((id) => !ObjectId.isValid(id))) {
                return res.status(400).json({ message: "Album posts are invalid." });
            }
            const selectedPostIds = [...new Set(postIds)].map((id) => new ObjectId(id));
            if (selectedPostIds.length) {
                const validPostCount = await db.collection("posts").countDocuments({
                    _id: { $in: selectedPostIds },
                    hidden: { $ne: true },
                    locked: { $ne: true },
                });
                if (validPostCount !== selectedPostIds.length) {
                    return res.status(400).json({ message: "Albums can only include available posts." });
                }
            }
            updates.postIds = selectedPostIds;
        }
        if (!Object.keys(updates).length) {
            return res.status(400).json({ message: "At least one album field must be updated." });
        }

        updates.updatedAt = new Date();
        const result = await db.collection("albums").updateOne(
            { _id: new ObjectId(albumId) },
            { $set: updates }
        );
        if (!result.matchedCount) return res.status(404).json({ message: "Album not found." });

        const [album, usersById] = await Promise.all([
            db.collection("albums").findOne({ _id: new ObjectId(albumId) }),
            getUsersById(db),
        ]);
        res.json(serializeAlbum(album, usersById));
    } catch (error) {
        console.error("Error updating album:", error);
        res.status(500).json({ message: "Unable to update album." });
    }
});

app.delete("/api/albums/:albumId", async (req, res) => {
    try {
        const { albumId } = req.params;
        const { userId } = req.body;
        if (!ObjectId.isValid(albumId) || !ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Valid album and user IDs are required." });
        }

        const db = getDatabase();
        const actingUser = await db.collection("users").findOne({ _id: new ObjectId(userId) });
        const album = await db.collection("albums").findOne({ _id: new ObjectId(albumId) });
        if (!album) return res.status(404).json({ message: "Album not found." });
        if (!actingUser?.isAdmin && album.ownerId.toString() !== userId) {
            return res.status(403).json({ message: "You can only delete your own album." });
        }

        await db.collection("albums").deleteOne({ _id: new ObjectId(albumId) });
        res.status(204).end();
    } catch (error) {
        console.error("Error deleting album:", error);
        res.status(500).json({ message: "Unable to delete album." });
    }
});

app.post("/api/posts", async (req, res) => {
    try {
        const { userId, image, caption, hashtags } = req.body;
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
            hashtags: normalizeHashtags(hashtags),
            likes: [],
            comments: [],
            reports: [],
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
        const { username, name, bio, actingUserId } = req.body;
        if (!ObjectId.isValid(userId) || !username?.trim() || !name?.trim()) {
            return res.status(400).json({ message: "A valid user, name, and username are required." });
        }

        const db = getDatabase();
        const actingUser = ObjectId.isValid(actingUserId)
            ? await db.collection("users").findOne({ _id: new ObjectId(actingUserId) })
            : null;
        if (!actingUser?.isAdmin && actingUserId && actingUserId !== userId) {
            return res.status(403).json({ message: "You can only edit your own profile." });
        }

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

app.post("/api/posts/:postId/report", async (req, res) => {
    try {
        const { postId } = req.params;
        const { userId, reason } = req.body;
        if (!ObjectId.isValid(postId) || !ObjectId.isValid(userId) || !reason || typeof reason !== "string") {
            return res.status(400).json({ message: "A valid post, user, and report reason are required." });
        }

        const db = getDatabase();
        const post = await db.collection("posts").findOne({ _id: new ObjectId(postId) });
        if (!post) return res.status(404).json({ message: "Post not found." });

        const trimmedReason = reason.trim();
        const alreadyReported = (post.reports || []).some((entry) =>
            entry.reporterId?.toString() === userId && entry.reason === trimmedReason
        );
        if (alreadyReported) {
            return res.status(409).json({ message: "You already reported this post for that reason." });
        }

        const updatedPost = await db.collection("posts").findOneAndUpdate(
            { _id: new ObjectId(postId) },
            {
                $push: {
                    reports: {
                        reporterId: new ObjectId(userId),
                        reason: trimmedReason,
                        createdAt: new Date(),
                    },
                },
            },
            { returnDocument: "after" }
        );

        res.status(201).json(serializePost(updatedPost.value, await getUsersById(db)));
    } catch (error) {
        console.error("Error reporting post:", error);
        res.status(500).json({ message: "Unable to report this post." });
    }
});

app.patch("/api/posts/:postId", async (req, res) => {
    try {
        const { postId } = req.params;
        const { userId, caption, hashtags, actingUserId } = req.body;
        if (!ObjectId.isValid(postId) || !ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "A valid post and user ID are required." });
        }

        const db = getDatabase();
        const actingUser = ObjectId.isValid(actingUserId)
            ? await db.collection("users").findOne({ _id: new ObjectId(actingUserId) })
            : null;
        const post = await db.collection("posts").findOne({ _id: new ObjectId(postId) });
        if (!post) return res.status(404).json({ message: "Post not found." });
        if (!actingUser?.isAdmin && post.authorId.toString() !== userId) {
            return res.status(403).json({ message: "You can only edit your own posts." });
        }

        const updates = {};
        if (caption !== undefined) {
            if (typeof caption !== "string") return res.status(400).json({ message: "Caption must be a string." });
            updates.caption = caption.trim();
        }
        if (hashtags !== undefined) {
            updates.hashtags = normalizeHashtags(hashtags);
        }

        if (!Object.keys(updates).length) {
            return res.status(400).json({ message: "At least one post field must be updated." });
        }

        await db.collection("posts").updateOne(
            { _id: new ObjectId(postId) },
            { $set: updates }
        );

        const updatedPost = await db.collection("posts").findOne({ _id: new ObjectId(postId) });
        res.json(serializePost(updatedPost, await getUsersById(db)));
    } catch (error) {
        console.error("Error updating post:", error);
        res.status(500).json({ message: "Unable to update post." });
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
        const actingUser = await db.collection("users").findOne({ _id: new ObjectId(userId) });
        const post = await db.collection("posts").findOne({ _id: new ObjectId(postId) });
        if (!post) {
            return res.status(404).json({ message: "Post not found." });
        }
        if (!actingUser?.isAdmin && post.authorId.toString() !== userId) {
            return res.status(403).json({ message: "You can only modify your own posts." });
        }

        await db.collection("posts").updateOne(
            { _id: new ObjectId(postId) },
            { $set: { [property]: value } }
        );

        const updatedPost = await db.collection("posts").findOne({ _id: new ObjectId(postId) });
        res.json(serializePost(updatedPost, await getUsersById(db)));
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

        const db = getDatabase();
        const actingUser = await db.collection("users").findOne({ _id: new ObjectId(userId) });
        const post = await db.collection("posts").findOne({ _id: new ObjectId(postId) });
        if (!post) {
            return res.status(404).json({ message: "Post not found." });
        }
        if (!actingUser?.isAdmin && post.authorId.toString() !== userId) {
            return res.status(403).json({ message: "You can only delete your own posts." });
        }

        await db.collection("posts").deleteOne({ _id: new ObjectId(postId) });

        await db.collection("albums").updateMany(
            { postIds: new ObjectId(postId) },
            { $pull: { postIds: new ObjectId(postId) } }
        );
        res.status(204).end();
    } catch (error) {
        console.error("Error deleting post:", error);
        res.status(500).json({ message: "Unable to delete post." });
    }
});

app.delete("/api/users/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const { actingUserId } = req.body || {};
        if (!ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "A valid user ID is required." });
        }

        const db = getDatabase();
        const actingUser = ObjectId.isValid(actingUserId)
            ? await db.collection("users").findOne({ _id: new ObjectId(actingUserId) })
            : null;
        if (!actingUser?.isAdmin && actingUserId && actingUserId !== userId) {
            return res.status(403).json({ message: "You can only delete your own account." });
        }

        const userObjectId = new ObjectId(userId);
        const usersCollection = db.collection("users");
        const ownedPosts = await db.collection("posts")
            .find({ authorId: userObjectId }, { projection: { _id: 1 } })
            .toArray();
        const ownedPostIds = ownedPosts.map((post) => post._id);
        const result = await usersCollection.deleteOne({ _id: userObjectId });
        if (!result.deletedCount) {
            return res.status(404).json({ message: "User not found." });
        }

        await Promise.all([
            db.collection("posts").deleteMany({ authorId: userObjectId }),
            db.collection("albums").deleteMany({ ownerId: userObjectId }),
            db.collection("albums").updateMany(
                {},
                { $pull: { postIds: { $in: ownedPostIds } } }
            ),
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

app.patch("/api/users/:userId/verification", async (req, res) => {
    try {
        const { userId } = req.params;
        const { actingUserId, verified } = req.body;
        if (!ObjectId.isValid(userId) || !ObjectId.isValid(actingUserId)) {
            return res.status(400).json({ message: "Valid user IDs are required." });
        }

        const db = getDatabase();
        const actingUser = await db.collection("users").findOne({ _id: new ObjectId(actingUserId) });
        if (!actingUser?.isAdmin) {
            return res.status(403).json({ message: "Admin access required." });
        }

        const user = await db.collection("users").findOneAndUpdate(
            { _id: new ObjectId(userId) },
            { $set: { verified: Boolean(verified) } },
            { returnDocument: "after" }
        );
        if (!user.value) {
            return res.status(404).json({ message: "User not found." });
        }

        res.json(serializeUser(user.value));
    } catch (error) {
        console.error("Error updating verification:", error);
        res.status(500).json({ message: "Unable to update verification status." });
    }
});

/*
===================== AUTHENTICATION ENDPOINTS =====================
*/

app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = typeof email === "string" ? email.trim() : "";

        if (!normalizedEmail || typeof password !== "string" || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required.",
            });
        }

        const db = getDatabase();
        const user = await db.collection("users").findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Email not found.",
            });
        }

        if (password !== user.password) {
            return res.status(401).json({
                success: false,
                message: "Invalid password.",
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
        const normalizedEmail = typeof email === "string" ? email.trim() : "";

        if (!normalizedEmail || typeof password !== "string" || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required.",
            });
        }

        const db = getDatabase();

        const existingUser = await db.collection("users").findOne({ email: normalizedEmail });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email already exists.",
            });
        }

        // Create new user
        const userId = new ObjectId();
        const username = `user_${userId.toString().slice(-8)}`;
        const newUser = {
            _id: userId,
            username,
            email: normalizedEmail,
            password,
            name: username,
            profilePicture: null,
            bio: "",
            followers: [],
            following: [],
            bookmarkedPostIds: [],
            resharedPostIds: [],
            isAdmin: false,
            verified: false,
            createdAt: new Date(),
        };

        const result = await db.collection("users").insertOne(newUser);

        res.status(201).json({
            success: true,
            message: "Account created successfully",
            user: {
                ...serializeUser({ ...newUser, _id: result.insertedId }),
                email: normalizedEmail,
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
        const { userId, caption, hashtags } = req.body;

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
            hashtags: normalizeHashtags(
                typeof hashtags === "string" ? hashtags.split(",") : hashtags
            ),
            image: req.file.filename,
            likes: [],
            comments: [],
            reports: [],
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

connectToDatabase()
    .then(async () => {
        await ensureAdminAccount();
        app.listen(PORT, () => {
            console.log(`Backend running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Failed to connect to the database:", err);
    });

app.use((error, req, res, next) => {
    if (error.code === "LIMIT_FILE_SIZE" || error.code === "INVALID_FILE_TYPE") {
        return res.status(400).json({ message: error.message });
    }

    console.error("Unhandled server error:", error);
    res.status(500).json({ message: "An unexpected server error occurred." });
});