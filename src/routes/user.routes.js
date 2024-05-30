import { Router } from "express";
import { accessRefreshToken, loginUser, logoutUser, 
    registerUser, changePassword, getCurrentUser, 
    updateAccountDetails, updateUserAvater, updateCoverImage } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJwt } from "../middlewares/auth.middleware.js"

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ])
    , registerUser)

router.route("/login").post(loginUser)

// secured routes
router.route("/logout").post(verifyJwt, logoutUser)
router.route("/refresh-token").post(accessRefreshToken)
router.route("/change-password").post(verifyJwt, changePassword)
router.route("/current-user").get(verifyJwt, getCurrentUser)
router.route("/update-account").patch(verifyJwt, updateAccountDetails)
router.route("/avatar").patch(verifyJwt, upload.single("avatar"), updateUserAvater)
router.route("/cover-image").patch(verifyJwt, upload.single("coverImage"), updateCoverImage)


export default router