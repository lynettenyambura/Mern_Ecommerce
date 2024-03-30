import React, { Fragment, useEffect, useState } from 'react';
import MetaData from '../layout/MetaData';
import CheckoutSteps from './CheckoutSteps';
import { useAlert } from 'react-alert';
import { useDispatch, useSelector } from 'react-redux';
import { createOrder, clearErrors } from '../../actions/orderActions';
import axios from 'axios';

const Payment = ({ history }) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [confirmingPayment, setConfirmingPayment] = useState(false); // State to track if confirming payment

    const alert = useAlert();
    const dispatch = useDispatch();

    const { cartItems, shippingInfo } = useSelector(state => state.cart);
    const { error } = useSelector(state => state.newOrder);

    useEffect(() => {
        if (error) {
            alert.error(error);
            dispatch(clearErrors());
        }
    }, [dispatch, alert, error]);

    const order = {
        orderItems: cartItems,
        shippingInfo
    };

    const orderInfo = JSON.parse(sessionStorage.getItem('orderInfo'));
    if (orderInfo) {
        order.itemsPrice = orderInfo.itemsPrice;
        order.shippingPrice = orderInfo.shippingPrice;
        order.taxPrice = orderInfo.taxPrice;
        order.totalPrice = orderInfo.totalPrice;
    }

    const paymentData = {
        phoneNumber: phoneNumber,
        amount_payable: 1
    };

    const paymentHandler = async () => {
        try {
            const res = await axios.post('api/v1/stkPush', paymentData);
            setLoading(true);
    
            if (res.data.MerchantRequestID) {
           
                await confirmPayment(res.data.CheckoutRequestID);
            } else {
                alert.error('Payment Failed');
                setLoading(false);
            }
        } catch (error) {
            console.error('Error during payment processing:', error);
            alert.error('Payment processing error. Please try again later.');
            setLoading(false);
        }
    };
    
    const confirmPayment = async (CheckoutRequestID) => {
        try {
            const confirmationURL = `api/v1/confirmPayment/${CheckoutRequestID}`;
            const res = await axios.post(confirmationURL);
    console.log(res);
            if (res.status === 200) {
                order.paymentInfo = {
                    id: Math.floor(Math.random() * 100),
                    status: 'succeeded'
                }

                dispatch(createOrder(order))

               
                history.push('/success');
            } else {
                // Payment confirmation failed
                alert.error('Payment confirmation failed');
            }
        } catch (error) {
            console.error('Error confirming payment:', error);
            alert.error('Error confirming payment. Please try again later.');
        } finally {
            setLoading(false); // Set loading to false after payment confirmation
        }
    };
    


  

    return (
        <Fragment>
            <MetaData title={'Payment'} />

            <CheckoutSteps shipping confirmOrder payment />
            <div className='paymentContainer'>
                <p className='orderSummary'>Order summary</p>
                <div className='paymentCard'>
                    <p>Total To Pay</p>
                    <h5>{orderInfo && orderInfo.totalPrice}`</h5>
                </div>
                <div className='paymentAmount'>
                    <p>Enter your phone number</p>
                    <input type="number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
                </div>
                <button className='payButton' onClick={paymentHandler}>Pay {` - ${orderInfo && orderInfo.totalPrice}`}</button>
                {confirmingPayment && <p>Confirming payment...</p>} {/* Display loader while confirming payment */}
            </div>
        </Fragment>
    );
};

export default Payment;
