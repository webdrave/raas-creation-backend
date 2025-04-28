import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prismaclient.js";
import HttpStatusCodes from "../common/httpstatuscode.js";

const createreview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { title, description, rating,image } = req.body;
        const productIdFromParams = req.params.productId;  
        console.log("productIdFromParams", productIdFromParams);

        console.log(title, description, rating);

        // Validate required fields
        if (!title || !description || !rating || !productIdFromParams) {
            res.status(HttpStatusCodes.BAD_REQUEST).json({ message: "Missing required fields" });
            return;
        }

        // Ensure rating is a valid number (1-5)
        if (typeof rating !== "number" || rating < 1 || rating > 5) {
            res.status(HttpStatusCodes.BAD_REQUEST).json({ message: "Rating must be a number between 1 and 5" });
            return;
        }

        // Create review
        const productrating = await prisma.productRating.create({
            data: {
                title,
                description,
                image: req.user.image,
                rating,
                productId: productIdFromParams,
                userId: req.user.id 
            }
        });

        res.status(HttpStatusCodes.CREATED).json({
            message: "Testimonial created successfully",
            productrating
        });

    } catch (error) {
        console.error("Error creating testimonial:", error);
        res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "Internal Server Error",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

const getReviewsByProductId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const productId = req.query.productId as string;  

        if (!productId) {
            res.status(400).json({ message: "Product ID is required" });
            return;
        }

        const reviews = await prisma.productRating.findMany({
            where: { productId: productId },  
            orderBy: { createdAt: "desc" }
        });
        
        res.status(200).json({ reviews });

    } catch (error) {
        console.error("Error getting reviews:", error);
        res.status(500).json({ message: "Internal Server Error", error: error instanceof Error ? error.message : "Unknown error" });
    }
};

const updateReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { reviewId:id } = req.params;
        const review = req.body;

        const userId = req.user.id;
        
        if(!userId) {
            res.status(403).json({ message: "You are not authorized to update this review" });
            return;
        }

        const reviewToUpdate = await prisma.productRating.findUnique({
            where: { id }
        });

        if(!reviewToUpdate) {
            res.status(404).json({ message: "Review not found" });
            return;
        }

        if(reviewToUpdate.userId !== userId) {
            res.status(403).json({ message: "You are not authorized to update this review" });
            return;
        }

        const updatedReview = await prisma.productRating.update({
            where: { id },
            data: review
        });

        res.status(200).json(updatedReview);
    } catch (error) {
        console.error("Error updating review:", error);
        res.status(500).json({ message: "Internal Server Error", error: error instanceof Error ? error.message : "Unknown error" });
    }
};

const deleteReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { reviewId:id } = req.params;

        const userId = req.user.id;
        
        if(!userId) {
            res.status(403).json({ message: "You are not authorized to update this review" });
            return;
        }

        // Check if the user is the owner of the review
        const reviewToUpdate = await prisma.productRating.findUnique({
            where: { id }
        });

        if(!reviewToUpdate) {
            res.status(404).json({ message: "Review not found" });
            return;
        }

        if(reviewToUpdate.userId !== userId) {
            res.status(403).json({ message: "You are not authorized to update this review" });
            return;
        }

        await prisma.productRating.delete({
            where: { id }
        });

        res.status(204).send();
    } catch (error) {
        console.error("Error deleting review:", error);
        res.status(500).json({ message: "Internal Server Error", error: error instanceof Error ? error.message : "Unknown error" });
    }
};

export default {
    createreview,
    getReviewsByProductId,
    updateReview,
    deleteReview
};