const { z } = require('zod');

// Create Payment Validation Schema
const createPaymentSchema = z.object({
  student_id: z.string().min(1, 'Student ID is required'),
  amount: z.number().min(0, 'Amount must be positive'),
  emi_duedate: z.string().refine((date) => {
    return !isNaN(Date.parse(date));
  }, 'Invalid date format'),
  is_paid: z.boolean().optional().default(false),
  payment_date: z.string().optional(),
  txn_id: z.string().optional(),
  universityCode: z.enum(['GYAN001', 'GYAN002'], {
    errorMap: () => ({ message: 'Invalid university code' })
  })
});

// Update Payment Validation Schema
const updatePaymentSchema = z.object({
  student_id: z.string().min(1, 'Student ID is required').optional(),
  amount: z.number().min(0, 'Amount must be positive').optional(),
  emi_duedate: z.string().refine((date) => {
    return !isNaN(Date.parse(date));
  }, 'Invalid date format').optional(),
  is_paid: z.boolean().optional(),
  payment_date: z.string().optional(),
  txn_id: z.string().optional(),
  universityCode: z.enum(['GYAN001', 'GYAN002'], {
    errorMap: () => ({ message: 'Invalid university code' })
  }).optional()
});

// Update Payment Status Validation Schema
const updatePaymentStatusSchema = z.object({
  is_paid: z.boolean(),
  txn_id: z.string().optional()
});

// Bulk Mark Payments Validation Schema
const bulkMarkPaymentsSchema = z.object({
  paymentIds: z.array(z.string()).min(1, 'At least one payment ID is required'),
  txn_id: z.string().optional()
});

// Get Payments Query Validation Schema
const getPaymentsQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default(1),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default(10),
  universityCode: z.enum(['GYAN001', 'GYAN002']).optional(),
  searchTerm: z.string().optional(),
  is_paid: z.enum(['true', 'false']).optional(),
  student_id: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

// Get Payment Statistics Query Validation Schema
const getPaymentStatisticsQuerySchema = z.object({
  universityCode: z.enum(['GYAN001', 'GYAN002']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

module.exports = {
  createPaymentSchema,
  updatePaymentSchema,
  updatePaymentStatusSchema,
  bulkMarkPaymentsSchema,
  getPaymentsQuerySchema,
  getPaymentStatisticsQuerySchema
};