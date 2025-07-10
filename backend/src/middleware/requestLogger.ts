import { Request, Response, NextFunction } from "express";
import logger from "../util/logger";

const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  res.on("finish", () => {
    const status = res.statusCode;
    const { method, originalUrl } = req;

    let level = "info";
    if (status >= 500) {
      level = "error";
    } else if (status >= 400) {
      level = "warn";
    }

    logger.log({ level, message: `${method} ${status} ${originalUrl}`,});
  });

  next();
};

export default requestLogger;
