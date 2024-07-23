import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"

const app = express()

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
) //CORS Policy check
app.use(express.json({ limit: "10kb" })) //JSON data with limit
app.use(
  express.urlencoded({
    extended: true,
    limit: "10kb",
  })
) //Data from URL check
app.use(express.static("public")) //Static files Check
app.use(cookieParser()) //Cookies Check

export { app }
