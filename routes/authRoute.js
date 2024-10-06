import express from 'express';
const router = express.Router();

import { register , sendOtp , verifyOtp} from '../controllers/authController.js';

router.post("/register-with-email", register);

router.post("/send-otp", sendOtp);

router.post("/verify-otp" , verifyOtp)

export default router;
