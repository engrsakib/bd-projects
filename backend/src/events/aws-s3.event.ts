import { AWSFileUploader } from "@/modules/aws/uploader";
import { emitter } from "./eventEmitter";

emitter?.on("s3.files.deleted", async (urls: string[]) => {
  console.log(`✅ AWS S3 Event received files.deleted event.`);
  // delete the resources
  await AWSFileUploader.deleteMultipleFiles(urls);
});

emitter?.on("s3.file.deleted", async (url: string) => {
  console.log(`✅ AWS S3 Event received files.deleted event.`);
  // delete the resource
  await AWSFileUploader.deleteSingleFile(url);
});
