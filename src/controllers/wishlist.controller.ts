import { Request, Response } from "express";
import { prisma } from "../utils/prismaclient.js";

const getAll = async (req: Request, res: Response) => {
  try {
    const { id } = req.user;
    const { page = 1, limit = 10 } = req.query;
    const currentPage = Number(page);
    const itemsPerPage = Number(limit);

    if (!id) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const totalItems = await prisma.wishlist.count({
      where: {
        userId: id,
      }
    });

    const wishlists = await prisma.wishlist.findMany({
      where: {
        userId: id,
      },
      include: {
        product: {
          include: {
            assets: {
              take: 1,
            },
          }
        },
      },
      skip: (currentPage - 1) * itemsPerPage,
      take: itemsPerPage,
    });

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    res.status(200).json({
      success: true,
      data: {
        pagination: {
          totalPages,
          currentPage,
          totalItems,
          itemsPerPage
        },
        wishlists
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const addToWishlist = async (req: Request, res: Response) => {
  try {
    const { id } = req.user;
    const { productId } = req.body;
    if (!id) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const existingWishlist = await prisma.wishlist.findFirst({
      where: {
        userId: id,
        productId: productId,
      },
    });
    if (existingWishlist) {
      res.status(400).json({ error: "Product already in wishlist" });
      return;
    }
    const wishlist = await prisma.wishlist.create({
      data: {
        userId: id,
        productId: productId,
      },
    });
    res.status(200).json({ sucess: true, data: wishlist });
  }
  catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deletetoWishlist = async (req: Request, res: Response) => {
  try {
    const { id } = req.user;
    const { productId } = req.params;
    if (!id) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const existingWishlist = await prisma.wishlist.findFirst({
      where: {
        userId: id,
        productId: productId,
      },
    });
    if (!existingWishlist) {
      res.status(400).json({ error: "Product not in wishlist" });
      return;
    }
    await prisma.wishlist.delete({
      where: {
        userId_productId: {
          userId: id,
          productId: productId
        }
      },
    });
    res.status(200).json({ sucess: true, message: "Product removed from wishlist" });
  }
  catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getProductList = async (req: Request, res: Response) => {
  try {
    const { id } = req.user;
    if (!id) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const wishlists = await prisma.wishlist.findMany({
      where: {
        userId: id,
      }
    });

    const productIds = wishlists.map((wishlist) => wishlist.productId);

    res.status(200).json({ sucess: true, data: productIds });
  }
  catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
export const wishlistController = {
  getAll,
  addToWishlist,
  deletetoWishlist,
  getProductList,
};