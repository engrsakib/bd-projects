import cors from "cors";
import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import router from "./routes";
import morgan from "morgan";
import "./events/index";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { corsOptions } from "./config/corsOptions";

dotenv.config();

const app = express();

// middlewares
app.use(cors(corsOptions));
app.use(cookieParser());
// app.use(
//   "/webhooks/steadfast",
//   cors({ origin: "*" }),
//   express.raw(),
//   // eslint-disable-next-line @typescript-eslint/no-unused-vars
//   (req, res, next) => {
//     res.status(200).json({ success: true, message: "Webhook received!" });
//   }
// );

app.use(
  "/api/v1/webhooks/steadfast",
  express.json({ type: "application/json" })
);

app.use(helmet());
// Allow 100MB to be uploaded
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use(morgan("dev"));

// health check
app.get("/", async (req, res) => {
  res.status(200).json({
    statusCode: 200,
    success: true,
    message: "Cloudy BD application is running...",
    data: null,
  });
});

// applications routes
app.use("/api/v1", router);

// global error handler
app.use(globalErrorHandler.globalErrorHandler);

// app route not found
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`User hit: '${req.originalUrl}' is not exist`);
  res.status(404).json({
    statusCode: 404,
    success: false,
    message: "Not Found",
    errorMessages: [
      {
        path: req.originalUrl,
        message: "API Not Found",
      },
    ],
  });
  next();
});

export default app;
