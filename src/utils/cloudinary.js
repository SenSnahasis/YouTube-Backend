import { v2 as cloudinary } from "cloudinary";
import fs from "fs";


// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const extractPublicId = (cloudinaryUrl) => {
    // Example: https://res.cloudinary.com/demo/video/upload/v1654321234/folder/abc123.mp4
    const parts = cloudinaryUrl.split("/");
    const fileName = parts[parts.length - 1]; // abc123.mp4
    const publicId = fileName.split(".")[0];  // abc123

    return publicId;
};

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        // file upload on cloudinary
        const uploadResponse = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        //file has been uploaded successfully
        console.log(uploadResponse)
        console.log("File has been uploaded on cloudinary: ", uploadResponse.url);
        fs.unlinkSync(localFilePath)
        return uploadResponse;
    } catch (error) {
        fs.unlinkSync(localFilePath); // remove the locally saved file if upload oparation got failed
        console.log(error)
        return null;
    }
}

const deleteFromCloudinary = async (fileUrl, resourceType = "image") => {
    try {
        const publicId = extractPublicId(fileUrl)
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
        });
        console.log(`Successfully deleted the ${resourceType}`);
        return result;
    } catch (error) {
        console.error("Cloudinary delete error:", error);
        return null;
    }
};

export {
    uploadOnCloudinary,
    deleteFromCloudinary
}