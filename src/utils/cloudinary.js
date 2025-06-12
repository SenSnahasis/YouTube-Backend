import {v2 as cloudinary} from "cloudinary";
import fs from "fs";


// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null
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

export {uploadOnCloudinary}