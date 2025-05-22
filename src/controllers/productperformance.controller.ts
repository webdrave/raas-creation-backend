import { Request, Response, NextFunction } from "express";
import HttpStatusCodes from "../common/httpstatuscode.js";
import { RouteError } from "../common/routeerror.js";
import { prisma } from "../utils/prismaclient.js";
import data from "../common/env.js";


// const getPerformance = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const rawProducts = await prisma.product.findMany({
//             include: {
//                 sales: {
//                     select: {
//                         totalRevenue: true ,
//                         totalOrders: true,
//                         date: true,
//                     }
//                 },
//                 category: true
//             }
//         });

//         const formattedProducts = rawProducts.map((product) => ({
//             id: product.id,
//             name: product.name,
//             category: product.category?.name || "Uncategorized",
//             sales: product.sales.reduce((acc, sale) => acc + sale.totalOrders, 0),
//             revenue: product.sales.reduce((acc, sale) => acc + Number(sale.totalRevenue), 0),
//             profit: Number((product.sales.reduce((acc, sale) => acc + Number(sale.totalRevenue), 0) * 0.2).toFixed(2)),
//             date: product.sales.map((sale) => sale.date),

//         }));
//         formattedProducts.sort((a, b) => b.revenue - a.revenue);

//         res.status(HttpStatusCodes.OK).json({
//             // products: formattedProducts.filter(product => product.revenue > 0)
//     });
//     } catch (error) {
//         console.error("🚨 Error fetching performance data:", error);
//         next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, "Failed to retrieve performance data"));
//     }
// };

const getPerformance = async (req: Request, res: Response, next: NextFunction) => {


    const rawProducts = await prisma.orderItem.findMany({
        include: {
            product: {
                include: {
                    category: true,
                },
            }
        },
    });

    const revenueByCategory = {};

    for (const item of rawProducts) {
        const category = item.product.category;
        const categoryId = category.id; // or use category.name if more readable
        const revenue = item.priceAtOrder * item.quantity;

        if (!revenueByCategory[categoryId]) {
            revenueByCategory[categoryId] = {
                categoryName: category.name,
                totalRevenue: 0,
            };
        }

        revenueByCategory[categoryId].totalRevenue += revenue;
    }



    res.status(HttpStatusCodes.OK).json({
        message: "Performance data retrieved successfully",
        data: revenueByCategory,
    });
};
const getTopperformer = async (req: Request, res: Response, next: NextFunction) => {
  try {

    // Since we can't multiply in prisma groupBy, let's do it with raw query:

    const rawResult = await prisma.$queryRaw<
      { productName: string; totalRevenue: number }[]
    >`
      SELECT 
        "productName",
        SUM("priceAtOrder" * quantity) as "totalRevenue"
      FROM "OrderItem"
      GROUP BY "productName"
      ORDER BY "totalRevenue" DESC
    `;

    res.status(200).json({
      message: "Top performers by product name",
      data: rawResult,
    });
  } catch (error) {
    next(error);
  }
};

export default {
    getPerformance,
    getTopperformer,
};
