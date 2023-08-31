import Mongoose, { Schema, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";
import status from '../enums/status';
import propertyType from '../enums/propertyType'

var propertyModel = new Schema(

    {
        title: {
            type: String
        },
        propertyNo: {
            type: String
        },
        description: {
            type: String
        },
        short_description: {
            type: String
        },
        imageUrl: {
            type: String
        },
        state: {
            type: String
        },
        district: {
            type: String
        },
        price: {
            type: String
        },
        propertyType: {
            type: String,
            enum: [propertyType.ONE_BHK, propertyType.TWO_BHK, propertyType.THREE_BHK,propertyType.FOUR_BHK,propertyType.FIVE_BHK],
            default: propertyType.ONE_BHK
        },
        status: {
            type: String,
            default: status.ACTIVE
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
    },
    { timestamps: true }
);
propertyModel.index({ location: "2dsphere" })
propertyModel.plugin(mongooseAggregatePaginate)
propertyModel.plugin(mongoosePaginate);
module.exports = Mongoose.model("property", propertyModel);