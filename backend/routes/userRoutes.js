const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// 註冊新用戶
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 檢查用戶名是否已存在
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: '用戶名已存在' });
    }

    // 加密密碼
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 創建新用戶
    const user = await User.create({
      username,
      password: hashedPassword
    });

    res.status(201).json({
      message: '註冊成功',
      user: {
        id: user._id,
        username: user.username,
        balance: user.balance
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 用戶登入
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 查找用戶
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: '用戶名或密碼錯誤' });
    }

    // 驗證密碼
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: '用戶名或密碼錯誤' });
    }

    res.json({
      message: '登入成功',
      user: {
        id: user._id,
        username: user.username,
        balance: user.balance
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 獲取排行榜
router.get('/leaderboard', async (req, res) => {
  console.log("Hello")
  try {
    console.log('收到獲取排行榜請求');
    const users = await User.find()
      .select('username balance wins totalGames highestWin')
      .sort({ balance: -1 }).limit(2);
    console.log('從資料庫獲取的排行榜用戶數據:', users);
    res.json(users);
  } catch (error) {
    res.status(400).json({ message: error.message });
   }
});


// 獲取用戶信息
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: '用戶不存在' });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 更新用戶餘額
router.put('/:id/balance', async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: '用戶不存在' });
    }
    user.balance += amount;
    if (amount > 0 && amount > user.highestWin) {
      user.highestWin = amount;
    }
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
router.get('/test', async (req, res) => {
  console.log("Hello")
});



module.exports = router; 