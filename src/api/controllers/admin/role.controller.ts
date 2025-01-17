import { Joi, celebrate } from "celebrate";
import { CONTROLLER, VALIDATOR } from "../../../utils/constants";
import { sendResponse } from "../../../utils/sendResponse";
import httpStatus from "http-status";
import { Role } from "../../../db/models/Role.model";

const addRole = {
    [VALIDATOR]: celebrate({
        body: Joi.object()
            .keys({
                role: Joi.string().required(),
                desc: Joi.string().allow(null, ""),
            })
            .required(),
    }),
    [CONTROLLER]: async (req, res) => {
        const { role, desc } = req.body;
        const foundRole = await Role.findOne({ role });
        if (foundRole)
            return sendResponse(
                res,
                {},
                "Same role already exists",
                false,
                httpStatus.OK
            );
        const newRole = new Role({
            role,
            desc: desc || null,
        });
        const roleSaved = await newRole.save();
        // const clientSaved = await userRepo.save(newUser);
        return sendResponse(
            res,
            { role: roleSaved },
            "New role added successfully",
            true,
            httpStatus.OK
        );
    },
};


const getRoleDropdown = {
    [CONTROLLER]: async (req, res) => {
        const foundRole = await Role.find({}, '_id role');
        if (!foundRole)
            return sendResponse(
                res,
                {},
                "Role not found",
                false,
                httpStatus.OK
            );
        return sendResponse(
            res,
            foundRole,
            "Roles found successfully",
            true,
            httpStatus.OK
        );
    },
};

const getRoleList = {
    [VALIDATOR]: celebrate({
        query: Joi.object()
            .keys({
                search_term: Joi.string().lowercase().allow("", null),
                sort_field: Joi.string().trim().allow(null, ""),
                sort_order: Joi.string().valid("asc", "desc").trim().allow(""),
                per_page: Joi.number().integer().min(1).max(1000).required(),
                page_number: Joi.number().integer().min(1).max(1000).required(),
            })
            .required(),
    }),
    [CONTROLLER]: async (req, res) => {
        const {
            search_term = "",
            sort_field = "createdAt",
            sort_order = "desc",
            per_page = 10,
            page_number = 1,
        } = req.query;
        const query: any = {};
        if (search_term) {
            query.$or = [
                { name: new RegExp(search_term, "i") },
                { email: new RegExp(search_term, "i") },
            ];
        }

        // Building sort options
        const sortOptions: any = {};
        sortOptions[sort_field] = sort_order === "asc" ? 1 : -1;
        // Pagination options
        const limit = parseInt(per_page as string, 10);
        const skip = (parseInt(page_number as string, 10) - 1) * limit;

        // Fetching users
        const roles = await Role.find(query)
            .select([
                "_id",
                "role",
            ])
            .sort(sortOptions)
            .skip(skip)
            .limit(limit);
        // Fetching total count for pagination
        const totalUsers = await Role.countDocuments(query);
        const result = {
            roles,
            total_roles: totalUsers,
            page_number: parseInt(page_number as string, 10),
            per_page: limit,
        };
        return sendResponse(
            res,
            result,
            "Users list got successfully",
            true,
            httpStatus.OK
        );
    },
};


export { addRole, getRoleDropdown, getRoleList };
