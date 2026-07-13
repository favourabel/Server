const Order = require('../models/Order');
const Product = require('../models/Product');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const sendEmail = require('../utils/sendEmail');
const {
  orderConfirmationEmail,
  orderShippedEmail,
  orderDeliveredEmail,
} = require('../utils/emailTemplates');
const logger = require('../utils/logger');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      notes,
    } = req.body;

    // Verify all products exist and are in stock
    for (const item of orderItems) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).json(
          errorResponse(`Product not found: ${item.product}`, null, 404)
        );
      }

      if (!product.isInStock() || product.stock < item.quantity) {
        return res.status(400).json(
          errorResponse(
            `Product "${product.name}" is out of stock or insufficient quantity`,
            null,
            400
          )
        );
      }

      // Update order item with product details
      item.name = product.name;
      item.price = product.finalPrice;
      item.image = product.images[0]?.url || '';
    }

    // Create order
    const order = await Order.create({
      user: req.user.id,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      notes,
    });

    // Update product stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    // Populate order details
    await order.populate('user', 'name email');

    // Send order confirmation email
    sendEmail({
      to: shippingAddress.email,
      subject: `Order Confirmation - ${order.orderNumber}`,
      html: orderConfirmationEmail(order, req.user),
    }).catch(err => 
      logger.error('Order confirmation email failed:', { error: err.message })
    );

    logger.info(`Order created: ${order.orderNumber} by ${req.user.email}`);

    res.status(201).json(
      successResponse(
        'Order created successfully',
        order,
        201
      )
    );
  } catch (error) {
    logger.error('Create order error:', { error: error.message });

    res.status(500).json(
      errorResponse('Failed to create order', error.message, 500)
    );
  }
};

// @desc    Get all orders (admin/seller)
// @route   GET /api/orders
// @access  Private/Admin/Seller
exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    // Build query
    const query = {};

    // Filter by status
    if (status) {
      query.orderStatus = status;
    }

    // Search by order number
    if (search) {
      query.orderNumber = { $regex: search, $options: 'i' };
    }

    // Pagination
    const skip = (page - 1) * limit;

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Order.countDocuments(query);

    res.status(200).json(
      successResponse('Orders retrieved successfully', {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalOrders: total,
          limit: parseInt(limit),
        },
      })
    );
  } catch (error) {
    logger.error('Get all orders error:', { error: error.message });

    res.status(500).json(
      errorResponse('Failed to retrieve orders', error.message, 500)
    );
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/my-orders
// @access  Private
exports.getMyOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Order.countDocuments({ user: req.user.id });

    res.status(200).json(
      successResponse('Your orders retrieved successfully', {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalOrders: total,
          limit: parseInt(limit),
        },
      })
    );
  } catch (error) {
    logger.error('Get my orders error:', { error: error.message });

    res.status(500).json(
      errorResponse('Failed to retrieve orders', error.message, 500)
    );
  }
};

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('orderItems.product', 'name');

    if (!order) {
      return res.status(404).json(
        errorResponse('Order not found', null, 404)
      );
    }

    // Check if user owns the order or is admin
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json(
        errorResponse('Not authorized to view this order', null, 403)
      );
    }

    res.status(200).json(
      successResponse('Order retrieved successfully', order)
    );
  } catch (error) {
    logger.error('Get order by ID error:', { error: error.message });

    if (error.kind === 'ObjectId') {
      return res.status(404).json(
        errorResponse('Order not found', null, 404)
      );
    }

    res.status(500).json(
      errorResponse('Failed to retrieve order', error.message, 500)
    );
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, trackingNumber } = req.body;

    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
      return res.status(404).json(
        errorResponse('Order not found', null, 404)
      );
    }

    const previousStatus = order.orderStatus;
    order.orderStatus = orderStatus;

    // Set tracking number if provided
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }

    // Update delivery status
    if (orderStatus === 'Delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();

      // Send delivery confirmation email
      sendEmail({
        to: order.user.email,
        subject: `Order Delivered - ${order.orderNumber}`,
        html: orderDeliveredEmail(order, order.user),
      }).catch(err => 
        logger.error('Order delivered email failed:', { error: err.message })
      );
    }

    // Send shipping notification
    if (orderStatus === 'Shipped' && previousStatus !== 'Shipped') {
      sendEmail({
        to: order.user.email,
        subject: `Order Shipped - ${order.orderNumber}`,
        html: orderShippedEmail(order, order.user),
      }).catch(err => 
        logger.error('Order shipped email failed:', { error: err.message })
      );
    }

    await order.save();

    logger.info(`Order ${order.orderNumber} status updated to ${orderStatus}`);

    res.status(200).json(
      successResponse('Order status updated successfully', order)
    );
  } catch (error) {
    logger.error('Update order status error:', { error: error.message });

    res.status(500).json(
      errorResponse('Failed to update order status', error.message, 500)
    );
  }
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
exports.updateOrderToPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json(
        errorResponse('Order not found', null, 404)
      );
    }

    // Check if user owns the order
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json(
        errorResponse('Not authorized to update this order', null, 403)
      );
    }

    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.email_address,
    };

    // Update order status to Processing
    if (order.orderStatus === 'Pending') {
      order.orderStatus = 'Processing';
    }

    await order.save();

    logger.info(`Order ${order.orderNumber} marked as paid`);

    res.status(200).json(
      successResponse('Order updated to paid', order)
    );
  } catch (error) {
    logger.error('Update order to paid error:', { error: error.message });

    res.status(500).json(
      errorResponse('Failed to update order', error.message, 500)
    );
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json(
        errorResponse('Order not found', null, 404)
      );
    }

    // Check if user owns the order
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json(
        errorResponse('Not authorized to cancel this order', null, 403)
      );
    }

    // Check if order can be cancelled
    if (['Shipped', 'Delivered'].includes(order.orderStatus)) {
      return res.status(400).json(
        errorResponse('Cannot cancel order that has been shipped or delivered', null, 400)
      );
    }

    order.orderStatus = 'Cancelled';
    order.cancellationReason = req.body.reason || 'Cancelled by user';

    // Restore product stock
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    await order.save();

    logger.info(`Order ${order.orderNumber} cancelled`);

    res.status(200).json(
      successResponse('Order cancelled successfully', order)
    );
  } catch (error) {
    logger.error('Cancel order error:', { error: error.message });

    res.status(500).json(
      errorResponse('Failed to cancel order', error.message, 500)
    );
  }
};

// @desc    Get order statistics
// @route   GET /api/orders/stats
// @access  Private/Admin
exports.getOrderStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ orderStatus: 'Pending' });
    const processingOrders = await Order.countDocuments({ orderStatus: 'Processing' });
    const shippedOrders = await Order.countDocuments({ orderStatus: 'Shipped' });
    const deliveredOrders = await Order.countDocuments({ orderStatus: 'Delivered' });
    const cancelledOrders = await Order.countDocuments({ orderStatus: 'Cancelled' });

    // Calculate total revenue
    const revenueData = await Order.aggregate([
      { $match: { isPaid: true } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' },
        },
      },
    ]);

    const stats = {
      totalOrders,
      ordersByStatus: {
        pending: pendingOrders,
        processing: processingOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
      },
      totalRevenue: revenueData[0]?.totalRevenue || 0,
    };

    res.status(200).json(
      successResponse('Order statistics retrieved successfully', stats)
    );
  } catch (error) {
    logger.error('Get order stats error:', { error: error.message });

    res.status(500).json(
      errorResponse('Failed to retrieve statistics', error.message, 500)
    );
  }
};