import { Request, Response, NextFunction } from "express";
import HttpStatusCodes from "../common/httpstatuscode.js";
import { RouteError } from "../common/routeerror.js";
import ENV from "../common/env.js";
import { NodeEnvs } from "../common/constants.js";
import { exceptionCodes } from "../common/prismafilter.js";
import { decode } from "next-auth/jwt";
import { prisma } from "../utils/prismaclient.js";
import axios from "axios";
import util from "util";


const cleanMessage = (message: string) => message.replace(/(\r\n|\r|\n)/g, " ");
export const globalErrorHandler = (
  err: Error & { code?: string; meta?: any },
  req: Request,
  res: Response,
  next: NextFunction
): any => {
  // Log the error unless in test environment
  if (ENV.NODE_ENV !== NodeEnvs.Test.valueOf()) {
    console.error(err);
  }

  // Handle Prisma Known Request Error
  if (err instanceof (prisma as any).$extends.ErrorConstructor.PrismaClientKnownRequestError) {
    const statusCode = err.code ? exceptionCodes[err.code] : HttpStatusCodes.BAD_REQUEST;
    const message =
      ENV.NODE_ENV === "production" ? err.meta : cleanMessage(err.message);
    return res.status(statusCode).json({
      success: false,
      statusCode,
      path: req.url,
      message,
    });
  }

  // Handle Prisma Unknown Request Error
  if (err instanceof (prisma as any).$extends.ErrorConstructor.PrismaClientUnknownRequestError) {
    return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      path: req.url,
      message: "Something went wrong",
    });
  }

  // Handle Prisma Validation Error
  if (err instanceof (prisma as any).$extends.ErrorConstructor.PrismaClientValidationError) {
    const indexOfArgument = err.message.indexOf("Argument");
    const message = cleanMessage(err.message.substring(indexOfArgument));
    return res.status(HttpStatusCodes.BAD_REQUEST).json({
      success: false,
      statusCode: HttpStatusCodes.BAD_REQUEST,
      path: req.url,
      message,
    });
  }

  // Handle custom RouteError
  if (err instanceof RouteError) {

    return res.status(err.status).json({ success: false, error: err.message });
  }
  if (axios.isAxiosError(err)) {
    console.log(JSON.stringify(err,null, 2));
    if (err.response) {
      // The request was made, and the server responded with a status code
      return res.status(err.response.status).json({
        success: false,
        statusCode: err.response.status,
        path: req.url,
        message: err.response.data?.message || "Axios error response",
      });
    } else if (err.request) {
      // The request was made but no response was received
      return res.status(HttpStatusCodes.GATEWAY_TIMEOUT).json({
        success: false,
        statusCode: HttpStatusCodes.GATEWAY_TIMEOUT,
        path: req.url,
        message: "No response from server",
      });
    } else {
      // Something happened in setting up the request
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        success: false,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        path: req.url,
        message: err.message || "Axios request setup error",
      });
    }
  }
  // Fallback for all other errors
  return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
    path: req.url,
    message: err.message || "Internal Server Error",
  });
};
declare global {
  namespace Express {
    interface Request {
      user: any; // Add a `session` property to the Request interface
    }
  }
}

export const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {

  try {
   
    let red_flag = false;

    let sessionToken =
    (req.headers.authorization ? req.headers.authorization.split(' ')[1] : undefined);

    if (!sessionToken) {
      sessionToken = req.cookies["__Secure-authjs.session-token"];
    }
    if (!sessionToken) {
      sessionToken = req.cookies["__Secure-next-auth.session-token"];
      red_flag = true;
    }

    if (!sessionToken) {
      throw new RouteError(403, "Unauthorized: No token found");
    }
    
    const decodedToken = await decode({
      token: sessionToken,
      secret: ENV.AUTH_SECRET,
      salt:
      ENV.NODE_ENV === "production"
        ? red_flag ? "__Secure-next-auth.session-token" : "__Secure-authjs.session-token"
        : "authjs.session-token",

    });

    if (!decodedToken) {
      throw new RouteError(403, "Unauthorized: Invalid token");
    }
    if (!decodedToken?.id) {
      throw new Error("Invalid or missing user ID in token");
    }

    const user = await prisma.user.findUnique({
      where: { id: decodedToken.id as string },
    });

    if (!user) {
      throw new RouteError(403, "Unauthorized: User not found");
    }

    req.user = user;

    next();
  } catch (error) {
    console.error("Failed to authenticate", error);
    throw new RouteError(403, "Unauthorized: Invalid token");
  }
};


export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user.role === "USER") {
    throw new RouteError(HttpStatusCodes.UNAUTHORIZED, "Unauthorized");
  }
  next();
};
