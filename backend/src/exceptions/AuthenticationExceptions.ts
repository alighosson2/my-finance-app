import { HttpException } from "./HttpException";


export class AuthenticationExceptions extends HttpException{
    constructor(message:string){
        super(401,message);
        this.name="AuthenticationException"
    }
}
export class TOkenEXpiredExpection extends AuthenticationExceptions{
    constructor(){
        super("TokenExpired");
        this.name="TokenExpiredException"
    }
}
export class InvalidTokenException extends AuthenticationExceptions{
    constructor(){
        super("InvalidToken");
        this.name="InvalidTokenException"
    } }
export class AunthenticationFailedException extends AuthenticationExceptions{
    constructor(){
        super("AunthenticationFailed");
        this.name="AunthenticationFailedException"
    }
}