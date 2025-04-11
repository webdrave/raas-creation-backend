import { Request, Response, NextFunction } from 'express';
import HttpStatusCodes from './httpstatuscode.js';




// Mapping for Prisma error codes
export const exceptionCodes: Record<string, number> = {
  P2000: HttpStatusCodes.OK,
  P2001: HttpStatusCodes.NOT_FOUND,
  P2002: HttpStatusCodes.CONFLICT,
  P2003: HttpStatusCodes.CONFLICT,
  P2004: HttpStatusCodes.CONFLICT,
  P2005: HttpStatusCodes.CONFLICT,
  P2006: HttpStatusCodes.CONFLICT,
  P2007: HttpStatusCodes.FORBIDDEN,
  P2008: HttpStatusCodes.CONFLICT,
  P2010: HttpStatusCodes.BAD_REQUEST,
  P2011: HttpStatusCodes.BAD_REQUEST,
  P2012: HttpStatusCodes.BAD_REQUEST,
  P2013: HttpStatusCodes.BAD_REQUEST,
  P2014: HttpStatusCodes.BAD_REQUEST,
  P2015: HttpStatusCodes.NOT_FOUND,
  P2016: HttpStatusCodes.BAD_REQUEST,
  P2017: HttpStatusCodes.NO_CONTENT,
  P2018: HttpStatusCodes.NOT_FOUND,
  P2019: HttpStatusCodes.BAD_REQUEST,
  P2020: HttpStatusCodes.BAD_REQUEST,
  P2021: HttpStatusCodes.NOT_ACCEPTABLE,
  P2022: HttpStatusCodes.NOT_ACCEPTABLE,
  P2023: HttpStatusCodes.NOT_ACCEPTABLE,
  P2024: HttpStatusCodes.REQUEST_TIMEOUT,
  P2025: HttpStatusCodes.FAILED_DEPENDENCY,
  P2026: HttpStatusCodes.NOT_ACCEPTABLE,
  P2027: HttpStatusCodes.BAD_REQUEST,
  P2028: HttpStatusCodes.NOT_MODIFIED,
  P2030: HttpStatusCodes.BAD_REQUEST,
  P2031: HttpStatusCodes.BAD_REQUEST,
  P2033: HttpStatusCodes.BAD_REQUEST,
  P2034: HttpStatusCodes.CONFLICT,
};