import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
const registerUser = asyncHandler(async (req, res) => {
  //Get User Details
  const { FullName, username, email, password } = req.body

  //Validation : Empty
  // if(
  //   [FullName,email,username,password].some((field)=>
  //     field?.trim() === ""
  //   )
  // ){
  //   throw new ApiError(400,"All fields are required")
  // }

  //Check if User Already Exists
  let FoundUser = await User.findOne({
    $or: [{ username }, { email }],
  })
  console.log(FoundUser)
  if (FoundUser) {
    throw new ApiError(409, "User Already Exists")
  }
  // console.log(req.files)
  // console.log(req.body)
  //Check for images
  const AvatarLocalPath = req.files?.avatar[0]?.path
  const CoverImageLocalPath = req.files?.coverImage[0]?.path
  console.log(AvatarLocalPath)
  console.log(CoverImageLocalPath)

  if (!AvatarLocalPath) {
    throw new ApiError(400, "Avatar File is required")
  }
  if (!CoverImageLocalPath) {
    throw new ApiError(400, "Cover Image File is required")
  }

  //Upload images to cloudinary
  let AvatarRes = await uploadOnCloudinary(AvatarLocalPath)
  let CoverImageRes = await uploadOnCloudinary(CoverImageLocalPath)

  console.log(AvatarRes)
  console.log(CoverImageRes)

  if (!AvatarRes) {
    throw new ApiError(409, "Avatar is required")
  }

  //Create User Object - create entry in DB
  const user = await User.create({
    FullName,
    avatar: AvatarRes.url,
    coverImage: CoverImageRes?.url || "",
    email,
    password,
    username,
  })

  //remove pass and refresh token from response
  const createdUser = await User.findById(user._id)?.select(
    "-password -refreshTokens"
  )
  console.log(createdUser)
  //check user creation
  if (!createdUser) {
    throw new ApiError(500, "Problem in Registering User")
  }
  //return response
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered"))
})

export { registerUser }
