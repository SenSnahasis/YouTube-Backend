import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { addComment, deleteComment, updateComment } from "../controllers/comment.controller.js";

const router = Router()

router.route("/add/:videoId").post(verifyJwt, addComment)
router.route("/update/:commentId").patch(verifyJwt, updateComment)
router.route("/delete/:commentId").post(verifyJwt, deleteComment)

export default router