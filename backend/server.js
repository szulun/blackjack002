require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// 連接數據庫
connectDB();

// 中間件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api/blackjack', require('./routes/blackjackRoutes'));
app.use('/api/users', require('./routes/userRoutes'));


app.get('/', (req, res) => {
  res.send('Backend is running!');
});
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 