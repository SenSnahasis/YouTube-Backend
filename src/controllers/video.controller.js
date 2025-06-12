import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const publishAVideo = asyncHandler(async (req, res) => {
    // get title, description from frontend
    // check empty validation - title, description
    // get video file and thumbnail from multer
    // check empty validation
    // upload to cloudinary and verify
    // create a video object and entry to database
    // return response

    const { title, description} = req.body

    if([title, description].some((field) => !field || field?.trim() === "")) {
        throw new ApiError(400, "Title and description is required")
    }

    const videoFileLocalPath = req.files?.videoFile?.[0].path
    const thumbnailLocalPath = req.files?.thumbnail?.[0].path
    console.log(videoFileLocalPath);
    

    if(!videoFileLocalPath || !thumbnailLocalPath) {
        throw new ApiError(400, "Video and thumbnail is required")
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!videoFile || !thumbnail) {
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

    if(!video) {
        throw new ApiError(500, "Something went wrong while create the video")
    }

    return res.status(201)
    .json(
        new ApiResponse(201, video, "Video is published successfully")
    )

})

export {
    publishAVideo
}