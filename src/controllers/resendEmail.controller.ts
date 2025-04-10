import { Request, Response } from 'express';
import { Resend } from 'resend';
import ENV from '../common/env.js';
import { ValidationErr } from '../common/routeerror.js';
import { prisma } from '../utils/prismaclient.js';

const resend = new Resend(ENV.RESEND_API_KEY);

// Utility function to generate email HTML content
const generateEmailContent = (name: string, email: string, phone: string, message: string): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
      <div style="background: #007bff; color: #fff; padding: 15px; text-align: center; font-size: 20px;">
        📬 New Form Submission Received ✅
      </div>
      <div style="padding: 20px;">
        <p><strong>👤 Name:</strong> ${name}</p>
        <p><strong>📧 Email:</strong> ${email}</p>
        <p><strong>📞 Phone:</strong> ${phone}</p>
        <p><strong>💬 Message:</strong></p>
        <p style="background: #f1f1f1; padding: 10px; border-radius: 4px;">${message}</p>
      </div>
      <div style="background: #007bff; color: #fff; text-align: center; padding: 10px; font-size: 14px;">
        © 2025 My Company - All Rights Reserved
      </div>
    </div>
  `;
};

const sendEmail = async (req: Request, res: Response): Promise<void> => {
  const { name, email, phone, message } = req.body;

  // Validate required fields
  if (!name || !email || !phone || !message) {
    throw new ValidationErr('Missing required fields');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationErr('Invalid email format');
  }

  // Validate phone format (basic example)
  const phoneRegex = /^\d{10}$/; // Assumes 10-digit phone number
  if (!phoneRegex.test(phone)) {
    throw new ValidationErr('Invalid phone number');
  }

  const emailContent = generateEmailContent(name, email, phone, message);

  try {
    // Send email using Resend
    const response = await resend.emails.send({
      from: ENV.RESEND_EMAIL,
      to: email,
      subject: 'New Form Submission Received ✅',
      html: emailContent,
    });

    if (response.data) {
      // Save contact form submission to database
      await prisma.contactForm.create({
        data: {
          name,
          email,
          phone: String(phone),
          message,
          Status: 'Pending',
        },
      });

      res.status(200).json({ message: 'Email sent successfully' });
    } else {
      console.error('Failed to send email:', response.error);
      res.status(500).json({ message: 'Failed to send email' });
    }
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const allEmails = async (req: Request, res: Response): Promise<void> => {
  try {
    const emails = await prisma.contactForm.findMany();
    res.status(200).json(emails);
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ message: 'Failed to fetch emails' });
  }
};

const deleteEmail = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    await prisma.contactForm.delete({ where: { id: id.toString() } });
    res.status(200).json({ message: 'Email deleted successfully' });
  } catch (error) {
    console.error('Error deleting email:', error);
    res.status(500).json({ message: 'Failed to delete email' });
  }
};

const updateStatussendMail = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { Status, message } = req.body;

  // Validate status
  const validStatuses = ["Pending", "Responded", "Closed"];
  if (!validStatuses.includes(Status)) {
     res.status(400).json({ message: "Invalid status value" });
  }

  try {
    // Fetch contact details to get name, email, and phone
    const contact = await prisma.contactForm.findUnique({
      where: { id: String(id) },
    });

    if (!contact) {
       res.status(404).json({ message: "Contact not found" });
    }

    // Generate email content
    if (!contact) {
      res.status(404).json({ message: "Contact not found" });
      return;
    }
    const emailContent = generateEmailContent(contact.name, contact.email, contact.phone, message);

    // Send email using Resend
    const response = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: contact.email,
      subject: 'Response to Your Inquiry ✅',
      html: emailContent,
    });

    if (!response.data) {
      console.error('Failed to send email:', response.error);
       res.status(500).json({ message: 'Failed to send email' });
    }

    // Update status in the database
    const updatedContact = await prisma.contactForm.update({
      where: { id: String(id) },
      data: { Status: Status },
    });

    res.status(200).json({ message: "Email sent and status updated successfully", updatedContact });
  } catch (error) {
    console.error("Error updating status and sending email:", error);
    res.status(500).json({ message: "Failed to update status and send email" });
  }
};


export default { sendEmail, allEmails, deleteEmail, updateStatussendMail };