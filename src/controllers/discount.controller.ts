import { Request, Response, NextFunction } from 'express'
import { prisma } from '../utils/prismaclient.js'
import HttpStatusCodes from '../common/httpstatuscode.js'

const getAllDiscounts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentPage = parseInt(req.query.page as string) || 1
    const itemsPerPage = parseInt(req.query.limit as string) || 10

    const totalItems = await prisma.discount.count()
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    
    const discounts = await prisma.discount.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (currentPage - 1) * itemsPerPage,
      take: itemsPerPage,
    })

    res.status(HttpStatusCodes.OK).json({
      pagination: {
        totalPages,
        currentPage,
        totalItems,
        itemsPerPage
      },
      discounts
    })
  } catch (error) {
    next(error)
  }
}
const addDiscount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      code,
      type,
      value,
      minPurchase,
      usageLimit,
      startDate,
      endDate,
    } = req.body

    const existing = await prisma.discount.findUnique({ where: { code } })
    if (existing) {
        res.status(HttpStatusCodes.CONFLICT).json({ message: 'Discount code already exists' });
        return;
    }

    const discount = await prisma.discount.create({
      data: {
        code,
        type,
        value,
        minPurchase,
        usageLimit,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
      },
    })

    res.status(HttpStatusCodes.CREATED).json(discount)
  } catch (error) {
    next(error)
  }
}

const getDiscountById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id 
    const discount = await prisma.discount.findUnique({ where: { id } })

    if (!discount) {
        res.status(HttpStatusCodes.NOT_FOUND).json({ message: 'Discount not found' })
        return;
    }

    res.status(HttpStatusCodes.OK).json(discount)
  } catch (error) {
    next(error)
  }
}

const getDiscountByName = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const name = req.params.name
    const discount = await prisma.discount.findFirst({
      where: { code: { equals: name, mode: 'insensitive' } },
    })

    if (!discount) {
        res.status(HttpStatusCodes.NOT_FOUND).json({ message: 'Discount not found' });
        return;
    }

    res.status(HttpStatusCodes.OK).json(discount)
  } catch (error) {
    next(error)
  }
}

const updateDiscount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id
    const {
      code,
      type,
      value,
      minPurchase,
      usageLimit,
      startDate,
      endDate,
      status,
    } = req.body

    const updated = await prisma.discount.update({
      where: { id },
      data: {
        code,
        type,
        value,
        minPurchase,
        usageLimit,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : null,
        status,
      },
    })

    res.status(HttpStatusCodes.OK).json(updated)
  } catch (error) {
    next(error)
  }
}

const deleteDiscount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id
    await prisma.discount.delete({ where: { id } })
    res.status(HttpStatusCodes.NO_CONTENT).send()
  } catch (error) {
    next(error)
  }
}

export default {
  getAllDiscounts,
  addDiscount,
  getDiscountById,
  getDiscountByName,
  updateDiscount,
  deleteDiscount,
}
