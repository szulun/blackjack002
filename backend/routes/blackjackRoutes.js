const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const User = require('../models/User');
const { initializeDeck, drawCard, calculateHand } = require('../utils/gameUtils');

// 開始新遊戲
router.post('/start', async (req, res) => {
  try {
    const { playerId, betAmount } = req.body;
    console.log('收到遊戲開始請求，玩家ID:', playerId, '下注金額:', betAmount);

    // 臨時代碼：刪除該玩家所有未完成的遊戲記錄
    await Game.deleteMany({ playerId, gameOver: false });
    console.log('已刪除玩家未完成的遊戲記錄');

    // 檢查用戶餘額
    const user = await User.findById(playerId);
    if (!user) {
      // return res.status(404).json({ message: '用戶不存在' });
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('找到用戶:', user.username, '餘額:', user.balance);

    if (user.balance < betAmount) {
      // return res.status(400).json({ message: '餘額不足' });
      return res.status(400).json({ message: 'Insufficient balance' });
    }
    console.log('餘額充足');

    // 檢查是否有未完成的遊戲
    const existingGame = await Game.findOne({ 
      playerId, 
      gameOver: false 
    });

    if (existingGame) {
      return res.status(400).json({ 
        message: 'You have an unfinished game, please complete it first' 
      });
    }

    // 初始化新牌組
    console.log('正在初始化牌組...');
    await initializeDeck();
    console.log('牌組初始化完成');

    // 抽初始牌
    console.log('正在抽初始牌...');
    const playerHand = await drawCard(2);
    const dealerHand = await drawCard(2);
    console.log('初始牌抽取完成', '玩家手牌:', playerHand, '莊家手牌:', dealerHand);

    // 創建新的遊戲記錄
    console.log('正在創建新的遊戲記錄...');
    const game = await Game.create({
      playerId,
      playerHand,
      dealerHand,
      betAmount,
      gameOver: false,
      message: 'Game started'
    });
    console.log('新的遊戲記錄創建完成', '遊戲ID:', game._id);

    // 扣除下注金額
    console.log('正在扣除下注金額并保存用戶...');
    user.balance -= betAmount;
    user.totalGames += 1;
    await user.save();
    console.log('用戶數據更新完成');

    console.log('遊戲開始成功，返回遊戲和用戶數據');
    res.json({ game, user });
  } catch (error) {
    console.error('遊戲開始請求處理失敗:', error);
    res.status(400).json({ message: error.message });
  }
});

// 要牌
router.post('/hit', async (req, res) => {
  try {
    const { gameId } = req.body;
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: '遊戲不存在' });
    }
    if (game.gameOver) {
      return res.status(400).json({ message: '遊戲已結束' });
    }

    const newCard = await drawCard(1);
    game.playerHand.push(newCard[0]);
    const playerScore = calculateHand(game.playerHand);

    if (playerScore > 21) {
      game.gameOver = true;
      game.message = 'Bust! Dealer wins!';
      game.winAmount = 0;
    }

    await game.save();

    // 獲取用戶信息
    const user = await User.findById(game.playerId);
    
    res.json({ game, user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 停牌
router.post('/stand', async (req, res) => {
  try {
    const { gameId } = req.body;
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: '遊戲不存在' });
    }
    if (game.gameOver) {
      return res.status(400).json({ message: '遊戲已結束' });
    }

    let dealerScore = calculateHand(game.dealerHand);
    const playerScore = calculateHand(game.playerHand);

    while (dealerScore < 17) {
      const newCard = await drawCard(1);
      game.dealerHand.push(newCard[0]);
      dealerScore = calculateHand(game.dealerHand);
    }

    game.gameOver = true;

    if (dealerScore > 21) {
      game.message = 'The cards are busted! The player wins!！';
      game.winAmount = game.betAmount * 2;
    } else if (dealerScore > playerScore) {
      game.message = 'Dealer win！';
      game.winAmount = 0;
    } else if (dealerScore < playerScore) {
      game.message = 'Player win！';
      game.winAmount = game.betAmount * 2;
    } else {
      game.message = 'Tie！';
      game.winAmount = game.betAmount;
    }

    await game.save();

    // 更新用戶數據
    const user = await User.findById(game.playerId);
    user.balance += game.winAmount;
    if (game.winAmount > game.betAmount) {
      user.wins += 1;
      if (game.winAmount > user.highestWin) {
        user.highestWin = game.winAmount;
      }
    }
    await user.save();

    res.json({ game, user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 終止遊戲
router.post('/surrender', async (req, res) => {
  try {
    const { gameId } = req.body;
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: 'Game not exist' });
    }
    if (game.gameOver) {
      return res.status(400).json({ message: 'Game Over' });
    }

    // 終止遊戲，返還一半下注金額
    game.gameOver = true;
    game.message = 'Player terminate game';
    game.winAmount = Math.floor(game.betAmount / 2);
    await game.save();

    // 更新用戶數據
    const user = await User.findById(game.playerId);
    user.balance += game.winAmount;
    await user.save();

    res.json({ game, user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 獲取遊戲歷史
router.get('/history/:playerId', async (req, res) => {
  try {
    const games = await Game.find({ playerId: req.params.playerId })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(games);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 