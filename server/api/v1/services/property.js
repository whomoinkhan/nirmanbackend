import propertyModel from "../../../models/property";
import status from '../../../enums/status';


const propertyServices = {

    createProperty: async (insertObj) => {
        return await propertyModel.create(insertObj);
    },

    findProperty: async (query) => {
        return await propertyModel.findOne(query);
    },

    updateProperty: async (query, updateObj) => {
        return await propertyModel.findOneAndUpdate(query, updateObj, { new: true });
    },

    propertyList: async (query) => {
        return await propertyModel.find(query);
    },

    propertyPaginateSearch: async (validatedBody) => {
        let query = { status: { $ne: status.DELETE } };
        const { search, fromDate, toDate, page, limit, state, propertyType,district } = validatedBody;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } }
            ]
        }
        if (state) {
            query.state = state
        }
        if (propertyType) {
            query.propertyType = propertyType
        }
        if (district) {
            query.district = district
        }
        if (fromDate && !toDate) {
            query.createdAt = { $gte: new Date(new Date(fromDate).toISOString().slice(0, 10)) };

        }
        if (!fromDate && toDate) {
            query.createdAt = { $lte: new Date(new Date(toDate).toISOString().slice(0, 10) + 'T23:59:59.999Z') };

        }
        if (fromDate && toDate) {
            query.$and = [
                { createdAt: { $gte: new Date(new Date(fromDate).toISOString().slice(0, 10)) } },
                { createdAt: { $lte: new Date(new Date(toDate).toISOString().slice(0, 10) + 'T23:59:59.999Z') } },
            ]
        }
        let options = {
            page: Number(page) || 1,
            limit: Number(limit) || 15,
            sort: { createdAt: -1 },
        };
        return await propertyModel.paginate(query, options);
    },


}

module.exports = { propertyServices };