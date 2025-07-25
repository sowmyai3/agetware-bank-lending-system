# Bank Lending System API

Backend system built with Node.js, Express, and SQLite to simulate lending operations in a bank.

## Features
- Create Loans (`POST /api/v1/loans`)
- Record Payments (`POST /api/v1/loans/:loan_id/payments`)
- View Loan Ledger (`GET /api/v1/loans/:loan_id/ledger`)
- Customer Loan Overview (`GET /api/v1/customers/:customer_id/overview`)

## How to Run

```bash
npm install
node app.js
