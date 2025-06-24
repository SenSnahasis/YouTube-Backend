import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { createTweet, deleteTweet, getUserTweets, updateTweet } from "../controllers/tweet.controller.js";

const router = Router()

router.route("/create").post(verifyJwt, createTweet)
router.route("/update/:tweetId").patch(verifyJwt, updateTweet)
router.route("/delete/:tweetId").post(verifyJwt, deleteTweet)
router.route("/:userId").get(verifyJwt, getUserTweets)

export default router