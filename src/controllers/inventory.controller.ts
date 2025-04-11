import { NextFunction, Request, Response } from 'express';
import { prisma } from "../utils/prismaclient.js";
import HttpStatusCodes from '../common/httpstatuscode.js';
import { ProductStatus } from '@prisma/client';

const getOverview = async (req: Request, res: Response, next: NextFunction) => {
    const [products, productVariants] = await Promise.all([
        prisma.product.count(),
        prisma.productVariant.findMany({
            select: {
                stock: true,
                color: { select: { productId: true } },
            },
        }),
    ]);

    const stockMap = new Map<string, number>();

    let outOfStock = products;
    let restockAlerts = 0;
    let lowStockItems = 0;

    for (const { stock, color: { productId } } of productVariants) {
        const currentStock = stockMap.get(productId) || 0;
        const updatedStock = currentStock + stock;
        stockMap.set(productId, updatedStock);
    }

    for (const stock of stockMap.values()) {
        if (stock > 10) restockAlerts++;
        else if (stock <= 10) lowStockItems++;

        if (stock > 0) outOfStock--;
    }

    res.status(HttpStatusCodes.OK).json({
        totalProducts: products,
        lowStockItems,
        outOfStock,
        restockAlerts,
    });
};

const getInventory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page = 1, limit = 10 , search = '' } = req.query;
        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const skip = (pageNum - 1) * limitNum;

        const searchFilter = search
            ? { name: { contains: search as string, mode: "insensitive" as const } }
            : {};

        // Fetch paginated products and total count in parallel
        const [products, totalProducts, productStocks] = await Promise.all([
            prisma.product.findMany({
                where: { ...searchFilter },
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
                select: { id: true, name: true },
            }),
            prisma.product.count({ where: { status: ProductStatus.PUBLISHED } }),
            prisma.productVariant.findMany({
                where: { color: { productId: { in: (await prisma.product.findMany({
                    where: { status: ProductStatus.PUBLISHED },
                    skip,
                    take: limitNum,
                    select: { id: true }
                })).map(p => p.id) } } },
                select: { stock: true, color: { select: { productId: true } } },
            }),
        ]);

        // Aggregate stocks using a Map
        const stockMap = new Map<string, number>();
        for (const { stock, color: { productId } } of productStocks) {
            stockMap.set(productId, (stockMap.get(productId) || 0) + stock);
        }

        // Build the response
        const result = {
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(totalProducts / limitNum),
                totalProducts,
            },
            products: products.map((product) => ({
                id: product.id,
                name: product.name,
                inStock: stockMap.get(product.id) || 0,
                lowStockThreshold: 10, 
            })),
        };

        res.status(HttpStatusCodes.OK).json(result);
    } catch (error) {
        next(error);
    }
};


export default { 
    getOverview,
    getInventory,
 };