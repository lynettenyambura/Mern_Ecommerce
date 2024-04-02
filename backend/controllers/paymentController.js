
const axios = require('axios');
const consumerSecret = process.env.CONSUMER_SECRET;
const consumerKey = process.env.CONSUMER_KEY;
const passkey = process.env.PASS_KEY;
const {getPassword,getTimestamp} = require('../utils/utils');
function accessToken(req, res, next) {
    try {
      const url = `https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials`;
      const auth =
        "Basic " +
        Buffer.from(consumerKey + ":" + consumerSecret).toString("base64");
      const headers = { Authorization: auth };                  
      axios
        .get(url, {
          headers: headers,
        })
        .then((response) => {
          let data = response.data;
          req.access_token = data.access_token;
          next();
        });
    } catch (error) {
      console.log(error);
    }
  }
function lipa_na_mpesa(req, res, next) {
  const stkUrl =
    "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
  // let amount_payable = req.query.amount;
  const { amount_payable,phoneNumber } = req.body;
  // let amount_payable = 1;
  let account_reference = req.query.acc_ref;
  // let phoneNumber = req.query.phoneNumber;
  // let phoneNumber = +254713462306;
  let Token = req.access_token;
  console.log(Token);
  let headerToken =`Bearer ${Token}`;
  let timestamp = getTimestamp();
  let password = getPassword(174379, passkey, timestamp);
  console.log(password);
  let data = {
    BusinessShortCode: "174379",
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: amount_payable,
    PartyA: phoneNumber,
    PartyB: "174379",
    PhoneNumber: phoneNumber,
    CallBackURL: `https://91e1-41-89-227-171.ngrok-free.app/CallBack`,
    AccountReference: "lynette",
    TransactionDesc: "Item Payment",
  };
  axios
    .post(stkUrl, data, { headers: { 
        Authorization: headerToken 
         } })
    .then((response) => res.send(response.data))
    .catch((error) => console.log(error));
}
const CallBack = (req, res) => {
  let message = {
    ResponseCode: "0",
    ResponseDesc: "success",
  };
  if (req.body.Body.stkCallback.CallbackMetadata != undefined) {
    console.log("Payment SuccessFully");
  } else {
    console.log("Payment not SuccessFully");
  }
  console.log(req.body);
  res.json(message);
};
const confirmPayment = async (req, res) => {
  try {
      const url = "https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query";
      const auth = `Bearer ${req.access_token}`;
      const { CheckoutRequestID } = req.params;
      const timestamp = getTimestamp();
      const password = getPassword(174379, passkey, timestamp);
      const data = {
          BusinessShortCode: "174379",
          Password: password,
          CheckoutRequestID: CheckoutRequestID,
          Timestamp: timestamp
      };

      const MAX_RETRIES = 5; // Maximum number of retries
      let retries = 0;

      const queryTransactionStatus = async () => {
          try {
              const response = await axios.post(url, data, {
                  headers: { Authorization: auth }
              });
              return response.data;
          } catch (error) {
              console.error("Error response from Safaricom API:", error.response.data);
              if (retries < MAX_RETRIES && error.response.data.errorCode === '500.001.1001') {
                  // Retry after some delay if transaction is still being processed
                  retries++;
                  console.log(`Retrying query transaction status, attempt ${retries}`);
                  await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds
                  return queryTransactionStatus();
              } else {
                  // Other errors or maximum retries reached
                  throw new Error("Error processing payment confirmation");
              }
          }
      };

      const transactionStatus = await queryTransactionStatus();
      res.send(transactionStatus);
  } catch (error) {
      console.error("Unexpected error:", error);
      res.status(500).send("Unexpected error occurred");
  }
};


module.exports = {accessToken,lipa_na_mpesa,CallBack,confirmPayment};



