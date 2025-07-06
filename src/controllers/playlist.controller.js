import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.models.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    if ([name, description].some((field) => !field || field.trim() === "")) {
        throw new ApiError(400, "Name and description is required")
    }

    if (!req?.user || !req.user?._id) {
        throw new ApiError(401, "Unauthorized required!, Please login")
    }

    const playlist = await Playlist.create({
        name: name.trim(),
        description: description.trim(),
        owner: req.user._id
    })

    if (!playlist) {
        throw new ApiError(500, "Something went wrong while creating playlist")
    }

    return res.status(201)
        .json(new ApiResponse(201, playlist, "Playlist created successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }

    if ([name, description].some((field) => !field || field.trim() === "")) {
        throw new ApiError(400, "Name and description is required")
    }

    if (!req?.user || !req.user?._id) {
        throw new ApiError(401, "Unauthorized required!, Please login")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "you are not authorized to update this playlist")
    }

    playlist.name = name.trim()
    playlist.description = description.trim()

    const modifiedPlaylist = await playlist.save()

    return res.status(200)
        .json(new ApiResponse(200, modifiedPlaylist, "Playlist updated successfully"))
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }

    if (!req?.user || !req.user?._id) {
        throw new ApiError(401, "Unauthorized required!, Please login")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "you are not authorized to delete this playlist")
    }

    await playlist.deleteOne()

    return res.status(200)
        .json(new ApiResponse(200, {}, "Playlist deleted successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID")
    }

    if (!req?.user || !req.user?._id) {
        throw new ApiError(401, "Unauthorized required!, Please login")
    }

    const playlist = await Playlist.findById(playlistId)
    const video = await Video.findById(videoId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString() ||
        video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(401, "You are not authorized to add this video to playlist")
    }

    const addedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: {
                videos: video._id
            }
        },
        {
            new: true
        }
    )

    if (!addedPlaylist) {
        throw new ApiError(500, "Something went wrong while adding this video to playlist")
    }

    return res.status(200)
        .json(new ApiResponse(200, addedPlaylist, "Video added successfully to playlist"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID")
    }

    if (!req?.user || !req.user?._id) {
        throw new ApiError(401, "Unauthorized required!, Please login")
    }

    const playlist = await Playlist.findById(playlistId)
    const video = await Video.findById(videoId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString() ||
        video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(401, "You are not authorized to add this video to playlist")
    }

    const removeFromPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos: video._id
            }
        },
        {
            new: true
        }
    )

    if (!removeFromPlaylist) {
        throw new ApiError(500, "Something went wrong while removing this video from playlist")
    }

    return res.status(200)
        .json(new ApiResponse(200, removeFromPlaylist, "Video removed successfully from playlist"))

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID")
    }

    const playlist = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "playlistVideos"
            }
        },
        {
            $addFields: {
                totalVideos: {
                    $size: "$playlistVideos"
                },
                totalViews: {
                    $sum: "$playlistVideos.views"
                }
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                totalVideos: 1,
                createdAt: 1
            }
        }
    ])

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "User playlists fetched successfully"));

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invaild playlist ID")
    }

    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                videos: 1,
                owner: 1,
                createdAt: 1
            }
        }
    ])

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    return res.status(200)
        .json(new ApiResponse(200, playlist, "Playlist fetched successfully"))
})

export {
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    getUserPlaylists,
    getPlaylistById
}