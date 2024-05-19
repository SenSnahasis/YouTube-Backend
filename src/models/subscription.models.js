import mongoose from "mongoose";

const subscriptionSchema = mongoose.Schema({
    subscriber: {
        typeof: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    channal: {
        typeof: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, {timestemps: true})


export const Subscription = mongoose.model("Subscription", subscriptionSchema)