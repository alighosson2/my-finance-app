import config from './config';
import express, { Request, Response, NextFunction } from 'express';
import logger from './util/logger';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
// import cookieParser from 'cookie-parser';

import routes from './routes';
import requestLogger from './middleware/requestLogger';
import { HttpException } from './exceptions/HttpException';

// ✅ Import the user routes
import userRoutes from './routes/user.routes';

const app = express();

// Security
app.use(helmet());

// Body parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// CORS
app.use(cors({ credentials: true, origin: true }));

// Add middleware
app.use(requestLogger);

// ✅ Mount API routes
app.use('/api/users', userRoutes);

// Cookie support (optional)
// app.use(cookieParser());

// Static frontend
app.use(express.static(config.frontendPath));

// Public pages
app.get('/login', (req, res) =>
  res.sendFile(path.join(config.frontendPath, 'login.html'))
);
app.get('/signup', (req, res) =>
  res.sendFile(path.join(config.frontendPath, 'signup.html'))
);


// Error handler
app.use(
  (err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof HttpException) {
      const httpException = err as HttpException;
      logger.error(
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
      logger.error("Unhandled Error: %s", err.message);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

// Start server
app.listen(config.port, config.host, () => {
  logger.info(`🚀 Server is running on http://%s:%d`, config.host, config.port);
});

export default app;