import { NextFunction, Request, Response } from "express";
import HttpStatusCodes from "../common/httpstatuscode.js";
import { RouteError, ValidationErr } from "../common/routeerror.js";
import {
    addCategorySchema,
    updateCategorySchema,
} from "../types/validations/category.js";

import { prisma } from "../utils/prismaclient.js";

/** ✅ Add a new category */
const addCategory = async (req: Request, res: Response, next: NextFunction) => {

    const parsed = addCategorySchema.safeParse(req.body);
    if (!parsed.success) {
        throw new ValidationErr(parsed.error.errors);
    }
    const { name } = parsed.data;

    const highestPriority = await prisma.category.findFirst({
        orderBy: { priority: "desc" },
        select: { priority: true },
    });

    const priority = highestPriority ? highestPriority.priority + 1 : 1;

    const category = await prisma.category.create({
        data: {
            name,
            priority,
        },
    });

    res.status(HttpStatusCodes.CREATED).json({ success: true, category });
};

/** ✅ Update a category */
const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
    const parsed = updateCategorySchema.safeParse(req.body);

    if (!parsed.success) {
        throw new ValidationErr(parsed.error.errors);
    }
    const { id } = req.params;

    if (!id) {
        throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Missing category id");
    }

    const category = await prisma.category.update({
        where: { id },
        data: {
            name: parsed.data.name,
            description: parsed.data.description,
        },
    });

    res.status(HttpStatusCodes.OK).json({ success: true, category });
};

/** ✅ Delete a category */
const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {

    const { id } = req.params;
    if (!id) {
        throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Missing category id");
    }

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
        throw new RouteError(HttpStatusCodes.NOT_FOUND, "Category not found");
    }

    await prisma.category.delete({ where: { id } });
    res.status(HttpStatusCodes.OK).json({ success: true, message: "Category deleted" });
};

/** ✅ Get all categories */
/** ✅ Get all categories */
const getAllCategories = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const categories = await prisma.category.findMany({
        include: {
            _count: {
                select: { Product: true },
            },
        },
        orderBy: { priority: "asc" },
    });

    // Optionally format the result to include productCount field explicitly
    const formatted = categories.map((cat) => ({
        ...cat,
        productCount: cat._count.Product,
    }));

    res.status(HttpStatusCodes.OK).json({ success: true, categories: formatted });
};

/** ✅ Get a category by ID */
/** ✅ Get a category by ID */
const getCategory = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    if (!id) {
        throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Missing category id");
    }

    const category = await prisma.category.findUnique({
        where: { id },
        include: {
            _count: {
                select: { Product: true },
            },
        },
    });

    if (!category) {
        throw new RouteError(HttpStatusCodes.NOT_FOUND, "Category not found");
    }

    const formatted = {
        ...category,
        productCount: category._count.Product,
    };

    res.status(HttpStatusCodes.OK).json({ success: true, category: formatted });
};

const getCategoryDetails = async (req: Request, res: Response, next: NextFunction) => {
    
    const categories  = await prisma.category.findMany({
        where: {
            Product: {
                some: {}
            }
        },
        include: {
            Product: {
                take: 1,
                include: {
                    assets: {
                        take:1,
                    }
                }
            }
        },
        orderBy: { priority: "asc" },
    });

    categories.filter((category) => category.Product.length > 0);
    
    res.status(HttpStatusCodes.OK).json({ success: true, categories });
};

const updateCategoryPriority = async (req: Request, res: Response, next: NextFunction) => {
    const { id, priority } = req.body;
    if (!id) {
        throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Missing category id");
    }
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
        throw new RouteError(HttpStatusCodes.NOT_FOUND, "Category not found");
    }

    await prisma.category.updateMany({
        where: {
            priority: {
                gte: parseInt(priority)
            }
        },
        data: {
            priority: {
                increment: 1
            }
        }
    });

    const updatedCategory = await prisma.category.update({
        where: { id },
        data: {
            priority: {
                set: parseInt(priority)
            }
        }
    });
    res.status(HttpStatusCodes.OK).json({ success: true, category: updatedCategory });
};    

export default {
    addCategory,
    updateCategory,
    deleteCategory,
    getAllCategories,
    getCategoryDetails,
    getCategory,
    updateCategoryPriority,
};