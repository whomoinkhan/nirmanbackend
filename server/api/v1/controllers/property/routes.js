import Express from "express";
import controller from "./controller";
import auth from "../../../../helper/auth";
import upload from '../../../../helper/uploadHandler';


export default Express.Router()

    .get('/viewProperty', controller.viewProperty)
    .get('/listProperty', controller.listProperty)
    .use(auth.verifyToken)
    .post('/addProperty', controller.addProperty)
    .delete('/deleteProperty', controller.deleteProperty)
    .put('/editProperty', controller.editProperty)

    .use(upload.uploadFile)
    .post('/uploadFile', controller.uploadFile)