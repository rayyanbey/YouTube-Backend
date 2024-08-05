import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import  jwt  from "jsonwebtoken"

const generateAccessAndRefreshTokens = async(userId)=>{
    try{
      const user = await User.findById(userId)
      const accessToken = user.generateAccessToken()
      const refreshToken = user.generateRefreshToken()

      user.refreshTokens = refreshToken
      await user.save({validateBeforeSave: false})  ///saving the user with refresh token

      return {accessToken,refreshToken}
    }catch(error){
      throw new ApiError(500,"")
    }
}

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
    coverImage: CoverImageRes.url,
    email,
    password,
    username,
  })

  //remove password and refresh token from response
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


const loginUser = asyncHandler(async (req,res)=>{
  //Get password and username from req.body
  const {username,password,email} = req.body
  console.log(username,password,email)
  if(!(username || email)){
    throw new ApiError(400,"username or Email is required")
  }
  //validate user
  const user = await User.findOne({
    $or:[{username},{email}]
  })

  if(!user){
    throw new ApiError(404,"User doesnot exist")
  }
  //check password
  const isValidPassword = await user.isPasswordCorrect(password)
  if(!isValidPassword){
    throw new ApiError(401,"Password incorrect")
  }
  //generate access token and refresh token
  const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)
  //send cookies 
  const loggedInUser = await User.findById(user._id)
  .select("-password -refreshToken")

  const options = {
    httpOnly: true,
    secure: true
  }

  return res.status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(new ApiResponse(200, {
    user: loggedInUser,accessToken,refreshToken
  },'User logged in successfully'))
})

const logoutUser = asyncHandler(async (req,res)=>{
  //find user again but how?? use middleware

  await User.findByIdAndUpdate(req.user._id,
    {
      $set: {refreshTokens: undefined}
    },
    {
      new: true
    }
  )

  const options = {
    httpOnly: true,
    secure: true
  }

  return res.status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options)
  .json(new ApiResponse(200,{},"User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req,res)=>{
  const incomingRefreshToken = req.cookies.refreshToken  || req.body.refreshToken
  if(!incomingRefreshToken){
    throw new ApiError(401,"Unauthorized Request")
  }

  try {
    const token = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    
    if(!token){
      throw new ApiError(401,"Invalid Request")
    }
  
    const newUser = await User.findById(token?._id)
    if(!newUser){
      throw new ApiError(401,"Invalid Refresh Token")
    }
  
    if(newUser?.refreshTokens !== incomingRefreshToken){
      throw new ApiError(401,"Refresh Token is expired or used")
    }
  
    const {accessToken,newrefreshToken} = await generateAccessAndRefreshTokens(newUser._id)
  
    const options = {
      httpOnly: true,
      secure: true
    }
  
    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newrefreshToken,options)
    .json( new ApiResponse(200,{
      accessToken, refreshToken: newrefreshToken,
      message: "Tokens Refreshed"
    }))
  } catch (error) {
    throw new ApiError(401,"Invalid Refresh Token")
  }
})

const changePassword = asyncHandler(async(req,res)=>{
  const {oldPassword, newPassword, confirmPassword} = req.body
  const user = await User.findById(req.user?._id)
  const isCorrect = await user.isPasswordCorrect(oldPassword)
  if(!isCorrect){
     throw new ApiError(400,"Invalid Password")
  }
  if(newPassword !== confirmPassword){
    throw new ApiError(400,"Passwords Don't Match")
  }
  user.password = newPassword
  await user.save({validateBeforeSave: false})

  return res.status(200)
  .json(new ApiResponse(200,{},"Password Changes Successfully"))
})

//Change Avatar and coverImage

const getCurrentuser = asyncHandler(async(req,res)=>{
  return res.status(200)
  .json(new ApiResponse(200,req.user,"Current User Fetched Successfully"))
})


export { 
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentuser
 }
