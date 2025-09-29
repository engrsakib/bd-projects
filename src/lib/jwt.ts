import { NextFunction, Request, Response } from "express";
import jwt, { TokenExpiredError } from "jsonwebtoken";
import { envConfig } from "../config";
import { IJWtPayload } from "@/interfaces/common.interface";
import ApiError from "@/middlewares/error";
import { HttpStatusCode } from "./httpStatus";
import { cookieManager } from "@/shared/cookie";
import { IRoles } from "@/constants/roles";
import { AdminModel } from "@/modules/admin/admin.model";

class JWT {
  private signToken = async (
    payload: IJWtPayload,
    secret: string,
    expiresIn: string
  ): Promise<string> => {
    return jwt.sign(payload, secret, { expiresIn } as any);
  };

  private generateAccessToken = async (
    payload: IJWtPayload
  ): Promise<string> => {
    return this.signToken(
      payload,
      envConfig.jwt.secret,
      envConfig.jwt.access_token_expires
    );
  };

  private generateRefreshToken = async (
    payload: IJWtPayload
  ): Promise<string> => {
    return this.signToken(
      payload,
      envConfig.jwt.secret,
      envConfig.jwt.refresh_token_expires
    );
  };

  async generateTokens(
    payload: IJWtPayload
  ): Promise<{ access_token: string; refresh_token: string }> {
    const access_token = await this.generateAccessToken(payload);
    const refresh_token = await this.generateRefreshToken(payload);
    return { access_token, refresh_token };
  }

  public authenticate(allowedRoles?: IRoles[]) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const { access_token, refresh_token } = this.extractTokens(req, "header");

      if (!access_token && !refresh_token) {
        return next(
          new ApiError(
            HttpStatusCode.UNAUTHORIZED,
            "Unauthenticated access. Please login to access resource(s)"
          )
        );
      }

      try {
        if (!access_token) {
          return next(
            new ApiError(
              HttpStatusCode.UNAUTHORIZED,
              "Unauthenticated access. Please login to access resource(s)"
            )
          );
        }
        const payload = jwt.verify(
          access_token,
          envConfig.jwt.secret
        ) as unknown as IJWtPayload;

        if (!payload.id) {
          return next(
            new ApiError(
              HttpStatusCode.UNAUTHORIZED,
              "Invalid authentication token"
            )
          );
        }

        if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
          if (!allowedRoles.includes(payload.role as IRoles)) {
            next(
              new ApiError(HttpStatusCode.FORBIDDEN, "Forbidden: Access denied")
            );
          }
        }
        req.user = payload;
        next();
      } catch (error: any) {
        if (error instanceof TokenExpiredError) {
          if (!refresh_token) {
            return next(
              new ApiError(
                HttpStatusCode.UNAUTHORIZED,
                "Unauthenticated access. Please login to access resource(s)"
              )
            );
          }
          return this.handleExpiredAccessToken(refresh_token, res, next);
        }

        if (error?.statusCode === HttpStatusCode.FORBIDDEN) {
          return next(
            new ApiError(HttpStatusCode.FORBIDDEN, "Forbidden: Access denied")
          );
        }
        return next(
          new ApiError(HttpStatusCode.UNAUTHORIZED, "Authentication failed")
        );
      }
    };
  }

  public hasPermissions(requiredPermission: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const adminId = req.user?.id;
        if (!adminId) {
          return next(
            new ApiError(
              HttpStatusCode.UNAUTHORIZED,
              "Unauthorized: No user found"
            )
          );
        }

        const admin = await AdminModel.findById(adminId)
          .select("_id")
          .populate({ path: "permissions", select: "key" })
          .lean();

        const keys =
          admin &&
          admin.permissions &&
          typeof admin.permissions === "object" &&
          "key" in admin.permissions
            ? (admin.permissions as { key: string[] }).key
            : [];

        if (!keys.includes(requiredPermission)) {
          return next(
            new ApiError(
              HttpStatusCode.FORBIDDEN,
              "Forbidden: Permission denied"
            )
          );
        }

        next();
      } catch (err) {
        return next(
          new ApiError(
            HttpStatusCode.INTERNAL_SERVER_ERROR,
            "Internal server error"
          )
        );
      }
    };
  }

  private extractTokens(
    req: Request,
    sourceType: "cookie" | "header"
  ): {
    access_token: string | undefined;
    refresh_token: string | undefined;
  } {
    let access_token = undefined;
    let refresh_token = undefined;

    if (sourceType === "cookie") {
      access_token = req.cookies[envConfig.jwt.access_cookie_name] || undefined;
      refresh_token =
        req.cookies[envConfig.jwt.refresh_cookie_name] || undefined;
    } else if (sourceType === "header") {
      access_token = req.headers["authorization"] || undefined;
      refresh_token = req.headers["x-refresh-token"] || undefined;
    }

    // console.log({ sourceType, access_token, refresh_token });

    return { access_token, refresh_token };
  }

  private handleExpiredAccessToken = async (
    refresh_token: string,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = jwt.verify(
        refresh_token,
        envConfig.jwt.secret
      ) as IJWtPayload;

      const payload: IJWtPayload = {
        id: result.id,
        phone_number: result?.phone_number,
        role: result?.role,
      };
      const { access_token, refresh_token: new_refresh_token } =
        await this.generateTokens(payload);
      cookieManager.setTokens(res, access_token, new_refresh_token);

      next();
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        return this.logoutUser(res);
      }
      throw new ApiError(HttpStatusCode.UNAUTHORIZED, "Unauthenticated access");
    }
  };

  private logoutUser = (res: Response) => {
    cookieManager.clearTokens(res);
    return res.status(HttpStatusCode.OK).json({
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "You have logged out",
      data: null,
    });
  };
}

export const JwtInstance = new JWT();
