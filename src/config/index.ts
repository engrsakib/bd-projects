import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export const envConfig = {
  app: {
    port: process.env.PORT ? Number(process.env.PORT) : 5005,
    env: process.env.NODE_ENV as "development" | "production",
  },
  clients: {
    admin_dev: process.env.ADMIN_CLIENT_URL_DEV as string,
    admin_prod: process.env.ADMIN_CLIENT_URL_PROD as string,
    public_dev: process.env.PUBLIC_CLIENT_URL_DEV as string,
    public_prod: process.env.PUBLIC_CLIENT_URL_PROD as string,
    server_base_url: process.env.SERVER_BASE_URL as string,
  },
  cors_origins: process.env.CORS_ORIGINS
    ? (process.env.CORS_ORIGINS as string).split(", ")
    : [],
  database: {
    mongodb_url: process.env.MONGODB_URL as string,
  },
  jwt: {
    access_token_expires: process.env.ACCESS_TOKEN_EXPIRES_IN as string,
    refresh_token_expires: process.env.REFRESH_TOKEN_EXPIRES_IN as string,
    secret: process.env.JWT_TOKEN_SECRET as string,
    access_cookie_name: "cbd_atkn_91f2a",
    refresh_cookie_name: "cbd_rtkn_7c4d1",
  },
  aws: {
    access_key_id: process.env.AWS_ACCESS_KEY_ID as string,
    secret_access_key: process.env.AWS_SECRET_ACCESS_KEY as string,
    region: process.env.AWS_REGION as string,
    bucket_name: process.env.AWS_BUCKET_NAME as string,
    file_load_base_url: process.env.AWS_FILE_LOAD_BASE_URL as string,
  },
  google: {
    app_user: process.env.APP_USER as string,
    app_pass: process.env.APP_PASSWORD as string,
  },
  bkash: {
    urls: {
      grant_token_url: process.env.BKASH_GRANT_TOKEN_URL as string,
      create_payment_url: process.env.BKASH_CREATE_PAYMENT_URL as string,
      execute_payment_url: process.env.BKASH_EXECUTE_PAYMENT_URL as string,
      refund_transaction_url: process.env
        .BKASH_REFUND_TRANSACTION_URL as string,
      callback_url: process.env.BKASH_CALLBACK_URL as string,
    },
    credentials: {
      username: process.env.BKASH_USERNAME as string,
      password: process.env.BKASH_PASSWORD as string,
      app_key: process.env.BKASH_APP_KEY as string,
      app_secret: process.env.BKASH_APP_SECRET as string,
    },
  },
  sms: {
    api_key: process.env.SMS_API_KEY as string,
    sender_id: process.env.SMS_SENDER_ID as string,
    base_url: process.env.SMS_BASE_URL as string,
  },
  courier: {
    api_key: process.env.COURIER_API_KEY as string,
    secret_key: process.env.COURIER_SECRET_KEY as string,
  },
};
