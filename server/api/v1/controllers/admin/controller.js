import Joi from "joi";
import Mongoose from "mongoose";
import _ from "lodash";
import config from "config";
import apiError from '../../../../helper/apiError';
import response from '../../../../../assets/response';
import bcrypt from 'bcryptjs';
import responseMessage from '../../../../../assets/responseMessage';
import commonFunction from '../../../../helper/util';
import status, { ACTIVE } from '../../../../enums/status';
import userType from "../../../../enums/userType";
import { userServices } from "../../services/user";
const { userCheck, checkUserExists, emailMobileExist, createUser, findUser, findUserData, userFindList, updateUser, updateUserById, paginateSearch } = userServices
export class adminController {

    /**
     * @swagger
     * /admin/login:
     *   post:
     *     tags:
     *       - ADMIN
     *     description: Admin login with email and Password
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: login
     *         description: login  
     *         in: body
     *         required: true
     *         schema:
     *           $ref: '#/definitions/login'
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async login(req, res, next) {
        var validationSchema = {
            email: Joi.string().required(),
            password: Joi.string().required(),
        }
        try {
            if (req.body.email) {
                req.body.email = (req.body.email).toLowerCase();
            }

            var validatedBody = await Joi.validate(req.body, validationSchema);
            const { email, password } = validatedBody;
            var userResult = await findUser({ $and: [{ status: { $ne: status.DELETE } }, { userType: userType.ADMIN }, { $or: [{ mobileNumber: email }, { email: email }] }] });
            if (!userResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND)
            }
            if (!bcrypt.compareSync(password, userResult.password)) {
                throw apiError.conflict(responseMessage.INCORRECT_LOGIN)
            } else {
                var token = await commonFunction.getToken({ _id: userResult._id, email: userResult.email, mobileNumber: userResult.mobileNumber, userType: userResult.userType });
                let results = {
                    _id: userResult._id,
                    email: email,
                    speakeasy: userResult.speakeasy,
                    userType: userResult.userType,
                    token: token,
                }
                return res.json(new response(results, responseMessage.LOGIN));
            }
        } catch (error) {
            console.log("=========>>>>>>>72",error)
            return next(error);
        }
    }

    /**
     * @swagger
     * /admin/getProfile:
     *   get:
     *     tags:
     *       - ADMIN
     *     description: get his own profile details with getProfile API
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async getProfile(req, res, next) {
        try {
            console.log(req.restaurantId)
            let adminResult = await findUser({ _id: req.userId, status: { $ne: status.DELETE } });
            if (!adminResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            return res.json(new response(adminResult, responseMessage.USER_DETAILS));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /admin/forgotPassword:
     *   post:
     *     tags:
     *       - ADMIN
     *     description: forgotPassword by ADMIN on plateform when he forgot password
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: forgotPassword
     *         description: forgotPassword  
     *         in: body
     *         required: true
     *         schema:
     *           $ref: '#/definitions/forgotPassword'
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async forgotPassword(req, res, next) {
        var validationSchema = {
            email: Joi.string().required()
        };
        try {
            if (req.body.email) {
                req.body.email = (req.body.email).toLowerCase();
            }
            var validatedBody = await Joi.validate(req.body, validationSchema);
            const { email } = validatedBody;
            var userResult = await findUser({ $and: [{ status: { $ne: status.DELETE } }, { userType: userType.ADMIN }, { $or: [{ mobileNumber: email }, { email: email }] }] });
            if (!userResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            } else {
                var otp = commonFunction.getOTP();
                var newOtp = otp;
                var time = Date.now() + 180000;
                await commonFunction.sendEmailOtp(userResult.email, otp);
                var updateResult = await updateUser({ _id: userResult._id }, { $set: { otp: newOtp, otpExpireTime: time } })
                return res.json(new response(updateResult, responseMessage.OTP_SEND));
            }
        }
        catch (error) {
            console.log(error)
            return next(error);
        }
    }

    /**
     * @swagger
     * /admin/verifyOTP:
     *   patch:
     *     tags:
     *       - ADMIN
     *     description: verifyOTP
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: verifyOTP
     *         description: verifyOTP
     *         in: body
     *         required: true
     *         schema:
     *           $ref: '#/definitions/verifyOTP'
     *     responses:
     *       200:
     *         description: OTP send successfully.
     *       404:
     *         description: This user does not exist.
     *       500:
     *         description: Internal Server Error
     *       501:
     *         description: Something went wrong!
     */
    async verifyOTP(req, res, next) {
        var validationSchema = {
            email: Joi.string().required(),
            otp: Joi.string().required()
        };
        try {
            var validatedBody = await Joi.validate(req.body, validationSchema);
            const { email, otp } = validatedBody;
            var userResult = await findUserData({ $and: [{ status: { $ne: status.DELETE } }, { userType: userType.ADMIN }, { $or: [{ mobileNumber: email }, { email: email }] }] });
            if (!userResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            if (new Date().getTime() > userResult.otpExpireTime) {
                throw apiError.badRequest(responseMessage.OTP_EXPIRED);
            }
            if (userResult.otp != otp) {
                throw apiError.badRequest(responseMessage.INCORRECT_OTP);
            }
            var updateResult = await updateUser({ _id: userResult._id }, { otpVerified: true })
            var token = await commonFunction.getToken({ _id: updateResult._id, email: updateResult.email, mobileNumber: updateResult.mobileNumber, userType: updateResult.userType });
            var obj = {
                _id: updateResult._id,
                name: updateResult.name,
                email: updateResult.email,
                countryCode: updateResult.countryCode,
                mobileNumber: updateResult.mobileNumber,
                otpVerified: true,
                token: token
            }
            return res.json(new response(obj, responseMessage.OTP_VERIFY));
        }
        catch (error) {
            console.log(error)
            return next(error);
        }
    }

    /**
     * @swagger
     * /admin/resendOtp:
     *   post:
     *     tags:
     *       - ADMIN
     *     description: resend otp by ADMIN on plateform when he resend otp
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: resendOtp
     *         description: resendOtp  
     *         in: body
     *         required: true
     *         schema:
     *           $ref: '#/definitions/resendOtp'
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async resendOtp(req, res, next) {
        var validationSchema = {
            email: Joi.string().required()
        };
        try {
            if (req.body.email) {
                req.body.email = (req.body.email).toLowerCase();
            }
            var validatedBody = await Joi.validate(req.body, validationSchema);
            const { email } = validatedBody;
            var userResult = await findUser({ $and: [{ status: { $ne: status.DELETE } }, { userType: userType.ADMIN }, { $or: [{ mobileNumber: email }, { email: email }] }] });
            if (!userResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            } else {
                var otp = commonFunction.getOTP();
                var newOtp = otp;
                var time = Date.now() + 180000;
                await commonFunction.sendEmailOtp(userResult.email, otp);
                var updateResult = await updateUser({ _id: userResult._id }, { $set: { otp: newOtp, otpExpireTime: time } })
                return res.json(new response(updateResult, responseMessage.OTP_SEND));
            }
        }
        catch (error) {
            console.log(error)
            return next(error);
        }
    }

    /**
     * @swagger
     * /admin/changePassword:
     *   patch:
     *     tags:
     *       - ADMIN
     *     description: changePassword
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: changePassword
     *         description: changePassword
     *         in: body
     *         required: true
     *         schema:
     *           $ref: '#/definitions/changePassword'
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async changePassword(req, res, next) {
        const validationSchema = {
            oldPassword: Joi.string().required(),
            newPassword: Joi.string().required()
        };
        try {
            let validatedBody = await Joi.validate(req.body, validationSchema);
            let userResult = await findUser({ _id: req.userId, status: { $ne: status.DELETE } });
            if (!userResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            if (!bcrypt.compareSync(validatedBody.oldPassword, userResult.password)) {
                throw apiError.badRequest(responseMessage.PWD_NOT_MATCH);
            }
            let updated = await updateUserById(userResult._id, { password: bcrypt.hashSync(validatedBody.newPassword) });
            return res.json(new response(updated, responseMessage.PWD_CHANGED));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /admin/resetPassword:
     *   post:
     *     tags:
     *       - ADMIN
     *     description: resetPassword
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: resetPassword
     *         description: resetPassword
     *         in: body
     *         required: true
     *         schema:
     *           $ref: '#/definitions/resetPassword'
     *     responses:
     *       200:
     *         description: Your password has been successfully changed.
     *       404:
     *         description: This user does not exist.
     *       422:
     *         description: Password not matched.
     *       500:
     *         description: Internal Server Error
     *       501:
     *         description: Something went wrong!
     */
    async resetPassword(req, res, next) {
        const validationSchema = {
            password: Joi.string().required(),
            confirmPassword: Joi.string().required()

        };
        try {
            const { password, confirmPassword } = await Joi.validate(req.body, validationSchema);
            var userResult = await findUser({ _id: req.userId, status: { $ne: status.DELETE } });
            if (!userResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            else {
                if (password == confirmPassword) {
                    let update = await updateUser({ _id: userResult._id }, { password: bcrypt.hashSync(password) });
                    return res.json(new response(update, responseMessage.PWD_CHANGED));
                }
                else {
                    throw apiError.notFound(responseMessage.PWD_NOT_MATCH);
                }
            }
        }
        catch (error) {
            console.log(error);
            return next(error);
        }
    }


}
export default new adminController();