import jwt from 'jsonwebtoken';
import validator from 'validator';
import User from '../models/user.js';
import Otp from '../models/otp.js';

const JWT_SECRET = process.env.JWT_SECRET;
import otpGenerator from 'otp-generator';
import twilio from 'twilio';
import otpVerification from '../Helpers/otpValidate.js';

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN

const twilioClient = new twilio(accountSid, authToken)

export const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: "Invalid email address" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters long" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = new User({ name, email, password });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id.toString() }, JWT_SECRET, { expiresIn: "12h" });

    res.cookie("token", token, { httpOnly: true });
    res.status(201).json({ message: "User registered successfully" });

  } catch (err) {
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

export const sendOtp = async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ message: "Phone number is required" });
  }

  // if (!/^\d{10}$/.test(phoneNumber)) {
  //   return res.status(400).json({ message: "Invalid phone number format" });
  // }

  try {
    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      return res.status(400).json({ message: "User with this phone number already exists" });
    }

    const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });

    const cDate = new Date()

    await Otp.findOneAndUpdate(
      { phoneNumber },
      {
        $set: {
          otp,
          otpExpiration: new Date(cDate.getTime())
        }
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    )
      .then((result) => {
        console.log(result);
      })
      .catch((err) => {
        console.error(err);
      });


    twilioClient.messages.create({
      body: `Your OTP is ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    return res.status(200).json({
      success: true,
      msg: 'otp sent successfully - ' + otp
    })

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    const otpData = await Otp.findOne({ phoneNumber, otp })
    if(!otpData){
      res.status(404).json({ message: "You entered wrong OTP" });
    }

    const isOtpExpired = await otpVerification(otpData.otpExpiration);

    console.log(isOtpExpired);

    if(isOtpExpired) {
      return res.status(200).json({
        success: false,
        msg: 'Your OTP has been expired.'
      })
    }

    const token = jwt.sign({ id: otpData._id.toString() }, JWT_SECRET, { expiresIn: "12h" });

    res.cookie('token', token, {
      httpOnly: true
    });

    return res.status(200).json({
      success: true,
      msg: 'OTP Verified successfully !!'
    })

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}

export const googleLogin = async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      throw new Error("Authorization code not provided");
    }

    const googleRes = await oauth2client.getToken(code);
    oauth2client.setCredentials(googleRes.tokens);

    const userRes = await axios.get(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`
    );

    const { email, name } = userRes.data;
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({ name, email, password: process.env.DEFAULT_PASSWORD });
      await user.save();
    }

    const token = jwt.sign({ id: user._id.toString() }, JWT_SECRET, { expiresIn: "12h" });

    res.setHeader(
      'Set-Cookie',
       cookie.serialize('token', token, { 
         sameSite: 'lax', 
         
       })
     )

    res.cookie('token', token, {
        httpOnly: true,
    });

    console.log('New token set:', token);
    console.log('Cookie set:', res.getHeader('Set-Cookie'));

    res.status(200).json({
      message: "User logged in successfully",
      user: { name: user.name, email: user.email, id: user._id }
    });
  }
   catch (error) {
    console.log("Error during Google login:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

