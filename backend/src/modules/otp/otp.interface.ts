export type IOTP = {
  phone_number: string;
  otp: number;
  createdAt: Date;
};

export type IOtpVerify = {
  phone_number: string;
  otp: number;
};
