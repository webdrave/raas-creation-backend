import morgan from 'morgan';

import helmet from 'helmet';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';


import 'express-async-errors';

// import BaseRouter from '@src/routes';


import ENV from './common/env.js';
import HttpStatusCodes from './common/httpstatuscode.js';
import { RouteError } from './common/routeerror.js';
import { NodeEnvs } from './common/constants.js';


import ProductRouter from './routes/product.router.js';
import categoryRouter from './routes/catagory.router.js';
import uploadRouter from './routes/upload.route.js';
import productPerformanceRouter from './routes/productperformance.routes.js';
/******************************************************************************
                                Setup
******************************************************************************/

const app = express();


// **** Middleware **** //
const corsOptions = {
  origin: process.env.FRONTENDURL || 'http://localhost:3000',
  credentials: true,     
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.set("trust proxy", true);

app.use(cors(corsOptions));
// Basic middleware
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Show routes called in console during development
if (ENV.NODE_ENV === NodeEnvs.Dev) {
  app.use(morgan('dev'));
}

// Security
if (ENV.NODE_ENV === NodeEnvs.Production) {
  app.use(helmet());
}

console.log("NODE_ENV", process.env.api_key);

// Add APIs, must be after middleware
// app.use(Paths.Base, BaseRouter);

// Add error handler
app.use((err: Error, _: Request, res: Response, next: NextFunction) => {
  if (ENV.NODE_ENV !== NodeEnvs.Test.valueOf()) {
    console.log(err, true);
  }
  let status = HttpStatusCodes.INTERNAL_SERVER_ERROR;
  if (err instanceof RouteError) {
    status = err.status;
    res.status(status).json({ error: err.message });
  }
  return next(err);
});


app.use("/api/products",ProductRouter)
app.use("/api/category", categoryRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/productperformance", productPerformanceRouter);

// **** FrontEnd Content **** //

// Set views directory (html)

// Redirect to login if not logged in.


/******************************************************************************
                                Export default
******************************************************************************/

export default app;
