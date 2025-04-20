import { z } from "zod";

export const updatecustomerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  mobile_no: z.string().min(1),
  image: z.string().min(1),
  email: z.string().email(),
 
});

export const addAddressSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  street: z.string().min(1, "Street address is required"),
  aptNumber: z.string().optional(),
  city: z.string().min(1, "City is required"),
  zipCode: z.string().regex(/^\d{6}$/, "Invalid pincode format (6 digits)"),
  state: z.string().min(1, "State is required"),
  country: z.string(),
  phoneNumber: z.string().regex(/^\d{10}$/, "Invalid mobile number format (10 digits)"),
  addressName: z.string().min(1, "Address name is required"),
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