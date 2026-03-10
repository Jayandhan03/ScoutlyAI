import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable in .env.local");
}

interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

// Use a global cache to prevent multiple connections in development (hot reload)
const globalWithMongoose = global as typeof globalThis & {
    mongoose: MongooseCache;
};

if (!globalWithMongoose.mongoose) {
    globalWithMongoose.mongoose = { conn: null, promise: null };
}

const cached = globalWithMongoose.mongoose;

export async function connectToDatabase(): Promise<typeof mongoose> {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, {
            bufferCommands: false,
            serverSelectionTimeoutMS: 5000, // Fail fast — don't block sign-in for 30s
            connectTimeoutMS: 5000,
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (err) {
        // Reset so the next sign-in attempt actually retries the connection
        cached.promise = null;
        throw err;
    }

    return cached.conn;
}

