import config from "config";
import jwt from 'jsonwebtoken';

import nodemailer from 'nodemailer';
import cloudinary from 'cloudinary';
cloudinary.config({
  cloud_name: config.get('cloudinary.cloud_name'),
  api_key: config.get('cloudinary.api_key'),
  api_secret: config.get('cloudinary.api_secret')
});

module.exports = {


  getOTP() {
    var otp = Math.floor(100000 + Math.random() * 900000);
    return otp;
  },


  getToken: async (payload) => {
    var token = await jwt.sign(payload, config.get('jwtsecret'), { expiresIn: "24h" })
    return token;
  },



  getImageUrl: async (files) => {
    var result = await cloudinary.v2.uploader.upload(files[0].path, { resource_type: "auto" })
    return result.secure_url;
  },


  getSecureUrl: async (base64) => {
    var result = await cloudinary.v2.uploader.upload(base64);
    return result.secure_url;

  },
  sendEmailOtp: async (email, otp) => {
    var sub = `Use the One Time Password(OTP) ${otp} to verify your accoount.`
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        "user": config.get('nodemailer.email'),
        "pass": config.get('nodemailer.password')

      }
    });
    var mailOptions = {
      from: config.get('nodemailer.email'),
      to: email,
      subject: 'Otp for verication',
      text: sub,
      // html: html
    };
    return await transporter.sendMail(mailOptions)
  },

  uploadImage(image) {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(image, function (error, result) {
        console.log(result);
        if (error) {
          reject(error);
        }
        else {
          resolve(result.url)
        }
      });
    })
  },
}
