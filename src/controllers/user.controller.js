import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async (userId) => {

    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccressToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch {
        throw new ApiError(500, "Something went wrong while genarating access and refresh token")
    }
}


const registerUser = asyncHandler(async (req, res) => {
    // get data from frontend
    // validation - check username and email is non empty field
    // check user is already register: username, email
    // check for images and check for avatar
    // upload to cloudinary and check avatar
    // create user object - create entry in db
    // remove password and refresh token from response
    // check for user creation
    // return res

    // get data from frontend
    const { username, fullname, email, password } = req.body

    // validation - check username and email is non empty field
    if ([username, fullname, email, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required")
    }

    // check user is already register: username, email
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    }
    )
    if (existedUser) {
        throw new ApiError(409, "User with username or phone number already exist")
    }


    // check for images and check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }


    // upload to clouinary and check avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    // create user object - create entry in db
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        username: username.toLowerCase(),
        email,
        password
    })

    // remove password and refresh token from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // check for user creation
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    // return res
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )

})


const loginUser = asyncHandler(async (req, res) => {
    // get data from frontend
    // validation check: username and password
    // check username is present in DB
    // check correct password
    // access token and refresh token
    // send cookie
    // return response

    const { username, email, password } = req.body;

    if (!(username || email)) {
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged in successfully"
            )
        )

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: ""
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(
                200, {}, "User successfully logged out"
            )
        )
})

const accessRefreshToken = asyncHandler(async (req, res) => {
    const incommingRefreshToken = req.cookie?.refreshToken || req.body.refreshToken
    if (!incommingRefreshToken) {
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        if (!decodedToken) {
            throw new ApiError(401, "Invalid refresh token")
        }

        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if (incommingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "Refresh token is expried")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id)

        return res
            .status(200)
            .cookie("AccessToken", accessToken, options)
            .cookie("RefreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken, refreshToken: newRefreshToken
                    },
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error.message || "Invalid refresh token")
    }

})

const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body
    if (!(currentPassword && newPassword)) {
        throw new ApiError(401, "Current and new password is required")
    }

    const user = await User.findById(req.user?._id)
    const checkPassword = await user.isPasswordCorrect(currentPassword)
    if (!checkPassword) {
        throw new ApiError(400, "Invalid current password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password changed successfully"
            )
        )

})

const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id).select("-password -refreshTokken")

    return res.status(200)
        .json(
            new ApiResponse(
                200, user, "current user fetch successfully"
            )
        )

})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const {fullname, email } = req.body
    if(!fullname || !email) {
        throw new ApiError(400, "all fields are requried")
    }
    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                fullname: fullname,
                email: email
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, user, "Account details updated successfully"
        )
    )

})

const updateUserAvater = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
    }

    // todo for deleting the avatar after save on cloudinary

    const user = User.findByIdAndUpdate(req.user._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "User avater updated successfully")
    )

})

const updateCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath) {
        throw new ApiError(400, "cover image is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url) {
        throw new ApiError(400, "Error while cover image on updated")
    }

    const user = User.findByIdAndUpdate(req.user._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, user, "Cover image updated successfully"
        )
    )
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const {username} = req.params
    if(!username?.trim()) {
        throw new ApiError(400, "user is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscriberCount: {
                    $size: "$subscribers"
                },
                channalSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "subscribers.subscriber" ]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                subscriberCount: 1,
                channalSubscribedToCount: 1,
                isSubscribed: 1
            }
        }
    ])

    if(!channel?.length) {
        throw new ApiError(404, "Channel does not exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, channel[0], "User channel fetch successfully"
        )
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    accessRefreshToken,
    changePassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvater,
    updateCoverImage,
    getUserChannelProfile
}
