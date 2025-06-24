import mongoose, { isValidObjectId } from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { Like } from "../models/like.models.js"
import { ApiResponse } from "../utils/ApiResponse.js"


const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    if (!req.user || !req.user._id) {
        throw new ApiError(401, "Unauthorized: Please login")
    }

    const likedAlready = await Like.findOne({
        video: videoId,
        likeBy: req.user._id
    })

    if (likedAlready) {
        await likedAlready.deleteOne()

        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: false }, "Video unliked successfully"))
    }

    await Like.create({
        video: videoId,
        likeBy: req.user._id
    })

    return res
        .status(200)
        .json(new ApiResponse(200, { isLiked: true }, "Video liked successfully"))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }

    if (!req.user || !req.user._id) {
        throw new ApiError(401, "Unauthorized: Please login")
    }

    const isCommentLiked = await Like.findOne({
        comment: commentId,
        likeBy: req.user._id
    })

    if (isCommentLiked) {
        await isCommentLiked.deleteOne()

        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: false }, "Comment unliked successfully"))
    }

    await Like.create({
        comment: commentId,
        likeBy: req.user._id
    })

    return res
        .status(200)
        .json(new ApiResponse(200, { isLiked: true }, "Comment liked successfully"))
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID")
    }

    if (!req.user || !req.user._id) {
        throw new ApiError(401, "Unauthorized: Please login")
    }

    const isTweetLiked = await Like.findOne({
        tweet: tweetId,
        likeBy: req.user._id
    })

    if (isTweetLiked) {
        await isTweetLiked.deleteOne()

        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: false }, "Tweet unliked siccessfully"))
    }

    await Like.create({
        tweet: tweetId,
        likeBy: req.user._id
    })

    return res
        .status(200)
        .json(new ApiResponse(200, { isLiked: true }, "Tweet liked successfully"))
})

const getLikedVideos = asyncHandler(async (req, res) => {
    
    if(!req?.user || !req.user?._id) {
        throw new ApiError(401, "Unauthorized: Please login")
    }

    const likedVideos = await Like.aggregate([
        {
            $match: {
                likeBy: new mongoose.Types.ObjectId(req.user._id),
                video: {$ne: null}
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideos"
            }
        },
        {
            $unwind: "$likedVideos"
        },
        {
            $lookup: {
                from: "users",
                localField: "likedVideos.owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        {
            $unwind: "$ownerDetails"
        },
        {
            $project: {
                _id: 0,
                _videoId: "$likedVideos._id",
                videoFile: "$likedVideos.videoFile",
                thumbnail: "$likedVideos.thumbnail",
                title: "$likedVideos.title",
                description: "$likedVideos.description",
                duration: "$likedVideos.duration",
                views: "$likedVideos.views",
                createdAt: "$likedVideos.createdAt",
                isPublished: "$likedVideos.isPublished",
                owner: {
                    username: "$ownerDetails.username",
                    avatar: "$ownerDetails.avatar",
                    fullName: "$ownerDetails.fullname"
                }
            }
        }
    ])

    return res.status(200).json(
        new ApiResponse(
            200,
            likedVideos,
            "Liked videos fetched successfully"
        )
    )
})

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}