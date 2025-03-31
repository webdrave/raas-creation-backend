import { PrismaClient, ProductStatus, AssetType, Size } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { prisma } from "../utils/prismaClient";
import { RouteError, ValidationErr } from "../common/routeerror";
import { addProductSchema, addSizesSchema, updateStockSchema } from "../types/validation/product";
import HttpStatusCodes from "../common/httpstatuscode";

const addProduct = async (req: Request, res: Response, next: NextFunction) => {
  console.log("resiving request to add product", req.body);
  console.log("category id", req.body.categoryId);
  const parsed = addProductSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationErr(parsed.error.errors);
  }

  const { name, description, price, discount, categoryId, assets, status, material } = parsed.data;

  try {
    // Ensure the status is valid (either DRAFT or PUBLISHED)
    if (!['DRAFT', 'PUBLISHED'].includes(status)) {
      throw new ValidationErr([{ message: "Invalid status value" }]);
    }

    // Create the product and its assets
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        discount, 
        categoryId,
        material,
        status,
        assets: {
          create: assets?.map((asset: { url: string; type: AssetType }) => ({
            asset_url: asset.url,
            type: asset.type,
          })) || [], // Empty array if no assets
        },
      },
      include: { assets: true }, // Include assets in the response
    });

    res.status(HttpStatusCodes.CREATED).json({ success: true, product });
  } catch (error) {
    next(error); 
  }
};

const getAllProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = (req.query.search as string) || '';
  const status = req.query.status as "PUBLISHED" | "DRAFT" | undefined;
  
  const skip = (page - 1) * limit;
  
  const totalCount = await prisma.product.count({
    where: {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ],
      ...(status && { status })
    }
  });
  
  const totalPages = Math.ceil(totalCount / limit);
  
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ],
      ...(status && { status })
    },
    include: {
      assets: true,
    },
    skip,
    take: limit,
  });
  
  res.status(HttpStatusCodes.OK).json({ 
    success: true, 
    products,
    pagination: {
      totalPages,
      currentPage: page,
      totalItems: totalCount,
      itemsPerPage: limit
    }
  });
};

const getProduct = async (req: Request, res: Response, next: NextFunction) => {
  // if(!req.user && req?.user?.role !== "ADMIN"){
  //   throw new RouteError(HttpStatusCodes.UNAUTHORIZED, "Unauthorized");
  // }
  const { id } = req.params;
  if (!id) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Missing product id");
  }

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      assets: true,
      category: true, // Include the category if needed
    },
  });

  if (!product) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, "Product not found");
  }
  res.status(HttpStatusCodes.OK).json({ success: true, product });
};

const addSizes = async (req: Request, res: Response, next: NextFunction) => {
  // Validate request body with the schema
  const parsed = addSizesSchema.safeParse(req.body);
  
  // If validation fails, throw a custom error
  if (!parsed.success) {
    throw new ValidationErr(parsed.error.errors);
  }

  // Extract data from the validated request body
  const { productId, sizes } = parsed.data;

  try {
    const variants = await prisma.variant.createMany({
      data: sizes.map((sizeObj) => ({
        size: sizeObj.size as Size, 
        stock: sizeObj.stock as number, 
        productId: productId, 
      })),
    });
    res.status(HttpStatusCodes.CREATED).json({ success: true, variants });
  } catch (error) {
    next(error);
  }
};

const updateStock = async (req: Request, res: Response, next: NextFunction) => {
  
  const parsed = updateStockSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationErr(parsed.error.errors);
  }
  const { variantId, stock } = parsed.data;

  const updatedVariant = await prisma.variant.update({
    where: { id: variantId },
    data: { stock },
  });

  res.status(HttpStatusCodes.OK).json({ success: true, updatedVariant });
}

const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  console.log("resiving request to delete product", req.body);
  const { id } = req.params;

  console.log("product id", id);
  if (!id) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Missing product id");
  }

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, "Product not found");
  }

  await prisma.product.delete({ where: { id } });
  res.status(HttpStatusCodes.OK).json({ success: true, message: "Product deleted" });
};


export default { addProduct, getAllProduct, getProduct, addSizes, updateStock ,deleteProduct};
