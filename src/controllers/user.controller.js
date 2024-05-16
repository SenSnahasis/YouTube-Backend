import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import { uploadOnCouldinary } from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"


const registerUser = asyncHandler(async (req, res) => {
    // get data from frontend
    // validation - check username and email is non empty field
    // check user is already register: username, email
    // check for images and check for avatar
    // upload to clouinary and check avatar
    // create user object - create entry in db
    // remove password and refresh token from response
    // check for user creation
    // return res

    // get data from frontend
    const { username, fullName, email, password } = req.body

    // validation - check username and email is non empty field
    if ([username, fullName, email, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required")
    }

    // check user is already register: username, email
    const existedUser = User.findOne({
            $or: [{ username }, { email }]
        }
    )
    if(existedUser) {
        throw new ApiError(409, "User with username or phone number already exist")
    }


    // check for images and check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path
    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }


    // upload to clouinary and check avatar
    const avatar = await uploadOnCouldinary(avatarLocalPath)
    const coverImage = await uploadOnCouldinary(coverImageLocalPath)
    if(!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    // create user object - create entry in db
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        username: username.toLowerCase(),
        email,
        password
    })

    // remove password and refresh token from response
    const createdUser = User.findById(user._id).select(
        "-password -refreshToken"
    )

    // check for user creation
    if(!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    // return res
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )

})



export { registerUser }
