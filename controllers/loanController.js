const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');

exports.createLoan = (req, res) => {
  const { customer_id, loan_amount, loan_period_years, interest_rate_yearly } = req.body;
  const interest = loan_amount * loan_period_years * (interest_rate_yearly / 100);
  const total = loan_amount + interest;
  const emi = total / (loan_period_years * 12);
  const loan_id = uuidv4();

  db.run(`INSERT INTO Loans VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [loan_id, customer_id, loan_amount, interest_rate_yearly, loan_period_years, total, emi, 'ACTIVE'],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      return res.status(201).json({
        loan_id,
        customer_id,
        total_amount_payable: total,
        monthly_emi: emi
      });
    });
};
exports.recordPayment = (req, res) => {
  const { loan_id } = req.params;
  const { amount, payment_type } = req.body;
  const payment_id = require('uuid').v4();

  // Save the payment
  const insert = `INSERT INTO Payments (payment_id, loan_id, amount, payment_type, payment_date)
                  VALUES (?, ?, ?, ?, datetime('now'))`;

  const updateLoan = `SELECT total_amount, monthly_emi FROM Loans WHERE loan_id = ?`;

  const sumPaid = `SELECT SUM(amount) as total_paid FROM Payments WHERE loan_id = ?`;

  db.run(insert, [payment_id, loan_id, amount, payment_type], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    db.get(updateLoan, [loan_id], (err, loan) => {
      if (err || !loan) return res.status(404).json({ error: "Loan not found" });

      db.get(sumPaid, [loan_id], (err, result) => {
        const paid = result?.total_paid || 0;
        const remaining = loan.total_amount - paid;
        const emis_left = Math.ceil(remaining / loan.monthly_emi);

        return res.status(200).json({
          payment_id,
          loan_id,
          message: "Payment recorded successfully.",
          remaining_balance: Number(remaining.toFixed(2)),
          emis_left
        });
      });
    });
  });
};

exports.getLedger = (req, res) => {
  const { loan_id } = req.params;

  const db = require('../db/database');

  const loanQuery = `SELECT * FROM Loans WHERE loan_id = ?`;
  const paymentsQuery = `SELECT * FROM Payments WHERE loan_id = ?`;
  const sumQuery = `SELECT SUM(amount) as amount_paid FROM Payments WHERE loan_id = ?`;

  db.get(loanQuery, [loan_id], (err, loan) => {
    if (err || !loan) return res.status(404).json({ error: "Loan not found" });

    db.all(paymentsQuery, [loan_id], (err, transactions) => {
      if (err) return res.status(500).json({ error: err.message });

      db.get(sumQuery, [loan_id], (err, sum) => {
        const amount_paid = sum?.amount_paid || 0;
        const balance_amount = loan.total_amount - amount_paid;
        const emis_left = Math.ceil(balance_amount / loan.monthly_emi);

        return res.status(200).json({
          loan_id: loan.loan_id,
          customer_id: loan.customer_id,
          principal: loan.principal_amount,
          total_amount: loan.total_amount,
          monthly_emi: loan.monthly_emi,
          amount_paid: Number(amount_paid.toFixed(2)),
          balance_amount: Number(balance_amount.toFixed(2)),
          emis_left,
          transactions
        });
      });
    });
  });
};
exports.getCustomerOverview = (req, res) => {
  const { customer_id } = req.params;
  const db = require('../db/database');

  const loansQuery = `SELECT * FROM Loans WHERE customer_id = ?`;
  const paymentsSumQuery = `SELECT loan_id, SUM(amount) as paid FROM Payments GROUP BY loan_id`;

  db.all(loansQuery, [customer_id], (err, loans) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!loans || loans.length === 0) return res.status(404).json({ error: "No loans found for customer" });

    db.all(paymentsSumQuery, [], (err, payments) => {
      if (err) return res.status(500).json({ error: err.message });

      const paymentMap = {};
      payments.forEach(p => {
        paymentMap[p.loan_id] = p.paid;
      });

      const overview = loans.map(loan => {
        const paid = paymentMap[loan.loan_id] || 0;
        const total_interest = loan.total_amount - loan.principal_amount;
        const balance = loan.total_amount - paid;
        const emis_left = Math.ceil(balance / loan.monthly_emi);

        return {
          loan_id: loan.loan_id,
          principal: loan.principal_amount,
          total_amount: loan.total_amount,
          total_interest,
          emi_amount: loan.monthly_emi,
          amount_paid: Number(paid.toFixed(2)),
          emis_left
        };
      });

      return res.status(200).json({
        customer_id,
        total_loans: loans.length,
        loans: overview
      });
    });
  });
};
