import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prismaclient.js";
import HttpStatusCodes from "../common/httpstatuscode.js";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear.js"
dayjs.extend(weekOfYear)

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
      where: { 
        paid: true,
        createdAt: { gte: oneMonthAgo } },
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

const getSalesOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // totalRevenue: number
    // salesGrowth: number
    // totalOrders: number
    // newCustomers: number

    const days = req.query.days as string;

    const daysToSubtract = parseInt(days) || 30;

    if (days === "all") {

      // send the all time
      const totalRevenue = await prisma.order.aggregate({
        _sum: { total: true },
        where: { paid: true }
      });
      const totalOrders = await prisma.order.count();
      const newCustomers = await prisma.user.count();

      const totalRevenue2 = await prisma.order.aggregate({
        _sum: { total: true },
        where: { paid: true, createdAt: { gte: new Date(new Date().setDate(new Date().getDate() - daysToSubtract)) } }
      });
      // Calculate sales growth: compare last month to the total
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const lastMonthRevenue = await prisma.order.aggregate({
        _sum: { total: true },
        where: { paid: true, createdAt: { gte: oneMonthAgo } },
      });

      const salesGrowth = lastMonthRevenue._sum.total && totalRevenue2._sum.total ? (lastMonthRevenue._sum.total / totalRevenue2._sum.total) * 100 : 0;

      const salesOverview = {
        totalRevenue: totalRevenue._sum.total || 0,
        totalOrders,
        newCustomers,
        salesGrowth,
      };

      res.status(HttpStatusCodes.OK).json({
        salesOverview,
      });
      return;
    }

    const totalRevenue = await prisma.order.aggregate({
      _sum: { total: true },
      where: { paid: true, createdAt: { gte: new Date(new Date().setDate(new Date().getDate() - daysToSubtract)) } }
    });

    const totalOrders = await prisma.order.count({
      where: { paid: true, createdAt: { gte: new Date(new Date().setDate(new Date().getDate() - daysToSubtract)) } }
    });

    const newCustomers = await prisma.user.count({
      where: { createdAt: { gte: new Date(new Date().setDate(new Date().getDate() - daysToSubtract)) } }
    });

    // Calculate sales growth: compare last month to the total
    const totalRevenue2 = await prisma.order.aggregate({
      _sum: { total: true },
      where: { paid: true, createdAt: { gte: new Date(new Date().setDate(new Date().getDate() - 30)) } }
    });
    // Calculate sales growth: compare last month to the total
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const lastMonthRevenue = await prisma.order.aggregate({
      _sum: { total: true },
      where: { paid:true, createdAt: { gte: oneMonthAgo } },
    });

    const salesGrowth = lastMonthRevenue._sum.total && totalRevenue2._sum.total ? (lastMonthRevenue._sum.total / totalRevenue2._sum.total) * 100 : 0;

    const salesOverview = {
      totalRevenue: totalRevenue._sum.total || 0,
      totalOrders,
      newCustomers,
      salesGrowth,
    };

    res.status(HttpStatusCodes.OK).json({
      salesOverview,
    });
  } catch (error) {
    next(error);
  }
};
const getGraphData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = req.query.period as string
    let groupByFormat: string

    switch (period.toLowerCase()) {
      case "daily":
        groupByFormat = "YYYY-MM-DD"
        break
      case "monthly":
        groupByFormat = "YYYY-MM"
        break
      case "yearly":
        groupByFormat = "YYYY"
        break
      default:
        groupByFormat = "YYYY-MM" // fallback
    }

    const orders = await prisma.order.findMany({
      where: {
        paid: true,
      },
    })

    const salesMap: { [key: string]: number } = {}

    for (const order of orders) {
      let date: string

      if (period.toLowerCase() === "weekly") {
        const d = dayjs(order.createdAt)
        const year = d.year()
        const week = d.week().toString().padStart(2, "0")
        date = `${year}-W${week}`
      } else {
        date = dayjs(order.createdAt).format(groupByFormat)
      }

      const total = order.total
      salesMap[date] = (salesMap[date] || 0) + total
    }

    let salesData = Object.entries(salesMap).map(([date, sales]) => ({
      name: date,
      sales: Math.round(sales as number),
    }))

    // sort by date — for weekly we need to parse correctly
    if (period.toLowerCase() === "weekly") {
      salesData.sort((a, b) =>
        dayjs(b.name, "YYYY-[W]WW").valueOf() - dayjs(a.name, "YYYY-[W]WW").valueOf()
      ).reverse()
    } else {
      salesData.sort((a, b) =>
        dayjs(a.name).valueOf() - dayjs(b.name).valueOf()
      )
    }

    res.status(HttpStatusCodes.OK).json(salesData)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to fetch sales data" })
  }
}

export default { getAllTimeMetrics, getSalesOverview, getGraphData };