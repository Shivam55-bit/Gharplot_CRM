# Backend Email Implementation Guide

## 📧 Email Requirements

After booking confirmation, send **2 emails**:
1. **Admin Email** - New booking notification with all details
2. **Customer Email** - Booking confirmation

---

## 🔧 Backend Implementation (Node.js/Express Example)

### 1. Install Required Packages

```bash
npm install nodemailer
```

### 2. Email Service Setup (`services/emailService.js`)

```javascript
const nodemailer = require('nodemailer');

// Configure email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // or 'smtp', 'sendgrid', etc.
    auth: {
        user: process.env.EMAIL_USER, // your-email@gmail.com
        pass: process.env.EMAIL_PASSWORD // your-app-password
    }
});

// Admin Email Template
const sendAdminNotification = async (bookingData) => {
    const { 
        serviceName, 
        fullName, 
        phone, 
        alternatePhone,
        email, 
        alternateEmail,
        place, 
        address, 
        city, 
        pincode, 
        landmark,
        propertySize, 
        preferredDate, 
        preferredTime,
        specialInstructions,
        estimatedCost,
        payment 
    } = bookingData;

    // Determine payment method
    const paymentMethod = payment.method === 'cod' 
        ? '💰 Cash on Service' 
        : `💳 Paid Online (${payment.method.toUpperCase()})`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL, // admin@yourcompany.com
        subject: `🔔 New Service Booking - ${serviceName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">New Service Booking</h1>
                </div>
                
                <div style="padding: 20px; background: #f9fafb;">
                    <div style="background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                        <h2 style="color: #1F2937; border-bottom: 2px solid #10B981; padding-bottom: 10px;">
                            📋 Booking Details
                        </h2>
                        <p><strong>Service:</strong> ${serviceName}</p>
                        <p><strong>Property Type:</strong> ${place}</p>
                        <p><strong>Property Size:</strong> ${propertySize}</p>
                        <p><strong>Estimated Cost:</strong> ₹${estimatedCost.toLocaleString('en-IN')}</p>
                        <p><strong>Payment Method:</strong> ${paymentMethod}</p>
                        <p><strong>Scheduled Date:</strong> ${preferredDate}</p>
                        <p><strong>Time Slot:</strong> ${preferredTime}</p>
                    </div>

                    <div style="background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                        <h2 style="color: #1F2937; border-bottom: 2px solid #1E90FF; padding-bottom: 10px;">
                            👤 Customer Details
                        </h2>
                        <p><strong>Name:</strong> ${fullName}</p>
                        <p><strong>Phone:</strong> ${phone}</p>
                        ${alternatePhone ? `<p><strong>Alternate Phone:</strong> ${alternatePhone}</p>` : ''}
                        <p><strong>Email:</strong> ${email}</p>
                        ${alternateEmail ? `<p><strong>Alternate Email:</strong> ${alternateEmail}</p>` : ''}
                    </div>

                    <div style="background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                        <h2 style="color: #1F2937; border-bottom: 2px solid #F59E0B; padding-bottom: 10px;">
                            📍 Service Address
                        </h2>
                        <p>${address}</p>
                        <p>${city} - ${pincode}</p>
                        ${landmark ? `<p><strong>Landmark:</strong> ${landmark}</p>` : ''}
                    </div>

                    ${specialInstructions ? `
                    <div style="background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                        <h2 style="color: #1F2937; border-bottom: 2px solid #8B5CF6; padding-bottom: 10px;">
                            💬 Special Instructions
                        </h2>
                        <p style="font-style: italic;">${specialInstructions}</p>
                    </div>
                    ` : ''}

                    ${payment.method === 'cod' ? `
                    <div style="background: #ECFDF5; border-left: 4px solid #10B981; padding: 15px; border-radius: 4px;">
                        <p style="margin: 0; color: #047857;">
                            <strong>⚠️ Cash on Service:</strong> Customer will pay ₹${estimatedCost.toLocaleString('en-IN')} after service completion.
                        </p>
                    </div>
                    ` : `
                    <div style="background: #EFF6FF; border-left: 4px solid #1E90FF; padding: 15px; border-radius: 4px;">
                        <p style="margin: 0; color: #1E40AF;">
                            <strong>✓ Payment Completed:</strong> ₹${estimatedCost.toLocaleString('en-IN')} paid online via ${payment.method.toUpperCase()}.
                        </p>
                    </div>
                    `}
                </div>
                
                <div style="background: #1F2937; padding: 15px; text-align: center; color: white;">
                    <p style="margin: 0; font-size: 12px;">
                        © ${new Date().getFullYear()} Your Company Name. All rights reserved.
                    </p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('✅ Admin notification email sent successfully');
        return { success: true };
    } catch (error) {
        console.error('❌ Failed to send admin email:', error);
        return { success: false, error: error.message };
    }
};

