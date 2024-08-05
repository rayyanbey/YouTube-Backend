import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";


const changeAvatar = asyncHandler(async(req,res)=>{
    const user = await User.findById(req.user?._id)
    if(!user){
        throw new ApiError(400,"User Not Found")
    }
    const avatarFilePath = req.files?.avatar[0]?.path

    if(!avatarFilePath){
        throw new ApiError(400,"Avatar is Required")
    }

    const avatarResponse = await uploadOnCloudinary(avatarFilePath)

    if(!avatarResponse){
        throw new ApiError(400,"Avatar is Required")
    }

    user.avatar = avatarResponse.url
    user.save({validateBeforeSave: false})

    console.log(user.avatar)
    return res.status(200)
    .json(new ApiResponse(200,{},"Avatar image is updated"))
    
})

const changeCoverImage = asyncHandler(async(req,res)=>{
    const user = await User.findById(req.user?._id)
    if(!user){
        throw new ApiError(400,"User Not Found")
    }
    const coverFilePath = req.files?.coverImage[0]?.path

    if(!coverFilePath){
        throw new ApiError(400,"Cover Image is Required")
    }

    const coverResponse = await uploadOnCloudinary(coverFilePath)

    if(!coverResponse){
        throw new ApiError(400,"Cover Image is Required")
    }

    user.coverImage = coverResponse.url
    user.save({validateBeforeSave: false})

    console.log(user.coverImage)
    return res.status(200)
    .json(new ApiResponse(200,{},"Cover image is updated"))
})


export {
    changeAvatar,
    changeCoverImage
}