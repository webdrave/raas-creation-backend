import { Router } from 'express';
import sendEmailController from '../controllers/resendEmail.controller.js';

const router = Router();
router.post('/', sendEmailController.sendEmail);
router.get('/', sendEmailController.allEmails);
router.delete('/:id', sendEmailController.deleteEmail);
router.put('/:id', sendEmailController.updateStatussendMail);
export default router;
