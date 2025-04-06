import { PrismaClient, ProductStatus, AssetType, Size } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { prisma } from "../utils/prismaClient";
import { RouteError, ValidationErr } from "../common/routeerror";
import {
  addProductSchema,
  addSizesSchema,
  updateStockSchema,
  addVariantSchema,
  updateVariantSchema,
} from "../types/validation/product";
import HttpStatusCodes from "../common/httpstatuscode";

const addProduct = async (req: Request, res: Response, next: NextFunction) => {
  console.log("resiving request to add product", req.body);
  console.log("category id", req.body.categoryId);
  const parsed = addProductSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationErr(parsed.error.errors);
  }

  const {
    name,
    description,
    price,
    discount,
    categoryId,
    assets,
    status,
    material,
  } = parsed.data;

  try {
    // Ensure the status is valid (either DRAFT or PUBLISHED)
    if (!["DRAFT", "PUBLISHED"].includes(status)) {
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
          create:
            assets?.map((asset: { url: string; type: AssetType }) => ({
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
  const search = (req.query.search as string) || "";
  const status = req.query.status as "PUBLISHED" | "DRAFT" | undefined;

  const skip = (page - 1) * limit;

  const totalCount = await prisma.product.count({
    where: {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
      ...(status && { status }),
    },
  });

  const totalPages = Math.ceil(totalCount / limit);

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
      ...(status && { status }),
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
      itemsPerPage: limit,
    },
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
      category: true,
      variants: true,
    },
  });

  if (!product) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, "Product not found");
  }
  res.status(HttpStatusCodes.OK).json({ success: true, product });
};

const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("Receiving request to delete product", req.params);
    const { id } = req.params;

    if (!id) {
       res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Missing product id" });
    }

    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) {
       res
        .status(HttpStatusCodes.NOT_FOUND)
        .json({ success: false, message: "Product not found" });
    }

    await prisma.product.delete({ where: { id } });

     res
      .status(HttpStatusCodes.OK)
      .json({ success: true, message: "Product deleted" });
  } catch (error) {
    console.error("Error deleting product:", error);
    next(error); // Pass to global error handler
  }
};

const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const parsed = addProductSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationErr(parsed.error.errors);
  }
  const { name, description, price, discount, categoryId, assets, status } =
    parsed.data;
  if (!id) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Missing product id");
  }
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, "Product not found");
  }
  const updatedProduct = await prisma.product.update({
    where: { id },
    data: {
      name,
      description,
      price,
      discount,
      categoryId,
      status,
      assets: {
        deleteMany: {}, // Delete existing assets
        create:
          assets?.map((asset: { url: string; type: AssetType }) => ({
            asset_url: asset.url,
            type: asset.type,
          })) || [], // Create new assets
      },
    },
  });
  res.status(HttpStatusCodes.OK).json({ success: true, updatedProduct });
};

const productVariant = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = addVariantSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationErr(parsed.error.errors);
    }

    const { productId, sizes } = parsed.data;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "Product not found");
    }

    // Create variant
    const variant = await prisma.variant.create({
      data: {
        productId,
        SizeStock: {
          create: sizes.map(({ size, stock }) => ({
            size,
            stock,
          })),
        },
      },
      include: {
        product: true,
        SizeStock: true,
      },
    });

    res.status(HttpStatusCodes.CREATED).json({
      success: true,
      variant,
    });
  } catch (error) {
    next(error);
  }
};




const updateProductVariant = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = updateVariantSchema.safeParse({
      ...req.body,
      variantId: req.params.variantId,
    });

    if (!parsed.success) {
      throw new ValidationErr(parsed.error.errors);
    }

    const { variantId, size, stock } = parsed.data;

    const variant = await prisma.variant.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "Variant not found");
    }

    const updatedSizeStock = await prisma.sizeStock.update({
      where: {
        id: size, // Assuming 'size' uniquely identifies the size stock. Replace with the correct identifier if needed.
      },
      data: {
        stock: stock,
        // size: newSize, // optional if you want to change size
      },
    });

    const updatedVariant = await prisma.variant.findUnique({
      where: { id: variantId },
      include: { SizeStock: true },
    });

    res.status(HttpStatusCodes.OK).json({ success: true, updatedVariant });

  } catch (err) {
    next(err);
  }
};




export default {
  addProduct,
  getAllProduct,
  getProduct,
  // updateStock,
  deleteProduct,
  updateProduct,
  productVariant,
  updateProductVariant,
};
