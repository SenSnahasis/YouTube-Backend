import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import { uploadOnCouldinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const generateAccessAndRefreshToken = async (user_id) => {

    try {
        const user = await User.findById(user_id)
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
    // upload to clouinary and check avatar
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
    const avatar = await uploadOnCouldinary(avatarLocalPath)
    const coverImage = await uploadOnCouldinary(coverImageLocalPath)
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

    const isPasswordValid = await user.isPasswrodCorrect(password)
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
            $set: {
                refreshToken: undefined
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


export { registerUser, loginUser, logoutUser }
