import express from 'express';
import { AuthenticationService } from '../services/AuthenticationService';


const router =express.Router();
const authservice=new AuthenticationService();
router.route('/login')
     .post();
router.route('logout')
     .get()

export default router;