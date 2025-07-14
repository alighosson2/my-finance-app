import { Request,Response } from 'express';
import { AuthenticationService } from '../services/AuthenticationService';
import { BadRequestException } from '../exceptions/BadRequestException';
import {UserService} from '../services/UserService'; 
export class AuthenticationController{
    constructor(private authService: AuthenticationService,
                 private userService:UserService
    ){}
    async login(req:Request,res:Response){
        const{email,password}=req.body;
        if(!email ||  !password) {
            throw new BadRequestException('Email and password are required',{
                email:!email,
                password:!password

            });
        }
       try{ //validate user
       const userId = await this.userService.validateUser(email,password);
        res.status(200).json({message:'Login successful',
            token:this.authService.generateToken(userId)
        });}
        catch(error)
        {throw new BadRequestException('invalid email or password');}
        
    }
    async logout(){
        
    }
}