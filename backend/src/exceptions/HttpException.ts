

export class HttpException extends Error{
    constructor(
        public readonly status:number,
        public readonly message:string,
        public readonly details?: Record<string,unknown>,
    ){super(message);
        this.name="HttpException"
       // const x=details && typeof details['count']==='number' && details['count']+2;
    }
}