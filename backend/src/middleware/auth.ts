import { AuthRequest } from "../config/types";
import{NextFunction,Request,Response}from "express";
import { AuthenticationService } from "../services/AuthenticationService";
import { AunthenticationFailedException } from "../exceptions/AuthenticationExceptions";
import { auth } from "firebase-admin";
//to do a singelton to the authentication service
const authservice=new AuthenticationService();
export  function authenticate (req: Request, res: Response, next: NextFunction) {
    console.log("Authenticate Middleware Triggered  ");
    console.log(req.cookies);
    /*const authorization_header = req.headers.authorization;
    if(!authorization_header) {
        throw new AunthenticationFailedException();
    }

    //get token from headers
    const token= authorization_header.split(' ')[1];*/
    let token=req.cookies.token
    const refreshToken=req.cookies.refreshToken
    if(!token){
        if(!refreshToken){throw new AunthenticationFailedException();
            }
        const newToken=authservice.refreshToken(refreshToken);
        authservice.setTokenIntoCookie(res,newToken);
        token=newToken
    }

    const payload=authservice.verify(token);
    (req as AuthRequest).user_id = payload.userId;
    next();
}