const express = require('express')
const router = express.Router();

const {accessToken,lipa_na_mpesa,CallBack,confirmPayment} = require('../controllers/paymentController')


const { isAuthenticatedUser } = require('../middlewares/auth')

// router.route('/payment/process').post(isAuthenticatedUser, processPayment);
// router.route('/stripeapi').get(isAuthenticatedUser, sendStripApi);
router.route('/lipa/callback').post(CallBack);
// router.use(isAuthenticatedUser)
router.route('/accessToken').get(accessToken);
router.route('/stkPush').post(accessToken,lipa_na_mpesa);
router.route('/confirmPayment/:CheckoutRequestID').post(accessToken,confirmPayment);


module.exports = router;