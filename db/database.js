const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/bank.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS Customers (
    customer_id TEXT PRIMARY KEY,
    name TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS Loans (
    loan_id TEXT PRIMARY KEY,
    customer_id TEXT,
    principal_amount REAL,
    interest_rate REAL,
    loan_period_years INTEGER,
    total_amount REAL,
    monthly_emi REAL,
    status TEXT,
    created_at TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS Payments (
    payment_id TEXT PRIMARY KEY,
    loan_id TEXT,
    amount REAL,
    payment_type TEXT,
    payment_date TEXT
  )`);
});

module.exports = db;
