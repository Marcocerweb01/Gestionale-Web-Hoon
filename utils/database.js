import mongoose from 'mongoose';

export const connectToDB = async () => {
    mongoose.set('strictQuery', true);

    if (mongoose.connections[0].readyState) {
        console.log("Riuso connessione MongoDB esistente");
        return;
    }

    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            dbName: "Webarea",
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        console.log(`MongoDB connesso: ${conn.connection.host}`);
    } catch (error) {
        console.error("Errore di connessione MongoDB:", error);
        throw error; // Rilancia l'errore per gestirlo adeguatamente
    }
};