// utils/database.js
import mongoose from 'mongoose';

let cached = global.mongoose || { conn: null, promise: null };

export const connectToDB = async () => {
  mongoose.set('strictQuery', true);

  // ✨ DISABILITA CACHE QUERY PER RAILWAY - forza fresh data
  mongoose.set('autoIndex', true);

  if (cached.conn) {
    // ✨ Verifica che la connessione sia ancora valida
    if (mongoose.connection.readyState === 1) {
      return cached.conn;
    }
    // Se non è valida, resetta
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      dbName: "Webarea",
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // ✨ CONFIGURAZIONI ANTI-CACHE PER RAILWAY
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }).then((mongoose) => {
      console.log("✅ Connessione Mongo avvenuta (Railway)");
      return mongoose;
    }).catch((err) => {
      console.error("❌ Errore Mongo:", err);
      // ✨ Reset cache on error
      cached.conn = null;
      cached.promise = null;
      throw err;
    });
  }

  cached.conn = await cached.promise;
  global.mongoose = cached;
  return cached.conn;
};
