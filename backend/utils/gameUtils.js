const axios = require('axios');

let deckId = null;

// 初始化牌組
const initializeDeck = async () => {
  try {
    const response = await axios.get('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1');
    deckId = response.data.deck_id;
    return deckId;
  } catch (error) {
    console.error('Error initializing deck:', error);
    throw error;
  }
};

// 抽牌
const drawCard = async (count = 1) => {
  try {
    if (!deckId) {
      await initializeDeck();
    }
    const response = await axios.get(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=${count}`);
    return response.data.cards;
  } catch (error) {
    console.error('Error drawing cards:', error);
    throw error;
  }
};

// 計算手牌點數
const calculateHand = (hand) => {
  let score = 0;
  let aces = 0;

  for (const card of hand) {
    if (card.value === 'ACE') {
      aces += 1;
    } else if (['KING', 'QUEEN', 'JACK'].includes(card.value)) {
      score += 10;
    } else {
      score += parseInt(card.value);
    }
  }

  // 處理 A
  for (let i = 0; i < aces; i++) {
    if (score + 11 <= 21) {
      score += 11;
    } else {
      score += 1;
    }
  }

  return score;
};

module.exports = {
  initializeDeck,
  drawCard,
  calculateHand
}; 