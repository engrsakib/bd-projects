import { Router } from "express";
import { UploadController } from "./upload.controller";
import { upload } from "@/config/multer";

const router = Router();

router.post(
  "/single",
  upload.single("file"),
  UploadController.uploadSingleFile
);

router.post(
  "/multiple",
  upload.array("files"),
  UploadController.uploadMultipleFiles
);

export const UploadRoutes = router;
