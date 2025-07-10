import { NextFunction,Request,Response } from "express";

export const asyncHandler=(fn:(req:Request,res:Response)=>Promise<void>)=>{
    return (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);
}