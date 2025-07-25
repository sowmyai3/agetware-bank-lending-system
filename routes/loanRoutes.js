const express = require('express');
const {
  createLoan,
  recordPayment,
  getLedger,
  getCustomerOverview
} = require('../controllers/loanController');

const router = express.Router();

router.post('/loans', createLoan);
router.post('/loans/:loan_id/payments', recordPayment);
router.get('/loans/:loan_id/ledger', getLedger);
router.get('/customers/:customer_id/overview', getCustomerOverview);

module.exports = router;
