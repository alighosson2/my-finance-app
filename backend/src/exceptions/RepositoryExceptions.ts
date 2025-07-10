export class ItemNotFoundException extends Error { constructor(message:string){
        super(message);
        this.name="ItemNotFoundException";
}
}
export class InvalidItemException extends Error { constructor(message:string){
        super(message);
        this.name="InvalidItemException ";
}
}


export class initializableException extends Error { constructor(message:string){
        super(message);
        this.name="initializableException";
}
}