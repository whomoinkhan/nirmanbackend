import Mongoose, { Schema, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";
import userType from "../enums/userType";
import status from '../enums/status';
import bcrypt from 'bcryptjs';

var userModel = new Schema(

  {
    email: {
      type: String
    },
    firstName: {
      type: String
    },
    lastName: {
      type: String
    },
    countryCode: {
      type: String
    },
    mobileNumber: {
      type: String
    },
    password: {
      type: String
    },
    dateOfBirth: {
      type: String
    },
    otp: {
      type: String
    },
    otpVerified: {
      type: Boolean,
      default: false
    },
    userType: {
      type: String,
      enum: [userType.ADMIN, userType.RESTAURANT_OWNER, userType.USER],
      default: userType.USER
    },
    status: {
      type: String,
      default: status.ACTIVE
    },
    address: {
      type: String
    },
    location: {
      type: {
        type: String,
        default: "Point"
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    },
    otpExpireTime: {
      type: Number
    },
    profilePic: {
      type: String
    },
  },
  { timestamps: true }
);
userModel.index({ location: "2dsphere" })
userModel.plugin(mongooseAggregatePaginate)
userModel.plugin(mongoosePaginate);
module.exports = Mongoose.model("user", userModel);

Mongoose.model("user", userModel).find({ userType: userType.ADMIN }, async (err, result) => {
  if (err) {
    console.log("DEFAULT ADMIN ERROR", err);
  }
  else if (result.length != 0) {
    console.log("Default Admin.");
  }
  else {

    let obj = {
      userType: userType.ADMIN,
      firstName: "vishnu",
      lastName: "deo",
      countryCode: "+91",
      mobileNumber: "8521529565",
      email: "vishnu@mailinator.com",
      dateOfBirth: "24/04/1996",
      password: bcrypt.hashSync("Vishnu@1"),
      address: "Uttam nagar, Delhi, India",
      otpVerified: true,
    };
    Mongoose.model("user", userModel).create(obj, async (err1, result1) => {
      if (err1) {
        console.log("Default admin  creation error", err1);
      } else {
        console.log("Default admin created", result1);
      }
    });
  }
});