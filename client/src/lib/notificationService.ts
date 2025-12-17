/**
 * Notification Service for VYORA
 * 
 * This service provides utilities for creating notifications across all modules.
 * Notifications are automatically sent to the vendor's notification panel.
 * 
 * INTEGRATED MODULES:
 * - Orders (order) - New orders, order status updates, cancellations
 * - Payments (payment) - Payment received, payment pending, refunds
 * - Appointments (appointment) - New appointments, cancellations, reminders
 * - Bookings (booking) - New bookings, booking confirmations
 * - Customers (customer) - New customers, customer updates
 * - Leads (lead) - New leads, lead conversions, follow-up reminders
 * - Tasks (task) - Task assignments, task completions, deadlines
 * - Stock (stock) - Low stock alerts, stock updates
 * - Expenses (expense) - New expenses, expense approvals
 * - Approvals (approval) - Approval requests, approved items
 * - Quotations (quotation) - New quotation requests, quotation updates
 * - Employees (employee) - Employee updates, leave requests
 * - Suppliers (supplier) - Supplier updates, order confirmations
 * - Marketing (marketing) - Campaign updates, promotions
 * - System (system) - System updates, maintenance notices
 * - Info (info) - General information
 */

import { apiRequest } from "./queryClient";

// Notification types enum
export type NotificationType = 
  | "order"
  | "payment"
  | "appointment"
  | "booking"
  | "customer"
  | "lead"
  | "task"
  | "stock"
  | "expense"
  | "approval"
  | "quotation"
  | "employee"
  | "supplier"
  | "marketing"
  | "system"
  | "info";

// Notification data interface
export interface CreateNotificationData {
  vendorId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  referenceType?: string;
  referenceId?: string;
}

/**
 * Create a notification for a vendor
 * @param data Notification data
 * @returns Promise with the created notification
 */
export async function createNotification(data: CreateNotificationData): Promise<any> {
  try {
    const response = await apiRequest("POST", "/api/notifications", {
      userId: null,
      vendorId: data.vendorId,
      title: data.title,
      message: data.message,
      type: data.type,
      link: data.link,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      read: false,
    });
    return response;
  } catch (error) {
    console.error("Failed to create notification:", error);
    throw error;
  }
}

