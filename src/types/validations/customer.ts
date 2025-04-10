import { z } from "zod";

export const updatecustomerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  mobile_no: z.string().min(1),
  image: z.string().min(1),
  email: z.string().email(),
 
});

export const addAddressSchema = z.object({
  name: z.string().min(2, { message: "Full name is required" }),
  phone: z.string().min(10, { message: "Valid phone number is required" }),
  street: z.string().min(3, { message: "Street address is required" }),
  city: z.string().min(2, { message: "City is required" }),
  state: z.string().min(2, { message: "State is required" }),
  country: z.string().min(2, { message: "Country is required" }),
  zipCode: z.string().min(5, { message: "Valid zip code is required" }),
});

const OtpTypeEnum = z.enum(["verify", "forgetpassword"]);

// Define the schema for the OTP object
export const getOtpSchema = z.object({ // Ensures 'mobileNumber' is a non-empty string
  otp: z.string().min(1), // Ensures 'otp' is a non-empty string
  jwt:z.string().min(1),      // Ensures 'type' is either 'verifyemail' or 'forgetpassword'
});
export const makeotpSchema = z.object({
  mobile_no: z.string().min(1), // Ensures 'otp' is a non-empty string
  type: OtpTypeEnum,      // Ensures 'type' is either 'verifyemail' or 'forgetpassword'
});


export const forgetpasswordSchema = z.object({
  password: z.string().min(1), 
   token : z.string().min(1),
});