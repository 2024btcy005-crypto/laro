const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const { Order, Payment } = require('../models');

// @desc    Create Razorpay Order
// @route   POST /api/payments/create
// @access  Private
const createPaymentOrder = async (req, res) => {
    try {
        const { orderId } = req.body;

        // Find existing DB order
        const dbOrder = await Order.findByPk(orderId);
        if (!dbOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (dbOrder.customerId !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (dbOrder.paymentStatus === 'paid') {
            return res.status(400).json({ message: 'Order is already paid' });
        }

        const options = {
            amount: Math.round(dbOrder.totalAmount * 100), // convert to paise
            currency: "INR",
            receipt: `receipt_order_${dbOrder.id}`,
            payment_capture: 1 // auto capture
        };

        const rzpOrder = await razorpay.orders.create(options);

        // Save payment intent logic
        await Payment.create({
            orderId: dbOrder.id,
            razorpayOrderId: rzpOrder.id,
            amount: dbOrder.totalAmount,
            status: 'created'
        });

        res.status(200).json({
            rzpOrderId: rzpOrder.id,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || "Error creating Razorpay order" });
    }
};

// @desc    Verify Razorpay Payment Signature
// @route   POST /api/payments/verify
// @access  Private
const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, system_order_id } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            // Update Payment Record
            await Payment.update({
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
                status: 'paid'
            }, {
                where: { razorpayOrderId: razorpay_order_id }
            });

            // Update Order Status
            await Order.update({
                paymentStatus: 'paid'
            }, {
                where: { id: system_order_id }
            });

            // TODO: Emit Socket event to Admin/Shop that order is paid

            res.status(200).json({ message: "Payment successful" });
        } else {
            res.status(400).json({ message: "Invalid Signature" });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error verifying payment signature" });
    }
};

module.exports = {
    createPaymentOrder,
    verifyPayment
};
