import express from 'express';
const router = express.Router();

import { register , sendOtp} from '../controllers/authController.js';

router.post("/register-with-email", register);

router.post("/sendOtp", sendOtp);

export default router;
