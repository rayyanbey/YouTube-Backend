import { Router } from "express";
import { registerUser } from "../controllers/user.controllers.js";

const router = Router()

router.route("/register").post(registerUser)  //Register User
// router.route("/login").post(login)  //Login

export default router