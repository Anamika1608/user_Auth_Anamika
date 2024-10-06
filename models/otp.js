import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    phoneNumber: {
        type: String,
        unique: true,
        sparse: true,
        validate: {
            validator: function (v) {
                return v === null || /^\d{10}$/.test(v);
            },
            message: props => `${props.value} is not a valid phone number!`
        }
    },
    otp : {
        type: String,
        require : true
    }
    , otpExpiration : {
        type : String,
        default : Date.now,
        get : (otpExpiration) => otpExpiration.getTime(),
        set : (otpExpiration)=> new Date(otpExpiration)
    }
}, { timestamps: true });

const Otp = mongoose.model('Otp', otpSchema);

export default Otp;