// Pre-built notification templates for common scenarios
export const NotificationTemplates = {
  // Order notifications
  newOrder: (vendorId: string, orderId: string, customerName: string, amount: number) => 
    createNotification({
      vendorId,
      title: "🛒 New Order Received",
      message: `${customerName} placed an order worth ₹${amount.toLocaleString()}`,
      type: "order",
      link: `/vendor/orders`,
      referenceType: "order",
      referenceId: orderId,
    }),

  orderStatusUpdate: (vendorId: string, orderId: string, status: string) =>
    createNotification({
      vendorId,
      title: "📦 Order Status Updated",
      message: `Order #${orderId.slice(0, 8)} has been ${status}`,
      type: "order",
      link: `/vendor/orders`,
      referenceType: "order",
      referenceId: orderId,
    }),

  // Payment notifications
  paymentReceived: (vendorId: string, amount: number, customerName: string) =>
    createNotification({
      vendorId,
      title: "💰 Payment Received",
      message: `₹${amount.toLocaleString()} received from ${customerName}`,
      type: "payment",
      link: `/vendor/pos`,
    }),

  paymentPending: (vendorId: string, amount: number, customerName: string) =>
    createNotification({
      vendorId,
      title: "⏳ Payment Pending",
      message: `₹${amount.toLocaleString()} pending from ${customerName}`,
      type: "payment",
      link: `/vendor/ledger`,
    }),

  // Appointment notifications
  newAppointment: (vendorId: string, appointmentId: string, customerName: string, dateTime: string) =>
    createNotification({
      vendorId,
      title: "📅 New Appointment",
      message: `${customerName} booked an appointment for ${dateTime}`,
      type: "appointment",
      link: `/vendor/appointments`,
      referenceType: "appointment",
      referenceId: appointmentId,
    }),

  appointmentReminder: (vendorId: string, customerName: string, time: string) =>
    createNotification({
      vendorId,
      title: "⏰ Appointment Reminder",
      message: `Upcoming appointment with ${customerName} at ${time}`,
      type: "appointment",
      link: `/vendor/appointments`,
    }),

  // Booking notifications
  newBooking: (vendorId: string, bookingId: string, serviceName: string, customerName: string) =>
    createNotification({
      vendorId,
      title: "📋 New Booking",
      message: `${customerName} booked ${serviceName}`,
      type: "booking",
      link: `/vendor/bookings`,
      referenceType: "booking",
      referenceId: bookingId,
    }),

  // Customer notifications
  newCustomer: (vendorId: string, customerId: string, customerName: string) =>
    createNotification({
      vendorId,
      title: "👤 New Customer",
      message: `${customerName} joined your customer list`,
      type: "customer",
      link: `/vendor/customers/${customerId}`,
      referenceType: "customer",
      referenceId: customerId,
    }),

  // Lead notifications
  newLead: (vendorId: string, leadId: string, leadName: string, source: string) =>
    createNotification({
      vendorId,
      title: "🎯 New Lead",
      message: `${leadName} from ${source}`,
      type: "lead",
      link: `/vendor/leads`,
      referenceType: "lead",
      referenceId: leadId,
    }),

  leadFollowUp: (vendorId: string, leadName: string) =>
    createNotification({
      vendorId,
      title: "📞 Follow-up Reminder",
      message: `Time to follow up with ${leadName}`,
      type: "lead",
      link: `/vendor/leads`,
    }),

  leadConverted: (vendorId: string, leadName: string) =>
    createNotification({
      vendorId,
      title: "🎉 Lead Converted",
      message: `${leadName} has been converted to a customer`,
      type: "lead",
      link: `/vendor/customers`,
    }),

  // Task notifications
  taskAssigned: (vendorId: string, taskId: string, taskTitle: string, assignee: string) =>
    createNotification({
      vendorId,
      title: "📝 Task Assigned",
      message: `"${taskTitle}" assigned to ${assignee}`,
      type: "task",
      link: `/vendor/tasks`,
      referenceType: "task",
      referenceId: taskId,
    }),

  taskCompleted: (vendorId: string, taskTitle: string) =>
    createNotification({
      vendorId,
      title: "✅ Task Completed",
      message: `"${taskTitle}" has been completed`,
      type: "task",
      link: `/vendor/tasks`,
    }),

  taskDeadline: (vendorId: string, taskTitle: string, deadline: string) =>
    createNotification({
      vendorId,
      title: "⚠️ Task Deadline",
      message: `"${taskTitle}" is due ${deadline}`,
      type: "task",
      link: `/vendor/tasks`,
    }),

  // Stock notifications
  lowStock: (vendorId: string, productName: string, currentStock: number) =>
    createNotification({
      vendorId,
      title: "📦 Low Stock Alert",
      message: `${productName} has only ${currentStock} units left`,
      type: "stock",
      link: `/vendor/stock-turnover`,
    }),

  stockUpdated: (vendorId: string, productName: string, quantity: number, action: "in" | "out") =>
    createNotification({
      vendorId,
      title: `📊 Stock ${action === "in" ? "Added" : "Removed"}`,
      message: `${quantity} units of ${productName} ${action === "in" ? "added to" : "removed from"} inventory`,
      type: "stock",
      link: `/vendor/stock-turnover`,
    }),

  // Expense notifications
  newExpense: (vendorId: string, expenseId: string, category: string, amount: number) =>
    createNotification({
      vendorId,
      title: "💸 Expense Recorded",
      message: `₹${amount.toLocaleString()} expense in ${category}`,
      type: "expense",
      link: `/vendor/expenses`,
      referenceType: "expense",
      referenceId: expenseId,
    }),

  // Quotation notifications
  newQuotation: (vendorId: string, quotationId: string, customerName: string) =>
    createNotification({
      vendorId,
      title: "📄 New Quotation Request",
      message: `${customerName} requested a quotation`,
      type: "quotation",
      link: `/vendor/quotations`,
      referenceType: "quotation",
      referenceId: quotationId,
    }),

  quotationApproved: (vendorId: string, quotationNumber: string) =>
    createNotification({
      vendorId,
      title: "✅ Quotation Approved",
      message: `Quotation ${quotationNumber} has been approved`,
      type: "quotation",
      link: `/vendor/quotations`,
    }),

  // Employee notifications
  leaveRequest: (vendorId: string, employeeName: string, dates: string) =>
    createNotification({
      vendorId,
      title: "🏖️ Leave Request",
      message: `${employeeName} requested leave for ${dates}`,
      type: "employee",
      link: `/vendor/leaves`,
    }),

  attendanceAlert: (vendorId: string, employeeName: string) =>
    createNotification({
      vendorId,
      title: "⏰ Attendance Alert",
      message: `${employeeName} hasn't checked in today`,
      type: "employee",
      link: `/vendor/attendance`,
    }),

  // Supplier notifications
  supplierOrderConfirmed: (vendorId: string, supplierName: string, orderId: string) =>
    createNotification({
      vendorId,
      title: "📦 Supplier Order Confirmed",
      message: `${supplierName} confirmed order #${orderId.slice(0, 8)}`,
      type: "supplier",
      link: `/vendor/suppliers`,
    }),

  // Marketing notifications
  campaignLaunched: (vendorId: string, campaignName: string) =>
    createNotification({
      vendorId,
      title: "📢 Campaign Launched",
      message: `Your "${campaignName}" campaign is now live`,
      type: "marketing",
      link: `/vendors/${vendorId}/greeting`,
    }),

  // System notifications
  systemUpdate: (vendorId: string, message: string) =>
    createNotification({
      vendorId,
      title: "⚙️ System Update",
      message,
      type: "system",
    }),

  welcomeNotification: (vendorId: string, businessName: string) =>
    createNotification({
      vendorId,
      title: "👋 Welcome to Vyora!",
      message: `${businessName}, your business portal is ready. Start by adding your products and services.`,
      type: "info",
      link: `/vendor/dashboard`,
    }),
};

export default NotificationTemplates;




