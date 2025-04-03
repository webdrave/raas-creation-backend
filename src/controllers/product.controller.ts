import { AssetType } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { prisma } from "../utils/prismaClient";
import { RouteError, ValidationErr } from "../common/routeerror";
import {
  addProductSchema,
  addSizesSchema,
  updateStockSchema,
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
  const { id } = req.params;
  if (!id) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Missing product id");
  }

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      assets: true, // ✅ Product images
      variants: {
        // ✅ Corrected "variants" relation
        select: {
          id: true,
          size: true, // ✅ Enum hai toh select kaafi hai
          images: true,
          stock: true,
        },
      },
    },
  });

  if (!product) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, "Product not found");
  }

  res.status(HttpStatusCodes.OK).json({ success: true, product });
};

const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;

  if (!id) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Missing product id");
  }

  const parsed = addProductSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationErr(parsed.error.errors);
  }

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, "Product not found");
  }

  const {
    name,
    description,
    price,
    discount,
    categoryId,
    material,
    assets,
    status,
  } = parsed.data;

  // First, delete existing assets if new ones are provided
  if (assets && assets.length > 0) {
    await prisma.productAsset.deleteMany({
      where: {
        productId: id,
      },
    });
  }

  // Update the product with all fields
  const updatedProduct = await prisma.product.update({
    where: { id },
    data: {
      name,
      description,
      price,
      discount,
      categoryId,
      material,
      status,
      assets: assets
        ? {
            create: assets.map((asset: { url: string; type: AssetType }) => ({
              asset_url: asset.url,
              type: asset.type,
            })),
          }
        : undefined,
    },
    include: {
      assets: true,
    },
  });
  res.status(HttpStatusCodes.OK).json({ success: true, updatedProduct });
};

const addSizes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Validate request body using Zod schema
  const parsed = addSizesSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(new ValidationErr(parsed.error.errors));
  }

  const { productId, sizes } = parsed.data;

  try {
    // Ensure sizes array is not empty
    if (!sizes.length) {
      res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ success: false, message: "No sizes provided" });
    }

    // Check if the product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      next(new ValidationErr("Product not found"));
    }

    // Get existing variants for the product
    const existingVariants = await prisma.variant.findMany({
      where: { productId, size: { in: sizes.map((s) => s.size) } },
    });

    const existingSizes = new Set(existingVariants.map((v) => v.size));

    // Filter out sizes that already exist
    const newSizes = sizes.filter((s) => !existingSizes.has(s.size));

    if (!newSizes.length) {
      res
        .status(HttpStatusCodes.OK)
        .json({ success: false, message: "Sizes already exist" });
    }

    // Insert new variants into the database
    await prisma.variant.createMany({
      data: newSizes.map((sizeObj) => ({
        size: sizeObj.size,
        stock: sizeObj.stock,
        productId,
      })),
    });

    res
      .status(HttpStatusCodes.CREATED)
      .json({ success: true, message: "Variants added successfully" });
  } catch (error) {
    next(error);
  }
};

const addVerient = async (req: Request, res: Response) => {
  try {
    const { size, images, stock } = req.body;
    const { productId } = req.params; // URL se productId le rahe hain

    // Validation checks
    if (!size || !Array.isArray(images) || images.length === 0 || stock < 0) {
      res.status(400).json({ success: false, message: "Invalid input data" });
    }

    // Create new variant in DB
    const newVariant = await prisma.variant.create({
      data: {
        size,
        images,
        stock,
        product: {
          connect: {
            id: req.params.id, // Using ID from URL
          },
        },
      },
    });

    res.json({ success: true, variant: newVariant });
  } catch (error) {
    console.error("Error adding variant:", error);
    res.json({ success: false, message: "Something went wrong!" });
  }
};

const deleteVariant = async (req: Request, res: Response) => {
  const { variantId } = req.params; // Get variantId from URL
  if (!variantId) {
    res.status(400).json({ success: false, message: "Variant ID is required" });
  }
  try {
    const deletedVariant = await prisma.variant.delete({
      where: { id: variantId },
    });
    res.status(200).json({ success: true, deletedVariant });
  } catch {
    res.status(500).json({ success: false, message: "Error deleting variant" });
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
};

const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
  res
    .status(HttpStatusCodes.OK)
    .json({ success: true, message: "Product deleted" });
};

const getOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

    const [
      totalProducts,
      totalUsers,
      totalRevenue,
      lastMonthRevenue,
      prevMonthRevenue,
    ] = await Promise.all([
      prisma.product.count({ where: { status: "PUBLISHED" } }),
      prisma.user.count(),
      prisma.order.aggregate({ _sum: { totalAmount: true } }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { createdAt: { gte: oneMonthAgo } },
      }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { createdAt: { gte: twoMonthsAgo, lt: oneMonthAgo } },
      }),
    ]);

    const totalRevenueValue = totalRevenue._sum.totalAmount ?? 0;
    const lastMonthRevenueValue = lastMonthRevenue._sum.totalAmount ?? 0;
    const prevMonthRevenueValue = prevMonthRevenue._sum.totalAmount ?? 0;

    let growthPercentage: string | null = null;
    if (prevMonthRevenueValue > 0) {
      growthPercentage =
        (
          ((lastMonthRevenueValue - prevMonthRevenueValue) /
            prevMonthRevenueValue) *
          100
        ).toFixed(1) + "%";
    }

    console.log("Revenue Data:", {
      totalRevenueValue,
      lastMonthRevenueValue,
      prevMonthRevenueValue,
      growthPercentage,
    });

    res.status(200).json({
      totalProducts,
      revenue: totalRevenueValue,
      growth: growthPercentage,
      usersCount: totalUsers,
    });
  } catch (error) {
    console.error("Error in getOverview:", error);
    res.status(500).json({ message: "Error fetching product overview" });
  }
};

const getProductVerients = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const varients = await prisma.variant.findMany({
      select: {
        id: true,
        size: true,
        stock: true,
        images: true,
        product: {
          select: {
            name: true,
            price: true,
          },
        },
      },
    });

    console.log("Fetched Variants:", varients); // Debugging

    res.json({
      success: true,
      varients,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching variants" });
  }
};

export default {
  addProduct,
  getAllProduct,
  getProduct,
  addSizes,
  updateStock,
  deleteProduct,
  getOverview,
  updateProduct,
  getProductVerients,
  addVerient,
  deleteVariant,
};
