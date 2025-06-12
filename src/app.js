import cors from "cors"
import cookieParser from "cookie-parser"
import express from "express"

const app = express()

app.use(cors({
    origin: process.env.CROS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// router import
import userRouter from "./routes/user.routes.js"
import videoRouter from "./routes/video.routes.js"


//routes declaration
app.use("/api/v1/users", userRouter)
app.use("/api/v1/videos", videoRouter)

// http://localhost:4000/api/v1/users/register


export {app}