const express = require('express');
const User = require('../models/User');

// 初始化一副撲克牌
const createDeck = () => {
  const suits = ['♠', '♥', '♦', '♣'];
  const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck = [];
  
  for (let suit of suits) {
    for (let value of values) {
      deck.push({ suit, value });
    }
  }
  
  // 洗牌
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  
  return deck;
};

// 計算手牌點數
const calculateHand = (hand) => {
  let sum = 0;
  let aces = 0;
  
  for (let card of hand) {
    if (card.value === 'A') {
      aces += 1;
    } else if (['J', 'Q', 'K'].includes(card.value)) {
      sum += 10;
    } else {
      sum += parseInt(card.value);
    }
  }
  
  // 處理 A 牌
  for (let i = 0; i < aces; i++) {
    if (sum + 11 <= 21) {
      sum += 11;
    } else {
      sum += 1;
    }
  }
  
  return sum;
};

// 遊戲狀態
let gameState = {
  deck: [],
  playerHand: [],
  dealerHand: [],
  gameOver: false,
  message: '',
  betAmount: 0,
  winAmount: 0,
  playerId: null
};

// 開始新遊戲
const startGame = async (req, res) => {
  const { betAmount, playerId } = req.body;
  
  if (!betAmount || betAmount <= 0) {
    return res.status(400).json({ message: '無效的下注金額' });
  }

  try {
    const user = await User.findById(playerId);
    if (!user) {
      return res.status(404).json({ message: '用戶不存在' });
    }

    if (betAmount > user.balance) {
      return res.status(400).json({ message: '下注金額超過餘額' });
    }

    // 扣除下注金額
    user.balance -= betAmount;
    await user.save();

    gameState = {
      deck: createDeck(),
      playerHand: [],
      dealerHand: [],
      gameOver: false,
      message: '遊戲開始',
      betAmount,
      winAmount: 0,
      playerId
    };
    
    // 發初始牌
    gameState.playerHand.push(gameState.deck.pop());
    gameState.dealerHand.push(gameState.deck.pop());
    gameState.playerHand.push(gameState.deck.pop());
    gameState.dealerHand.push(gameState.deck.pop());
    
    res.json({ game: gameState, user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 要牌
const hit = async (req, res) => {
  if (gameState.gameOver) {
    return res.status(400).json({ message: 'Game Over' });
  }
  
  try {
    gameState.playerHand.push(gameState.deck.pop());
    const playerScore = calculateHand(gameState.playerHand);
    
    if (playerScore > 21) {
      gameState.gameOver = true;
      gameState.message = 'The cards are busted! The dealer wins!';
      gameState.winAmount = 0;

      // 更新用戶統計
      const user = await User.findById(gameState.playerId);
      user.totalGames += 1;
      await user.save();
    }
    
    res.json({ game: gameState, user: await User.findById(gameState.playerId) });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 停牌
const stand = async (req, res) => {
  if (gameState.gameOver) {
    return res.status(400).json({ message: 'Game Over' });
  }
  
  try {
    let dealerScore = calculateHand(gameState.dealerHand);
    const playerScore = calculateHand(gameState.playerHand);
    
    // 莊家要牌直到點數大於等於17
    while (dealerScore < 17) {
      gameState.dealerHand.push(gameState.deck.pop());
      dealerScore = calculateHand(gameState.dealerHand);
    }
    
    gameState.gameOver = true;
    
    // 更新用戶統計
    const user = await User.findById(gameState.playerId);
    user.totalGames += 1;
    
    if (dealerScore > 21) {
      gameState.message = 'The cards are busted! The player wins!';
      gameState.winAmount = gameState.betAmount * 2;
      user.balance += gameState.winAmount;
      user.wins += 1;
      if (gameState.winAmount > user.highestWin) {
        user.highestWin = gameState.winAmount;
      }
    } else if (dealerScore > playerScore) {
      gameState.message = 'Dealer Win！';
      gameState.winAmount = 0;
    } else if (dealerScore < playerScore) {
      gameState.message = 'Player Win！';
      gameState.winAmount = gameState.betAmount * 2;
      user.balance += gameState.winAmount;
      user.wins += 1;
      if (gameState.winAmount > user.highestWin) {
        user.highestWin = gameState.winAmount;
      }
    } else {
      gameState.message = 'Tie！';
      gameState.winAmount = gameState.betAmount;
      user.balance += gameState.winAmount;
    }
    
    await user.save();
    res.json({ game: gameState, user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  startGame,
  hit,
  stand
}; 