import { AdminRoutes } from "@/modules/admin/admin.route";
import { OTPRoutes } from "@/modules/otp/otp.route";
import { CategoryRoutes } from "@/modules/category/category.routes";
import { ForgetPasswordRoutes } from "@/modules/forget-password/forgetPassword.routes";
import { Router } from "express";
import { SubCategoryRoutes } from "@/modules/subcategory/subcategory.routes";
import { UserRoutes } from "@/modules/user/user.routes";
import { locationRoutes } from "@/modules/location/location.routes";
import { ProductRoutes } from "@/modules/product/product.routes";
import { UploadRoutes } from "@/modules/upload/upload.routes";
import { VariantRoutes } from "@/modules/variant/variant.routes";
import { SupplierRoutes } from "@/modules/supplier/supplier.routes";
import { PurchaseRoutes } from "@/modules/purchase/purchase.routes";
import { StocksRoutes } from "@/modules/stock/stock.routes";
import { TransferRoutes } from "@/modules/transfer/transfer.routes";
import { CartRoutes } from "@/modules/cart/cart.routes";
import { BannerRoutes } from "@/modules/banner/banner.routes";
import { BkashRoutes } from "@/modules/bkash/bkash.routes";
import { OrderRoutes } from "@/modules/order/order.routes";
import { courierRouter } from "@/modules/courier/courier.routes";
const router = Router();

const moduleRoutes = [
  {
    path: "/admin",
    route: AdminRoutes,
  },
  {
    path: "/user",
    route: UserRoutes,
  },
  {
    path: "/otp",
    route: OTPRoutes,
  },
  {
    path: "/category",
    route: CategoryRoutes,
  },
  {
    path: "/subcategory",
    route: SubCategoryRoutes,
  },
  {
    path: "/forget-password",
    route: ForgetPasswordRoutes,
  },
  {
    path: "/location",
    route: locationRoutes,
  },
  {
    path: "/product",
    route: ProductRoutes,
  },
  {
    path: "/upload",
    route: UploadRoutes,
  },
  {
    path: "/variant",
    route: VariantRoutes,
  },
  {
    path: "/supplier",
    route: SupplierRoutes,
  },
  {
    path: "/purchase",
    route: PurchaseRoutes,
  },
  {
    path: "/stock",
    route: StocksRoutes,
  },
  {
    path: "/transfer",
    route: TransferRoutes,
  },
  {
    path: "/cart",
    route: CartRoutes,
  },
  {
    path: "/banner",
    route: BannerRoutes,
  },
  {
    path: "/order",
    route: OrderRoutes,
  },
  {
    path: "/payments/bkash",
    route: BkashRoutes,
  },
  {
    path: "/courier",
    route: courierRouter,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
