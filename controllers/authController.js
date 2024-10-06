import jwt from 'jsonwebtoken';
import validator from 'validator';
import User from '../models/user.js';
import Otp from '../models/otp.js';

const JWT_SECRET = process.env.JWT_SECRET;
import otpGenerator from 'otp-generator';
import twilio from 'twilio';
// const {  } = pkg;

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

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

    const otp = otpGenerator.generate(6 , {upperCaseAlphabets : false , specialChars : false , lowerCaseAlphabets : false});

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
      from: '+19514194199',
      to: phoneNumber
    });

    return res.status(200).json({
      success: true,
      msg: 'otp sent successfully - ' + otp
    })

    const token = jwt.sign({ id: newUser._id.toString() }, JWT_SECRET, { expiresIn: "12h" });

    res.cookie("token", token, { httpOnly: true });
    res.status(201).json({
      message: "User registered successfully",
      otp: otp // In a real application, don't send OTP back to the client
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};
