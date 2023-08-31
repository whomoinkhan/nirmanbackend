import Joi from "joi";
import Mongoose from "mongoose";
import _ from "lodash";
import config from "config";
import apiError from '../../../../helper/apiError';
import response from '../../../../../assets/response';
import responseMessage from '../../../../../assets/responseMessage';
import status from '../../../../enums/status';
import userType from "../../../../enums/userType";
import { token } from "morgan";
import { userServices } from "../../services/user"
const { findUser } = userServices
import { propertyServices } from '../../services/property'
const { createProperty, findProperty, updateProperty, propertyList, propertyPaginateSearch } = propertyServices
import commonFunction from '../../../../helper/util';

export class propertyController {

    /**
     * @swagger
     * /property/uploadFile:
     *   post:
     *     tags:
     *       - UPLOAD-FILE
     *     description: uploadFile
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: uploaded_file
     *         description: uploaded_file
     *         in: formData
     *         type: file
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async uploadFile(req, res, next) {
        try {
            let userResult = await findUser({ _id: req.userId, status: { $ne: status.DELETE } });
            if (!userResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            const { files } = req;
            const imageFiles = await commonFunction.getImageUrl(files);
            if (imageFiles) {
                let obj = {
                    secure_url: imageFiles,
                    original_filename: files[0].filename,
                };
                return res.json(new response(obj, responseMessage.UPLOAD_SUCCESS));
            }
        } catch (error) {
            console.log(error)
            return next(error);
        }
    }

    /**
     * @swagger
     * /property/addProperty:
     *   post:
     *     tags:
     *       - PROPERTY
     *     description: Property add by admin 
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: addProperty
     *         description: addProperty  
     *         in: body
     *         required: true
     *         schema:
     *           $ref: '#/definitions/addProperty'
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async addProperty(req, res, next) {
        var validationSchema = {
            title: Joi.string().required(),
            propertyNo: Joi.string().optional(),
            description: Joi.string().required(),
            short_description: Joi.string().optional(),
            imageUrl: Joi.string().required(),
            state: Joi.string().optional(),
            district: Joi.string().optional(),
            price: Joi.string().optional(),
            propertyType: Joi.string().optional(),
            location: Joi.object().optional()
        }
        try {
            var validatedBody = await Joi.validate(req.body, validationSchema);
            let userResult = await findUser({ _id: req.userId, userType: userType.ADMIN });
            if (!userResult) {
                throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
            }
            // let propertyRes = await findProperty({ propertyNo: validatedBody.propertyNo, status: { $ne: status.DELETE } })
            // if (propertyRes) {
            //     throw apiError.conflict(responseMessage.PROPERTY_ALREADY_EXIST);
            // }
            let saveRes = await createProperty(validatedBody)
            return res.json(new response(saveRes, responseMessage.ADD_PROPERTY));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /property/viewProperty:
     *   get:
     *     tags:
     *       - PROPERTY
     *     description: viewProperty
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: propertyId
     *         description: propertyId
     *         in: query
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */

    async viewProperty(req, res, next) {
        const validationSchema = {
            propertyId: Joi.string().required()
        };
        try {
            const validatedBody = await Joi.validate(req.query, validationSchema);
            var result = await findProperty({ _id: validatedBody.propertyId, status: { $ne: status.DELETE } });
            if (!result) {
                throw apiError.notFound(responseMessage.PROPERTY_NOT_FOUND);
            }
            return res.json(new response(result, responseMessage.PROPERTY_FOUND));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /property/deleteProperty:
     *   delete:
     *     tags:
     *       - PROPERTY
     *     description: deleteProperty
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: propertyId
     *         description: propertyId
     *         in: query
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */

    async deleteProperty(req, res, next) {
        const validationSchema = {
            propertyId: Joi.string().required()
        };
        try {
            const validatedBody = await Joi.validate(req.query, validationSchema);
            let userResult = await findUser({ _id: req.userId, userType: userType.ADMIN });
            if (!userResult) {
                throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
            }
            var result = await findProperty({ _id: validatedBody.propertyId, status: { $ne: status.DELETE } });
            if (!result) {
                throw apiError.notFound(responseMessage.PROPERTY_NOT_FOUND);
            }
            let updateRes = await updateProperty({ _id: result._id }, { status: status.DELETE })
            return res.json(new response(updateRes, responseMessage.PROPERTY_DELETE));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /property/editProperty:
     *   put:
     *     tags:
     *       - PROPERTY
     *     description: Property add by admin 
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: editProperty
     *         description: editProperty  
     *         in: body
     *         required: true
     *         schema:
     *           $ref: '#/definitions/editProperty'
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async editProperty(req, res, next) {
        var validationSchema = {
            propertyId: Joi.string().required(),
            title: Joi.string().optional(),
            propertyNo: Joi.string().optional(),
            description: Joi.string().optional(),
            short_description: Joi.string().optional(),
            imageUrl: Joi.string().optional(),
            state: Joi.string().optional(),
            district: Joi.string().optional(),
            price: Joi.string().optional(),
            propertyType: Joi.string().optional(),
            location: Joi.object().optional()
        }
        try {
            var validatedBody = await Joi.validate(req.body, validationSchema);
            let userResult = await findUser({ _id: req.userId, userType: userType.ADMIN });
            if (!userResult) {
                throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
            }
            let propertyFind = await findProperty({ _id: validatedBody.propertyId, status: { $ne: status.DELETE } })
            if (!propertyFind) {
                throw apiError.notFound(responseMessage.PROPERTY_NOT_FOUND);
            }
            // let propertyRes = await findProperty({ _id: { $ne: propertyFind._id }, propertyNo: validatedBody.propertyNo, status: { $ne: status.DELETE } })
            // if (propertyRes) {
            //     throw apiError.conflict(responseMessage.PROPERTY_ALREADY_EXIST);
            // }
            let updateRes = await updateProperty({ _id: propertyFind._id }, validatedBody)
            return res.json(new response(updateRes, responseMessage.UPDATE_PROPERTY));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /property/listProperty:
     *   get:
     *     tags:
     *       - PROPERTY
     *     description: listProperty
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: search
     *         description: search
     *         in: query
     *         required: false
     *       - name: district
     *         description: district
     *         in: query
     *         required: false
     *       - name: propertyType
     *         description: propertyType (ONE_BHK,TWO_BHK,THREE_BHK,FOUR_BHK,FIVE_BHK)
     *         in: query
     *         required: false
     *       - name: state
     *         description: state
     *         in: query
     *         required: false
     *       - name: fromDate
     *         description: fromDate
     *         in: query
     *         required: false
     *       - name: toDate
     *         description: toDate
     *         in: query
     *         required: false
     *       - name: page
     *         description: page
     *         in: query
     *         required: false
     *       - name: limit
     *         description: limit
     *         in: query
     *         required: false
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async listProperty(req, res, next) {
        const validationSchema = {
            search: Joi.string().optional(),
            fromDate: Joi.string().optional(),
            toDate: Joi.string().optional(),
            page: Joi.string().optional(),
            limit: Joi.string().optional(),
            state: Joi.string().optional(),
            propertyType: Joi.string().optional(),
            district: Joi.string().optional(),
        };
        try {
            const validatedBody = await Joi.validate(req.query, validationSchema);
            var result = await propertyPaginateSearch(validatedBody);
            if (result.docs.length==0) {
                throw apiError.notFound(responseMessage.PROPERTY_NOT_FOUND);
            }
            return res.json(new response(result, responseMessage.PROPERTY_FOUND));
        } catch (error) {
            return next(error);
        }
    }

}
export default new propertyController();