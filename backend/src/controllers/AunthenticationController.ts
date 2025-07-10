import { Request,Response } from 'express';
import { AuthenticationService } from '../services/AuthenticationService';
import { BadRequestException } from '../exceptions/BadRequestException';

export class AuthenticationController{
    constructor(private authService: AuthenticationService){}
    login(req:Request,res:Response){
        const{email,password}=req.body;
        if(!email ||!password) {
            throw new BadRequestException('Email and password are required',{
                email:!email,
                password:!password

            });
        }
    }
}