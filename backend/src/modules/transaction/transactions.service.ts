import { ITransaction } from "./transactions.interface";
import Transactions from "./transactions.model";

class Service {
  async createTransaction(payload: Partial<ITransaction>) {
    const transaction = await Transactions.create(payload);
    return transaction;
  }
}

export const TransactionService = new Service();
