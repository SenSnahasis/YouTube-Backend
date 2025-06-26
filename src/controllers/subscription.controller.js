import mongoose, { isValidObjectId } from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { Subscription } from "../models/subscription.models.js"
import { ApiResponse } from "../utils/ApiResponse.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }

    if (!req?.user || !req.user?._id) {
        throw new ApiError(401, "Unauthorized: Please login")
    }

    const isSubscribed = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    })

    if (isSubscribed) {
        await isSubscribed.deleteOne()

        return res.status(200)
            .json(new ApiResponse(200, { isSubscribed: false }, "Channel unsubscribed successfully"))
    }

    await Subscription.create({
        subscriber: req.user._id,
        channel: channelId
    })

    return res.status(200)
        .json(new ApiResponse(200, { isSubscribed: true }, "Channel subscribed successfully"))
})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }

    const getSubscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $count: "subscribersCount"
        }
    ])

    return res.status(200)
        .json(new ApiResponse(200, getSubscribers, "Subscriber count fetch successfully"))
})

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid channel ID")
    }

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedChannel",
                pipeline: [
                    {
                        $lookup: {
                            from: "videos",
                            localField: "_id",
                            foreignField: "owner",
                            as: "video"
                        }
                    },
                    {
                        $addFields: {
                            latestVideo: {
                                $last: "$video"
                            }
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$subscribedChannel"
        },
        {
            $project: {
                _id: 1,
                subscribedChannel: {
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1,
                    latestVideo: {
                        _id: 1,
                        "videoFile.url": 1,
                        "thumbnail.url": 1,
                        owner: 1,
                        title: 1,
                        description: 1,
                        duration: 1,
                        createdAt: 1,
                        views: 1
                    },
                }
            }
        }
    ])

    return res.status(200)
        .json(new ApiResponse(200, subscribedChannels, "Subscribed channels fetch successfully"))
})

export {
    getUserChannelSubscribers,
    toggleSubscription,
    getSubscribedChannels
}