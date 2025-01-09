import mongoose from 'mongoose';

let isConnected = false;

export const connectToDB = async () => {

    mongoose.set('strictQuery', true);

    if (isConnected) {
        console.log("mongodb connesso")
        return;       
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            dbName: "Webarea",
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })

        isConnected=true;
        console.log("mongodb connesso")
    } catch (error) {
        console.log(error)
    }

}