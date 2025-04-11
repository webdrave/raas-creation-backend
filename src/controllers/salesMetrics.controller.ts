import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prismaclient.js";

const getAllTimeMetrics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const totalRevenue = await prisma.order.aggregate({
      _sum: { total: true },
    });

    const totalOrders = await prisma.order.count();
    const newCustomers = await prisma.user.count();

    // Calculate sales growth: compare last month to the total
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const lastMonthRevenue = await prisma.order.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: oneMonthAgo } },
    });

    const salesGrowth =
      lastMonthRevenue._sum.total && totalRevenue._sum.total
        ? (lastMonthRevenue._sum.total / totalRevenue._sum.total) * 100
        : 0;

    res.json({
      totalRevenue: totalRevenue._sum.total || 0,
      totalOrders,
      newCustomers,
      salesGrowth,
    });
  } catch (error) {
    next(error);
  }
};

export default { getAllTimeMetrics };
