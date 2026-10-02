// Motheo Morena u24666981

import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

let client = null;
let db = null;

export async function connectToDatabase() {
    // Reuse existing connection if already established
    if (db) return db;

    const uri = process.env.MONGODB_URI;

    if (!uri) {
        throw new Error("MONGODB_URI is not defined in the environment variables.");
    }

    try {
        // Safe logging without brittle string splitting
        const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@");
        console.log("Connecting to MongoDB with URI:", maskedUri);

        client = new MongoClient(uri);

        // Connect to the MongoDB cluster
        await client.connect();
        console.log("Successfully connected to MongoDB");

        // Specify the database name
        db = client.db("astrea");
        return db;
    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
        throw error;
    }
}

export function getDatabase() {
    if (!db) {
        throw new Error("Database not connected. Call connectToDatabase first.");
    }
    return db;
}

export async function closeDatabaseConnection() {
    if (client) {
        await client.close();
        client = null;
        db = null;
        console.log("MongoDB connection closed.");
    }
}