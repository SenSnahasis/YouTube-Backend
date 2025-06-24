import { asyncHandler } from "../utils/asyncHandler.js"
import { Tweet } from "../models/tweet.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import mongoose, { isValidObjectId } from "mongoose"


const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content is required")
    }

    if (!req.user || !req.user._id) {
        throw new ApiError(401, "Unauthorized: Please log in")
    }

    const tweet = await Tweet.create({
        owner: req.user?._id,
        content: content.trim()
    })

    if (!tweet) {
        throw new ApiError(500, "Failed to create tweet")
    }

    return res.status(201)
        .json(
            new ApiResponse(201, tweet, "Tweet created successfully")
        )
})

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    const { content } = req.body

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id")
    }

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content is required")
    }

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(404, "Tweet is not found")
    }

    if (tweet?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this tweet")
    }

    tweet.content = content.trim()
    await tweet.save()

    return res.status(200)
        .json(
            new ApiResponse(
                200, tweet, "Tweet updated successfully"
            )
        )
})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id")
    }

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(404, "Tweet is not found")
    }

    if (tweet?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this tweet")
    }

    await tweet.deleteOne()

    return res.status(200)
        .json(
            new ApiResponse(200, {}, "Tweet deleted successfully")
        )
})

const getUserTweets = asyncHandler(async (req, res) => {

    const { userId } = req.params

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID")
    }

    if (!req?.user || !req.user?._id) {
        throw new ApiError(401, "Unauthorized: Please login")
    }

    const userTweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likedTweet"
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likedTweet"
                },
                isLikedByCurrentUser: {
                    $cond: {
                        if: { $in: [req.user._id, "$likedTweet.likeBy"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                _id: 1,
                content: 1,
                owner: {
                    username: "$ownerDetails.username",
                    avatar: "$ownerDetails.avatar"
                },
                likesCount: 1,
                isLikedByCurrentUser: 1
            }
        }
    ])

    return res.status(200)
        .json(new ApiResponse(200, userTweets, "User tweets fetch successfully"))
})

export {
    createTweet,
    updateTweet,
    deleteTweet,
    getUserTweets
}