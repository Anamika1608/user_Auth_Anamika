import express from 'express';
const router = express.Router();

import { register , sendOtp , verifyOtp , googleLogin , login} from '../controllers/authController.js';

router.post("/register-with-email", register);

router.post("/send-otp", sendOtp);

router.post("/verify-otp" , verifyOtp);

router.post("/google-login" , googleLogin);

router.post("/login" , login);

export default router;
