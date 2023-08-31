import Express from "express";
import controller from "./controller";
import auth from '../../../../helper/auth'
import upload from '../../../../helper/uploadHandler';


export default Express.Router()

    .post('/login', controller.login)
    .post('/forgotPassword', controller.forgotPassword)
    .patch('/verifyOTP', controller.verifyOTP)
    .post('/resendOtp', controller.resendOtp)
    .use(auth.verifyToken)
    .get('/getProfile', controller.getProfile)
    .patch('/changePassword', controller.changePassword)
    .post('/resetPassword', controller.resetPassword)


    .use(upload.uploadFile)









