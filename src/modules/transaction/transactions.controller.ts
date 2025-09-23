// import BaseController from "@/shared/baseController";
// import { Request, Response } from "express";
// import { OrderModel } from "../order/order.model";
// import { ORDER_STATUS } from "../order/order.enums";

// class Controller extends BaseController {
//   createTransaction = this.catchAsync(async (req: Request, res: Response) => {
//     const { paymentID, status, order_id } = req.query;
//     // Start a session for transaction

//     if (order_id) {
//       const order = await OrderModel.findById(order_id);

//       if (!order) {
//         return this.sendResponse(res, {
//           statusCode: 404,
//           success: false,
//           message: "Order not found",
//         });
//       }

//       if (order?.status === ORDER_STATUS.PLACED) {
//         return res.redirect(
//           `${process.env.LOCAL_CLIENT_URL}/checkout/payment/verify?order_id=${order.id}&message=${"Order is already placed"}&status=${ORDER_STATUS.PLACED}&paymentID=${paymentID}`
//         );
//       }
//       if (status === "cancel" || status === "failure") {
//         //  Update order status to failed and add order_note

//         order.system_message = `Bkash payment status is ${status} because of that order status is ${ORDER_STATUS.FAILED}`;

//         order.status = ORDER_STATUS.FAILED;
//         order.is_delivery_charge_paid = false;
//         // Create FailedTransaction
//         const transaction = await TransactionService.createTransaction({
//           order: order.id,
//           payment_date: new Date(Date.now()),
//           payment_id: paymentID as string,
//           trx_status: status,
//           amount: order.payable_amount,
//           trx_id: "Not found",
//           user: order.user || null,
//           currency: "BDT",
//           payment_by: order.user || "Not found",
//           message: order.order_note,
//           method: "BKASH",
//         });
//         order.payment_id = transaction._id;
//         await order.save();
//         console.log("Payment Cancel or Failure", status);
//         // todo change with the help of @Nahid vi
//         // return res.redirect(
//         //   `${process.env.PRODUCTION_CLIENT_URL}/payment/failed?message=${status}`
//         // );
//         return res.redirect(
//           `${process.env.LOCAL_CLIENT_URL}/checkout/payment/verify?order_id=${order.id}&message=${order.order_note}&status=${order.status}&paymentID=${paymentID}`
//         );
//       }
//       if (status == "success") {
//         const executeData = await BkashUtils.executePayment(
//           paymentID as string
//         );

//         if (executeData && executeData?.statusMessage === "Successful") {
//           order.system_message = (
//             `Bkash payment status is ${status} because of that order status is ${ORDER_STATUS.PLACED}`
//           );

//           order.status = ORDER_STATUS.PLACED;
//           order.is_delivery_charge_paid = true;
//           order.paid_amount = parseFloat(executeData?.amount || "0");
//           const transaction = await TransactionService.createTransaction({
//             order: order.id,
//             payment_date: new Date(Date.now()),
//             payment_id: paymentID as string,
//             trx_status: status,
//             amount: order.payable_amount,
//             trx_id: executeData?.trxID || "Not found",
//             user: order.user || null,
//             currency: "BDT",
//             payment_by: order.user || "Not found",
//             message: order.order_note,
//             method: "BKASH",
//           });
//           order.payment_id = transaction._id;
//           // reserved products
//           for (const item of order.products) {
//             const reserved = await ReservedOrderQuantity.create({
//               product: item.product,
//               variant: item.selected_variant._id,
//               order: order_id,
//               reserved: item.total_quantity,
//             });
//             await reserved.save();
//           }
//           await order.save();
//           // todo change with the help of @Nahid vi

//           return res.redirect(
//             `${process.env.LOCAL_CLIENT_URL}/checkout/payment/verify?order_id=${order.id}&message=${"Payment status success"}&status=${OrderStatus.PLACED}&paymentID=${paymentID}`
//           );
//         } else {
//           //  Update order status to failed and add order_note
//           const order = await OrderService.getOrderById(order_id as string);

//           order.system_message?.push(
//             `Bkash payment status is ${status} because of that order status is ${OrderStatus.FAILED}`
//           );

//           order.status = OrderStatus.FAILED;
//           order.is_delivery_charge_paid = false;
//           // Create FailedTransaction
//           const transaction = await TransactionService.createTransaction({
//             order: order.id,
//             payment_date: new Date(Date.now()),
//             payment_id: paymentID as string,
//             trx_status: status,
//             amount: order.payable_amount,
//             trx_id: "Not found",
//             user: order.user || null,
//             currency: "BDT",
//             payment_by: "Not found",
//             message: order.order_note,
//             method: "BKASH",
//           });
//           order.payment_info = transaction._id;
//           await order.save();
//           // todo change with the help of @Nahid vi
//           return res.redirect(
//             `${process.env.LOCAL_CLIENT_URL}/checkout/payment/verify?order_id=${order.id}&message=${"Payment Cancel or Failure"}&status=${OrderStatus.PLACED}&paymentID=${paymentID}`
//           );
//         }
//       }
//     }
//   });
// }

// export const TransactionController = new Controller();
