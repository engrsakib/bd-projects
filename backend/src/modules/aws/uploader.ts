import { envConfig } from "@/config/index";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import path from "path";

class Service {
  private readonly bucketName = envConfig.aws.bucket_name;
  private readonly region = envConfig.aws.region;
  private readonly accessKeyId = envConfig.aws.access_key_id;
  private readonly secretAccessKey = envConfig.aws.secret_access_key;
  private readonly uploadBaseUrl = envConfig.aws.file_load_base_url;
  private readonly rootFolder = "cloudybd";

  private s3Client = new S3Client({
    region: this.region,
    credentials: {
      accessKeyId: this.accessKeyId,
      secretAccessKey: this.secretAccessKey,
    },
  });

  private getPublicUrl(key: string) {
    return `${this.uploadBaseUrl}/${key}`;
  }

  private async uploadFileToS3(
    file: Express.Multer.File,
    folder: string
  ): Promise<string> {
    const fileExt = path.extname(file.originalname).toLowerCase();
    const fileName = `${randomUUID()}${fileExt}`;
    const key = `${this.rootFolder}/${folder}/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3Client.send(command);
    return this.getPublicUrl(key);
  }

  private async deleteFileFromS3(key: string): Promise<void> {
    console.log(`[AWS S3] Deleting file with key: ${key}`);
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.s3Client.send(command);
      console.log(`[AWS S3] Successfully Deleted file with key: ${key}`);
    } catch (error: any) {
      console.error(`[AWS S3] Error deleting file: ${key}`, error?.message);
    }
  }

  private async deleteMultipleFilesFromS3(keys: string[]): Promise<void> {
    console.log(`[AWS S3] Deleting files with keys: ${keys.join(", ")}`);
    try {
      const command = new DeleteObjectsCommand({
        Bucket: this.bucketName,
        Delete: {
          Objects: keys.map((key) => ({ Key: key })),
          Quiet: false,
        },
      });
      await this.s3Client.send(command);
      console.log(
        `[AWS S3] Successfully Deleted files with keys: ${keys.join(", ")}`
      );
    } catch (error: any) {
      console.error(
        `[AWS S3] Error deleting files: ${keys.join(", ")}`,
        error?.message
      );
    }
  }

  private extractS3KeyFromUrl(url: string): string {
    try {
      const parsedUrl = new URL(url);
      if (!parsedUrl.href.startsWith(this.uploadBaseUrl)) {
        throw new Error("Invalid S3 URL: does not match base URL");
      }

      return parsedUrl.pathname
        .replace(/^\//, "")
        .replace(this.uploadBaseUrl.replace(/^https?:\/\//, "") + "/", "");
    } catch {
      throw new Error(`Invalid URL: ${url}`);
    }
  }

  async uploadSingleFile(
    file: Express.Multer.File,
    folder: string
  ): Promise<string> {
    return await this.uploadFileToS3(file, folder);
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder: string
  ): Promise<string[]> {
    const uploadPromises = files.map((file) =>
      this.uploadFileToS3(file, folder)
    );
    return await Promise.all(uploadPromises);
  }

  async deleteSingleFile(url: string) {
    const key = this.extractS3KeyFromUrl(url);
    await this.deleteFileFromS3(key);
  }

  async deleteMultipleFiles(urls: string[]) {
    const keys = urls.map((url) => this.extractS3KeyFromUrl(url));
    await this.deleteMultipleFilesFromS3(keys);
  }
}

export const AWSFileUploader = new Service();
