// utils/database.js
import mongoose from 'mongoose';

let cached = global.mongoose || { conn: null, promise: null };

export const connectToDB = async () => {
  mongoose.set('strictQuery', true);

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      dbName: "Webarea",
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).then((mongoose) => {
      console.log("✅ Connessione Mongo avvenuta");
      return mongoose;
    }).catch((err) => {
      console.error("❌ Errore Mongo:", err);
      throw err;
    });
  }

  cached.conn = await cached.promise;
  global.mongoose = cached;
  return cached.conn;
};
