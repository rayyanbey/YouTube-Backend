import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"
(async function() {

    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUD_API_NAME, 
        api_key: process.env.CLOUD_API_KEY, 
        api_secret: process.env.CLOUD_API_SECRET
    });
})();

const uploadOnCloudinary = async (localFilePath)=>{
   try {
    if(!localFilePath){
        return null
    }
    //upload on cloudinary
    let response = await cloudinary.uploader.upload(localFilePath,
        {
            resource_type:"auto"
        }
    )
    //Uploaded on Cloudinary
    console.log("Uploaded on Cloudinary",response.url)
    return response
   } catch (error) {
     fs.unlinkSync(localFilePath)  //remove the file from local server as the upload failed
     return null
   }
}


export {uploadOnCloudinary}