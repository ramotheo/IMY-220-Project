// Motheo Morena u24666981

import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";
import { fileURLToPath } from "url";

import { connectToDatabase, getDatabase } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDirectory = path.join(__dirname, "uploads");

// =====================
// IMAGE DOWNLOAD
// =====================

async function downloadImage(url, filename) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download image: ${url}`);
  }

  const buffer = await response.arrayBuffer();

  fs.writeFileSync(path.join(uploadDirectory, filename), Buffer.from(buffer));
}

// =====================
// SEED DATA
// =====================

const users = [
  {
    username: "motheo",
    email: "motheo@example.com",
    password: "password123",
  },
  {
    username: "alex",
    email: "alex@example.com",
    password: "password123",
  },
  {
    username: "sarah",
    email: "sarah@example.com",
    password: "password123",
  },

  // Add the remaining users here...
];

const imageUrls = [
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
  "https://images.unsplash.com/photo-1493246507139-91e8fad9978e",
  "https://images.unsplash.com/photo-1470770841072-f978cf4d019e",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
];

// =====================
// SEED DATABASE
// =====================

async function seedDatabase() {
  await connectToDatabase();

  const db = getDatabase();

  const usersCollection = db.collection("users");
  const postsCollection = db.collection("posts");

  // Clear existing seed data
  await usersCollection.deleteMany({});
  await postsCollection.deleteMany({});

  // Make sure uploads directory exists
  if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory);
  }

    // Hash passwords
    const hashedUsers = [];

    for (const user of users) {
        const hashedPassword = await bcrypt.hash(user.password, 10);

        hashedUsers.push({
            username: user.username,
            email: user.email,
            password: hashedPassword,
        });
    }

    await usersCollection.insertMany(hashedUsers);

  console.log(`${users.length} users inserted.`);

  // Download images
  for (let i = 0; i < imageUrls.length; i++) {
    const filename = `seed-${i + 1}.jpg`;
    console.log(`Downloading ${filename}...`);
    await downloadImage(imageUrls[i], filename);
  }

  // Create posts
  const posts = [];

  for (const user of users) {
    for (let i = 0; i < 5; i++) {
      const imageIndex = Math.floor(Math.random() * imageUrls.length);

      posts.push({
        username: user.username,
        caption: `This is ${user.username}'s photo ${i + 1}! 📸`,
        image: `seed-${imageIndex + 1}.jpg`,
        likes: 0,
        comments: [],
      });
    }
  }

  await postsCollection.insertMany(posts);

  console.log(`${posts.length} posts inserted.`);
  console.log("Database seeded successfully!");
  process.exit(0);
}

seedDatabase();