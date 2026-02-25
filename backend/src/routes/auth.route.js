import express from 'express';
import { signup, login, logout, updateProfile, changePassword, checkAuth} from '../controller/auth.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post("/signup",signup); 

router.post("/login",login);

router.post("/logout",logout);

router.put("/update-profile", protectRoute,updateProfile);

router.put("/change-password", protectRoute, changePassword);

router.get("/check",protectRoute,checkAuth);

export default router;