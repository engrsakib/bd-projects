import BaseController from "@/shared/baseController";

class service extends BaseController {
  async steadfastWebhock(data: any) {
    return data;
  }
}

export const WebhocksService = new service();
