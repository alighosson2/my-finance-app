"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const AuthenticationService_1 = require("../services/AuthenticationService");
const AuthenticationExceptions_1 = require("../exceptions/AuthenticationExceptions");
//to do a singelton to the authentication service
const authservice = new AuthenticationService_1.AuthenticationService();
function authenticate(req, res, next) {
    console.log("Authenticate Middleware Triggered  ");
    console.log(req.cookies);
    /*const authorization_header = req.headers.authorization;
    if(!authorization_header) {
        throw new AunthenticationFailedException();
    }

    //get token from headers
    const token= authorization_header.split(' ')[1];*/
    let token = req.cookies.token;
    const refreshToken = req.cookies.refreshToken;
    if (!token) {
        if (!refreshToken) {
            throw new AuthenticationExceptions_1.AunthenticationFailedException();
        }
        const newToken = authservice.refreshToken(refreshToken);
        authservice.setTokenIntoCookie(res, newToken);
        token = newToken;
    }
    const payload = authservice.verify(token);
    req.user_id = payload.userId;
    next();
} // اقعد مؤدب شوي
//# sourceMappingURL=auth.js.map