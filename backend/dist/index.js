"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//src/index.ts
const config_1 = __importDefault(require("./config"));
const express_1 = __importDefault(require("express"));
const logger_1 = __importDefault(require("./util/logger"));
const helmet_1 = __importDefault(require("helmet"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const requestLogger_1 = __importDefault(require("./middleware/requestLogger"));
const HttpException_1 = require("./exceptions/HttpException");
// ✅ Import the user routes
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const bankOAuth_routes_1 = __importDefault(require("./routes/bankOAuth.routes"));
const bank_routes_1 = __importDefault(require("./routes/bank.routes"));
const financialAccount_routes_1 = __importDefault(require("./routes/financialAccount.routes"));
const transaction_routes_1 = __importDefault(require("./routes/transaction.routes"));
const app = (0, express_1.default)();
// Security
app.use((0, helmet_1.default)());
// Body parsing
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
// CORS
app.use((0, cors_1.default)({ credentials: true, origin: true }));
// Add middleware
app.use(requestLogger_1.default);
app.use((0, cookie_parser_1.default)());
// ✅ Mount API routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/bank', bankOAuth_routes_1.default); // OAuth routes at /bank (matches OBP registration)
app.use('/api/bank/api', bank_routes_1.default); // Bank API routes at /bank/api
app.use('/api/accounts', financialAccount_routes_1.default);
app.use('/api/transactions', transaction_routes_1.default);
// Static frontend
app.use(express_1.default.static(config_1.default.frontendPath));
/*// Public pages
app.get('/login', (req, res) =>
  res.sendFile(path.join(config.frontendPath, 'login.html'))
);
app.get('/signup', (req, res) =>
  res.sendFile(path.join(config.frontendPath, 'signup.html'))
);
*/
// Error handler
app.use((err, req, res, next) => {
    if (err instanceof HttpException_1.HttpException) {
        const httpException = err;
        logger_1.default.error("%s [%d] \"%s\" %o", httpException.name, httpException.status, httpException.message, httpException.details || {});
        res.status(httpException.status).json({
            message: httpException.message,
            details: httpException.details || undefined,
        });
    }
    else {
        logger_1.default.error("Unhandled Error: %s", err.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
// Start server
app.listen(config_1.default.port, config_1.default.host, () => {
    logger_1.default.info(`🚀 Server is running on http://%s:%d`, config_1.default.host, config_1.default.port);
});
exports.default = app;
//# sourceMappingURL=index.js.map