import express from "express";
import {} from "dotenv/config";
const app = express();
import connectDB from "./db/index.js";
import mongoose from "mongoose";


connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
});

// (async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         console.log("Database connected: ",process.env.MONGODB_URI)

//         app.listen(process.env.PORT, () => {
//             console.log(`Example app listening on port ${process.env.PORT}`)
//           })
//     } catch (error) {
//         console.error("ERROR: ",error)
//         throw error
//     }
// })()

