// Welcome Email Template
const welcomeEmail = (name) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Our Store!</h1>
        </div>
        <div class="content">
          <h2>Hello ${name}!</h2>
          <p>Thank you for creating an account with us. We're excited to have you on board!</p>
          <p>You can now browse our products and start shopping.</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}" class="button">Start Shopping</a>
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Your Store. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Order Confirmation Email Template
const orderConfirmationEmail = (order, user) => {
  const itemsHTML = order.orderItems.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${item.price.toFixed(2)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .order-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th { background: #f0f0f0; padding: 10px; text-align: left; }
        .total { font-size: 18px; font-weight: bold; color: #4CAF50; }
        .button { display: inline-block; padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Confirmation</h1>
          <p>Order #${order.orderNumber}</p>
        </div>
        <div class="content">
          <h2>Thank you for your order, ${user.name}!</h2>
          <p>We've received your order and will send you a shipping confirmation email once your items are on the way.</p>
          
          <div class="order-details">
            <h3>Order Details</h3>
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
            <p><strong>Order Status:</strong> ${order.orderStatus}</p>
          </div>

          <div class="order-details">
            <h3>Shipping Address</h3>
            <p>
              ${order.shippingAddress.fullName}<br>
              ${order.shippingAddress.street}<br>
              ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}<br>
              ${order.shippingAddress.country}<br>
              Phone: ${order.shippingAddress.phone}
            </p>
          </div>

          <div class="order-details">
            <h3>Order Summary</h3>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th style="text-align: center;">Quantity</th>
                  <th style="text-align: right;">Price</th>
                  <th style="text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
              </tbody>
            </table>
            
            <table style="margin-top: 20px;">
              <tr>
                <td style="text-align: right; padding: 5px;">Items Total:</td>
                <td style="text-align: right; padding: 5px; width: 100px;">$${order.itemsPrice.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="text-align: right; padding: 5px;">Shipping:</td>
                <td style="text-align: right; padding: 5px;">$${order.shippingPrice.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="text-align: right; padding: 5px;">Tax:</td>
                <td style="text-align: right; padding: 5px;">$${order.taxPrice.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="text-align: right; padding: 10px 5px; border-top: 2px solid #333;" class="total">Total:</td>
                <td style="text-align: right; padding: 10px 5px; border-top: 2px solid #333;" class="total">$${order.totalPrice.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <p style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/orders/${order._id}" class="button">View Order Status</a>
          </p>

          <p>If you have any questions, please contact our customer support.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Your Store. All rights reserved.</p>
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Order Shipped Email Template
const orderShippedEmail = (order, user) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .tracking-box { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; text-align: center; border: 2px dashed #2196F3; }
        .tracking-number { font-size: 24px; font-weight: bold; color: #2196F3; margin: 10px 0; }
        .button { display: inline-block; padding: 10px 20px; background: #2196F3; color: white; text-decoration: none; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📦 Your Order Has Been Shipped!</h1>
        </div>
        <div class="content">
          <h2>Great news, ${user.name}!</h2>
          <p>Your order #${order.orderNumber} is on its way to you!</p>
          
          <div class="tracking-box">
            <p><strong>Tracking Number:</strong></p>
            <div class="tracking-number">${order.trackingNumber || 'Not available yet'}</div>
            <p style="margin-top: 20px;">
              <a href="${process.env.FRONTEND_URL}/track/${order.trackingNumber || order.orderNumber}" class="button">Track Your Order</a>
            </p>
          </div>

          <p><strong>Estimated Delivery:</strong> 3-5 business days</p>
          <p><strong>Shipping Address:</strong></p>
          <p>
            ${order.shippingAddress.fullName}<br>
            ${order.shippingAddress.street}<br>
            ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}
          </p>

          <p>You'll receive another email once your package is delivered.</p>
          <p>Thank you for shopping with us!</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Your Store. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Order Delivered Email Template
const orderDeliveredEmail = (order, user) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 5px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Order Delivered!</h1>
        </div>
        <div class="content">
          <h2>Hi ${user.name}!</h2>
          <p>Your order #${order.orderNumber} has been delivered!</p>
          <p>We hope you love your purchase. If you have any issues, please don't hesitate to contact us.</p>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/orders/${order._id}" class="button">View Order</a>
            <a href="${process.env.FRONTEND_URL}/review/${order._id}" class="button">Write a Review</a>
          </p>

          <p>Thank you for shopping with us!</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Your Store. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Password Reset Email Template
const passwordResetEmail = (user, resetUrl) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #FF9800; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 10px 20px; background: #FF9800; color: white; text-decoration: none; border-radius: 5px; }
        .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Hello ${user.name}!</h2>
          <p>You requested to reset your password. Click the button below to proceed:</p>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>

          <div class="warning">
            <p><strong>⚠️ Important:</strong></p>
            <ul>
              <li>This link will expire in 10 minutes</li>
              <li>If you didn't request this, please ignore this email</li>
              <li>Your password will not be changed until you click the link above</li>
            </ul>
          </div>

          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Your Store. All rights reserved.</p>
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = {
  welcomeEmail,
  orderConfirmationEmail,
  orderShippedEmail,
  orderDeliveredEmail,
  passwordResetEmail,
};