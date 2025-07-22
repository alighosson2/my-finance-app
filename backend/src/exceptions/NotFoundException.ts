import { HttpException } from "./HttpException";

export class NotFoundException extends HttpException{
    constructor(message:string="Resource not found",details?:Record<string,unknown>){
        super(404,message,details);
        this.name="NotFoundException";
}
}