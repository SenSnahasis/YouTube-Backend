import { asyncHandler } from "../utils/asyncHandler.js"
import { Tweet } from "../models/tweet.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { isValidObjectId } from "mongoose"


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


export {
    createTweet,
    updateTweet,
    deleteTweet
}