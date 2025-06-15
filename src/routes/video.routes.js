import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { deleteVideo, publishAVideo, togglePublishStatus, updateVideo } from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router()

router.route("/video").post(upload.fields([
    {
        name: "videoFile",
        maxCount: 1
    },
    {
        name: "thumbnail",
        maxCount: 1
    }
]),verifyJwt, publishAVideo)

router.route("/update/:videoId").patch(upload.single("thumbnail"), verifyJwt, updateVideo)
router.route("/delete/:videoId").post(verifyJwt, deleteVideo)
router.route("/toggle/:videoId").patch(verifyJwt, togglePublishStatus)


export default router