import connectDB from './database/index.js'
import dotenv from "dotenv"

dotenv.config({
    path: '../public/.env'
})

connectDB() //DATABASE CONNECTION