import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controller.js";

const router = Router()

router.route("/:channelId").patch(verifyJwt, toggleSubscription)
router.route("/subcount/:channelId").get(getUserChannelSubscribers)
router.route("/subscribed/:subscriberId").get(getSubscribedChannels)

export default router