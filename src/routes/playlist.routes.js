import { Router } from "express";
import {
    addVideoToPlaylist,
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getUserPlaylists,
    removeVideoFromPlaylist,
    updatePlaylist
} from "../controllers/playlist.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js"

const router = Router()

router.route("/create").post(verifyJwt, createPlaylist)
router.route("/update/:playlistId").patch(verifyJwt, updatePlaylist)
router.route("/delete/:playlistId").patch(verifyJwt, deletePlaylist)
router.route("/add-video/:playlistId/:videoId").post(verifyJwt, addVideoToPlaylist)
router.route("/remove-video/:playlistId/:videoId").post(verifyJwt, removeVideoFromPlaylist)
router.route("/user-playlist/:userId").get(verifyJwt, getUserPlaylists)
router.route("/:playlistId").get(verifyJwt, getPlaylistById)


export default router