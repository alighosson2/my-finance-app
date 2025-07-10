import winston  from "winston";
import config from "../config";


const{logDir,isDev}=config
const logFileFormat=winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
    winston.format.splat(),
     winston.format.errors({stack:true}),
)
const logConsoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),

  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `[${timestamp}] ${level}: ${message} ${stack || ""}`;
  })
);

const logger = winston.createLogger({
    level: "info",
    transports: [
        
        new winston.transports.File({ filename: "error.log",dirname:logDir, level: "error",format:logFileFormat }),
        new winston.transports.File({ filename: "all.log",dirname:logDir })
    ],
    exceptionHandlers:[
        new winston.transports.File({ filename:"exceptions.logs",dirname:logDir})
    ]
});
if(isDev){
  
  logger.add(new winston.transports.Console({format: logConsoleFormat}));
  logger.level="debug"


}
export default logger;



