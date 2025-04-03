import { Request, Response, NextFunction } from "express";
import HttpStatusCodes from "../common/httpstatuscode.js";
import { RouteError } from "../common/routeerror.js";
import { prisma } from "../utils/prismaClient.js";


const getPerformance = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const rawProducts = await prisma.product.findMany({
            include: {
                Sales: {
                    select: {
                        totalRevenue: true,
                        totalOrders: true,
                        date: true,
                    }
                },
                category: true
            }
        });

        const formattedProducts = rawProducts.map((product) => ({
            id: product.id,
            name: product.name,
            category: product.category?.name || "Uncategorized",
            sales: product.Sales.reduce((acc, sale) => acc + sale.totalOrders, 0),
            revenue: product.Sales.reduce((acc, sale) => acc + Number(sale.totalRevenue), 0),
            profit: Number((product.Sales.reduce((acc, sale) => acc + Number(sale.totalRevenue), 0) * 0.2).toFixed(2)),
            date: product.Sales.map((sale) => sale.date),
            
        }));
        formattedProducts.sort((a, b) => b.revenue - a.revenue);

        res.status(HttpStatusCodes.OK).json({
            products: formattedProducts.filter(product => product.revenue > 0)
    });
    } catch (error) {
        console.error("🚨 Error fetching performance data:", error);
        next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, "Failed to retrieve performance data"));
    }
};


export default {
    getPerformance,
};
