const express = require('express');
const router = express.Router();
const { startGame, hit, stand } = require('../controllers/blackjackController');

router.post('/start', startGame);
router.post('/hit', hit);
router.post('/stand', stand);

module.exports = router; 