//src/index.ts
import config from './config';
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { HttpException } from './exceptions/HttpException';

// ✅ Import the user routes
import userRoutes from './routes/user.routes';
import authRoutes from './routes/auth.routes';
import bankOAuth from './routes/bankOAuth.routes';
import bankRoutes from './routes/bank.routes';
import accountRoutes from './routes/financialAccount.routes';
import transactionRoutes from './routes/transaction.routes';
import taxRoutes from './routes/tax.routes';
import budgetRoutes from './routes/budget.routes';
import adminRoutes from './routes/admin.routes';


const app = express();

// Security
app.use(helmet());

// Body parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// CORS
// index.ts
app.use(cors({
  origin: true, // <-- allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));
// Add middleware
app.use((req, res, next) => {
  res.on("finish", () => {
    const status = res.statusCode;
    const { method, originalUrl } = req;
    let level = "info";
    if (status >= 500) {
      level = "error";
    } else if (status >= 400) {
      level = "warn";
    }
    const msg = `${method} ${status} ${originalUrl}`;
    if (level === "error") console.error(msg);
    else if (level === "warn") console.warn(msg);
    else console.info(msg);
  });
  next();
});

app.use(cookieParser());

// ✅ Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bank', bankOAuth);       // OAuth routes at /bank (matches OBP registration)
app.use('/api/bank/api', bankRoutes);  // Bank API routes at /bank/api
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/tax', taxRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/admin', adminRoutes);    // <-- Add this line

// Static frontend
app.use(express.static(config.static_files_path));

// Error handler
app.use(
  (err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof HttpException) {
      const httpException = err as HttpException;
      console.error(
        "%s [%d] \"%s\" %o",
        httpException.name,
        httpException.status,
        httpException.message,
        httpException.details || {}
      );
      res.status(httpException.status).json({
        message: httpException.message,
        details: httpException.details || undefined,
      });
    } else {
      console.error("Unhandled Error: %s", err.message);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

// Start server
app.listen(config.port, config.host, () => {
  console.log(`🚀 Server is running on http://%s:%d`, config.host, config.port);
});