// Customer Confirmation Email Template
const sendCustomerConfirmation = async (bookingData) => {
    const { 
        serviceName, 
        fullName, 
        email,
        place, 
        address, 
        city, 
        pincode,
        propertySize, 
        preferredDate, 
        preferredTime,
        estimatedCost,
        payment,
        bookingId // Generated by backend
    } = bookingData;

    const paymentMethod = payment.method === 'cod' 
        ? 'Cash on Service' 
        : `Paid Online (${payment.method.toUpperCase()})`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `✅ Booking Confirmed - ${serviceName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 30px; text-align: center;">
                    <div style="font-size: 60px; margin-bottom: 10px;">✅</div>
                    <h1 style="color: white; margin: 0;">Booking Confirmed!</h1>
                    <p style="color: #E5E7EB; margin-top: 10px;">Thank you for choosing our service</p>
                </div>
                
                <div style="padding: 20px; background: #f9fafb;">
                    <div style="background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                        <p style="color: #6B7280; margin: 0 0 5px 0;">Booking ID</p>
                        <p style="font-size: 24px; font-weight: bold; color: #1F2937; margin: 0;">
                            #${bookingId}
                        </p>
                    </div>

                    <div style="background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                        <h2 style="color: #1F2937; margin-top: 0;">📋 Service Details</h2>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; color: #6B7280;">Service:</td>
                                <td style="padding: 8px 0; color: #1F2937; font-weight: 600;">${serviceName}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #6B7280;">Property:</td>
                                <td style="padding: 8px 0; color: #1F2937; font-weight: 600;">${place} - ${propertySize}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #6B7280;">Date:</td>
                                <td style="padding: 8px 0; color: #1F2937; font-weight: 600;">${preferredDate}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #6B7280;">Time:</td>
                                <td style="padding: 8px 0; color: #1F2937; font-weight: 600;">${preferredTime}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #6B7280;">Location:</td>
                                <td style="padding: 8px 0; color: #1F2937; font-weight: 600;">${address}, ${city} - ${pincode}</td>
                            </tr>
                        </table>
                    </div>

                    <div style="background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                        <h2 style="color: #1F2937; margin-top: 0;">💰 Payment Information</h2>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: #F9FAFB; border-radius: 8px;">
                            <div>
                                <p style="margin: 0; color: #6B7280; font-size: 14px;">Total Amount</p>
                                <p style="margin: 5px 0 0 0; font-size: 28px; font-weight: bold; color: #10B981;">
                                    ₹${estimatedCost.toLocaleString('en-IN')}
                                </p>
                            </div>
                            <div style="text-align: right;">
                                <p style="margin: 0; color: #6B7280; font-size: 14px;">Payment Method</p>
                                <p style="margin: 5px 0 0 0; font-weight: 600; color: #1F2937;">
                                    ${paymentMethod}
                                </p>
                            </div>
                        </div>
                    </div>

                    ${payment.method === 'cod' ? `
                    <div style="background: #ECFDF5; border-left: 4px solid #10B981; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
                        <p style="margin: 0; color: #047857; font-weight: 600;">
                            💵 Cash on Service
                        </p>
                        <p style="margin: 10px 0 0 0; color: #047857; font-size: 14px;">
                            Please keep ₹${estimatedCost.toLocaleString('en-IN')} ready. You can pay in cash or via UPI after the service is completed.
                        </p>
                    </div>
                    ` : `
                    <div style="background: #EFF6FF; border-left: 4px solid #1E90FF; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
                        <p style="margin: 0; color: #1E40AF; font-weight: 600;">
                            ✓ Payment Completed
                        </p>
                        <p style="margin: 10px 0 0 0; color: #1E40AF; font-size: 14px;">
                            Your payment of ₹${estimatedCost.toLocaleString('en-IN')} has been successfully processed.
                        </p>
                    </div>
                    `}

                    <div style="background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                        <h3 style="color: #1F2937; margin-top: 0;">📞 Need Help?</h3>
                        <p style="color: #6B7280; margin: 0;">
                            Our team will contact you shortly to confirm the appointment. 
                            If you have any questions, feel free to reach out:
                        </p>
                        <p style="margin: 10px 0 0 0;">
                            <strong>📧 Email:</strong> support@yourcompany.com<br>
                            <strong>📱 Phone:</strong> +91-XXXXXXXXXX
                        </p>
                    </div>

                    <div style="text-align: center; padding: 20px;">
                        <a href="YOUR_APP_LINK/bookings" 
                           style="display: inline-block; background: #10B981; color: white; padding: 12px 30px; 
                                  text-decoration: none; border-radius: 8px; font-weight: 600;">
                            View My Bookings
                        </a>
                    </div>
                </div>
                
                <div style="background: #1F2937; padding: 15px; text-align: center; color: white;">
                    <p style="margin: 0; font-size: 12px;">
                        © ${new Date().getFullYear()} Your Company Name. All rights reserved.
                    </p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('✅ Customer confirmation email sent successfully');
        return { success: true };
    } catch (error) {
        console.error('❌ Failed to send customer email:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendAdminNotification,
    sendCustomerConfirmation
};
```

---

## 3. Update Service Request Endpoint

Update your `/api/services/request` endpoint:

```javascript
// routes/serviceRoutes.js
const express = require('express');
const router = express.Router();
const { sendAdminNotification, sendCustomerConfirmation } = require('../services/emailService');

router.post('/api/services/request', async (req, res) => {
    try {
        const bookingData = req.body;
        
        // Generate unique booking ID
        const bookingId = `BK${Date.now()}${Math.floor(Math.random() * 1000)}`;
        bookingData.bookingId = bookingId;
        
        // Save booking to database (your existing code)
        // const savedBooking = await BookingModel.create(bookingData);
        
        // Send emails in parallel
        const [adminResult, customerResult] = await Promise.all([
            sendAdminNotification(bookingData),
            sendCustomerConfirmation(bookingData)
        ]);
        
        console.log('📧 Email Results:');
        console.log('  Admin Email:', adminResult.success ? '✅ Sent' : '❌ Failed');
        console.log('  Customer Email:', customerResult.success ? '✅ Sent' : '❌ Failed');
        
        // Return success response
        res.status(200).json({
            success: true,
            status: 'success',
            message: 'Booking confirmed successfully',
            data: {
                bookingId: bookingId,
                emailsSent: {
                    admin: adminResult.success,
                    customer: customerResult.success
                }
            }
        });
        
    } catch (error) {
        console.error('❌ Booking request failed:', error);
        res.status(500).json({
            success: false,
            status: 'error',
            message: 'Failed to process booking',
            error: error.message
        });
    }
});

module.exports = router;
```

---

## 4. Environment Variables

Add to your `.env` file:

```bash
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
ADMIN_EMAIL=admin@yourcompany.com

# For Gmail, generate app-specific password:
# https://myaccount.google.com/apppasswords
```

---

## 5. Email Providers Options

### Option 1: Gmail (Development)
```javascript
service: 'gmail',
auth: {
    user: 'your-email@gmail.com',
    pass: 'app-specific-password'
}
```

### Option 2: SendGrid (Production - Recommended)
```bash
npm install @sendgrid/mail
```

```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

await sgMail.send({
    to: email,
    from: 'noreply@yourcompany.com',
    subject: 'Booking Confirmed',
    html: htmlContent
});
```

### Option 3: AWS SES (Production)
```bash
npm install @aws-sdk/client-ses
```

---

## 📱 Frontend Already Ready!

Your React Native app already sends all required data:

```javascript
// From ServicesScreen.js (lines 803-821)
const submitPayload = {
    ...pendingPayload,
    payment: paymentInfo,  // Contains { method: 'upi'/'card'/'cod', amount }
    orderId: order?.id,
    razorpayKey: rzpKey,
};

// pendingPayload contains:
{
    serviceId, serviceName, propertyType, place,
    address, city, pincode, landmark,
    fullName, phone, alternatePhone,
    email, alternateEmail,
    propertySize, preferredDate, preferredTime,
    specialInstructions, estimatedCost,
    requestedAt
}
```

---

## ✅ Testing Checklist

1. **Test with UPI Payment:**
   - [ ] Admin receives email with "Paid Online (UPI)"
   - [ ] Customer receives confirmation email

2. **Test with Card Payment:**
   - [ ] Admin receives email with "Paid Online (CARD)"
   - [ ] Customer receives confirmation email

3. **Test with Cash on Service:**
   - [ ] Admin receives email with "Cash on Service" warning
   - [ ] Customer receives email with COD instructions

4. **Verify Email Content:**
   - [ ] All booking details included
   - [ ] Payment method clearly visible
   - [ ] Proper formatting and styling
   - [ ] Links working (if any)

---

## 🎯 Summary

**Frontend (Already Done)** ✅
- Sends complete booking data with payment method
- Shows success modal after submission

**Backend (To Implement)**:
1. Install nodemailer
2. Create email service with 2 templates
3. Update `/api/services/request` endpoint
4. Send both emails on successful booking
5. Add environment variables

**Result**: 
- ✅ Admin gets notified with full details
- ✅ Customer gets confirmation
- ✅ Payment method clearly mentioned (Paid/COD)

---

*Need help with implementation? Let me know!* 🚀
