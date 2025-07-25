const express = require('express');
const loanRoutes = require('./routes/loanRoutes');

const app = express();
app.use(express.json());
app.use('/api/v1', loanRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
