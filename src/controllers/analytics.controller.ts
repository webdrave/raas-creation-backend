import { Request, Response, NextFunction } from "express";
import HttpStatusCodes from "../common/httpstatuscode.js";
import { prisma } from "../utils/prismaclient.js";

const getTopProducts = async (req: Request, res: Response, next: NextFunction) => {
  const limit = parseInt(req.query.limit as string) || 5;

  const topProducts = await prisma.orderItem.groupBy({
    by: ["productVariantId"],
    _sum: {
      quantity: true,
      priceAtOrder: true,
    },
  });

  // Sort manually (since Prisma does not allow ordering by _sum)
  topProducts.sort((a, b) => (b._sum.quantity || 0) - (a._sum.quantity || 0));

  // Limit results after sorting
  const limitedProducts = topProducts.slice(0, limit);

  const products = await Promise.all(
    limitedProducts.map(async (item) => {
      const productVariant = await prisma.productVariant.findUnique({
        where: { id: item.productVariantId },
        include: {
          color: {
            include: {
              product: true,
            },
          },
        },
      });

      return {
        id: productVariant?.color?.product?.id || "",
        name: productVariant?.color?.product?.name || "Unknown Product",
        sales: item._sum.quantity || 0,
        revenue: item._sum.priceAtOrder || 0,
      };
    })
  );

  res.status(HttpStatusCodes.OK).json({ success: true, products });
};


const getBesSellers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const limit = parseInt(req.query.limit as string) || 5;

  const topProducts = await prisma.orderItem.groupBy({
    by: ["productVariantId"],
    _sum: {
      quantity: true,
      priceAtOrder: true,
    },
  });
  // Sort and limit
  const limitedProducts = topProducts
    .sort((a, b) => (b._sum.quantity || 0) - (a._sum.quantity || 0))
    .slice(0, limit);

  // Fetch product variants and their products in a single query
  const productVariants = await prisma.productVariant.findMany({
    where: {
      id: { in: limitedProducts.map((item) => item.productVariantId) },
    },
    include: {
      color: {
        include: {
          product: {
            include: {
              category: true,
            },
          },
          assets: {
            take: 1,
          },
        },
      },
    },
  });
  const products = productVariants.map((variant) => {
    return {
      productid: variant.color?.product?.id || "",
      img: variant.color.assets[0].asset_url, 
      name: variant.color?.product?.name ,
      price: variant.color.product.price,
      category: variant.color?.product.category.name , // Assuming category field exists
      discount: variant.color.product.discountPrice, // Assuming discount field exists
    };
  });

  res.status(HttpStatusCodes.OK).json({ success: true, products });
};

const newArrivals = async (req: Request, res: Response, next: NextFunction) => {
  const limit = parseInt(req.query.limit as string) || 5;

  const newProducts = await prisma.product.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    where: {
      status: "PUBLISHED",
    },
    include: {
      category: true,
      assets: {
        take: 1,
      },
    },
  });

  const products = newProducts.map((product) => ({
    id: product.id,
    name: product.name,
    img: product.assets[0].asset_url,
    price: product.price,
    discountPrice: product.discountPrice,
    category: product.category.name,
  }));

  res.status(HttpStatusCodes.OK).json({ success: true, products });
};


export const AnalyticsController = {
  getTopProducts,
  getBesSellers,
  newArrivals,
};
