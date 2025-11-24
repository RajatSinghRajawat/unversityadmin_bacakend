const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  txn_id: {
    type: String,
    default: null
  },
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  is_paid: {
    type: Boolean,
    required: true,
    default: false
  },
  amount: {
    type: Number,
    required: true
  },
  emi_discount: {
    type: Number,
    default: 0
  },
  payment_date: {
    type: Date,
    default: null
  },
  emi_duedate: {
    type: Date,
    required: false
  },
  universityCode: {
    type: String,
    required: true,
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports =  mongoose.model('Payment', paymentSchema);
