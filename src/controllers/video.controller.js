import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";

const publishAVideo = asyncHandler(async (req, res) => {
    // get title, description from frontend
    // check empty validation - title, description
    // get video file and thumbnail from multer
    // check empty validation
    // upload to cloudinary and verify
    // create a video object and entry to database
    // return response

    const { title, description } = req.body

    if ([title, description].some((field) => !field || field?.trim() === "")) {
        throw new ApiError(400, "Title and description is required")
    }

    const videoFileLocalPath = req.files?.videoFile?.[0].path
    const thumbnailLocalPath = req.files?.thumbnail?.[0].path
    console.log(videoFileLocalPath);


    if (!videoFileLocalPath || !thumbnailLocalPath) {
        throw new ApiError(400, "Video and thumbnail is required")
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!videoFile || !thumbnail) {
        throw new ApiError(404, "Something went wrong while upload video and thumbnail to cloudinary")
    }

    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title: title.trim(),
        description: description.trim(),
        owner: req.user?._id,
        duration: videoFile.duration,
        views: 0,
        isPublished: false
    })

    if (!video) {
        throw new ApiError(500, "Something went wrong while create the video")
    }

    return res.status(201)
        .json(
            new ApiResponse(201, video, "Video is published successfully")
        )

})

const updateVideo = asyncHandler(async (req, res) => {
    // get video details like title, description, thumbnail from frontend
    // check videoId is valid
    // check user is authorize to update the details
    // if updated thumbnail is available then upload to cloudinary
    // update the details in DB
    // return the response

    const { videoId } = req.params
    const { title, description } = req.body

    console.log(`video id is = ${videoId}`);
    

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    if ([title, description].some((field) => !field || field?.trim() === "")) {
        throw new ApiError(400, "Title and description is required")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(400, "Video is unavailable")
    }

    if (video?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not authorized to update the video details")
    }

    const thumbnailLocalPath = req.file?.path
    if (thumbnailLocalPath) {
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
        if (!thumbnail) {
            throw new ApiError(500, "Failed to upload thumbnail to Cloudinary")
        }

        await deleteFromCloudinary(video.thumbnail)

        video.thumbnail = thumbnail.url
    }

    video.title = title.trim()
    video.description = description.trim()

    await video.save()

    return res.status(200)
        .json(
            new ApiResponse(
                200, video, "Video details updated succssfully"
            )
        )

})

const deleteVideo = asyncHandler(async (req, res) => {

    const { videoId } = req.params

    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    const video = await Video.findById(videoId)

    if(!video) {
        throw new ApiError(404, "Video not found")
    }

    if(video?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this video")
    }

    await deleteFromCloudinary(video.videoFile, "video")
    await deleteFromCloudinary(video.thumbnail)

    await video.deleteOne()

    return res.status(200)
    .json(
        new ApiResponse(200, {}, "Video deleted successfully")
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    const video = await Video.findById(videoId)

    if(!video) {
         throw new ApiError(404, "Video not found")
    }

    if(video?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not authorized to change the publish status of this video")
    }

    video.isPublished = !video.isPublished
    await video.save()

    const message = video.isPublished
        ? "Video published successfully"
        : "Video unpublished successfully";

    return res.status(200)
    .json(
        new ApiResponse(
            200, video, message
        )
    )
})


export {
    publishAVideo,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}