import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [betAmount, setBetAmount] = useState(10);
  const [balance, setBalance] = useState(1000);
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // 檢查本地存儲中是否有用戶ID
    const savedUserId = localStorage.getItem('userId');
    if (savedUserId) {
      setUserId(savedUserId);
      fetchUserData(savedUserId);
    }
    // 獲取排行榜數據
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/users/leaderboard');
      const data = await res.json();
      // 確保 data 是數組
      setLeaderboard(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLeaderboard([]);
    }
  };

  const fetchUserData = async (id) => {
    try {
      const res = await fetch(`http://localhost:4000/api/users/${id}`);
      const user = await res.json();
      setBalance(user.balance);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:4000/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      
      if (response.ok) {
        setUserId(data.user.id);
        setBalance(data.user.balance);
        setIsLoggedIn(true);
        setMessage('Registration successful!');
      } else {
        setMessage(data.message || 'Registration failed');
      }
    } catch (error) {
      setMessage('Registration failed, please try again later');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:4000/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      
      if (response.ok) {
        setUserId(data.user.id);
        setBalance(data.user.balance);
        setIsLoggedIn(true);
        setMessage('Login successful!');
      } else {
        setMessage(data.message || 'Login failed');
      }
    } catch (error) {
      setMessage('Login failed, please try again later');
    }
  };

  const startGame = async () => {
    if (!userId) {
      alert('Please register first!');
      return;
    }
    if (betAmount > balance) {
      alert('Bet amount cannot exceed balance!');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/blackjack/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          playerId: userId,
          betAmount 
        }),
      });
      const data = await res.json();
      if (data.game && data.user) {
        setGameState(data.game);
        console.log('前端更新 gameState:', data.game);
        setBalance(data.user.balance);
      } else {
        alert('Game start failed, please try again!');
      }
    } catch (error) {
      console.error('Error starting game:', error);
      alert('Game start failed, please try again!');
    }
    setLoading(false);
  };

  const hit = async () => {
    if (!gameState?._id) return;
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/blackjack/hit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameId: gameState._id }),
      });
      const data = await res.json();
      setGameState(data.game);
      if (data.user) {
        setBalance(data.user.balance);
      }
    } catch (error) {
      console.error('Error hitting:', error);
    }
    setLoading(false);
  };

  const stand = async () => {
    if (!gameState?._id) return;
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/blackjack/stand', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameId: gameState._id }),
      });
      const data = await res.json();
      setGameState(data.game);
      if (data.user) {
        setBalance(data.user.balance);
      }
      if (data.leaderboard) {
        setLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error('Error standing:', error);
    }
    setLoading(false);
  };

  const surrender = async () => {
    if (!gameState?._id) return;
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/blackjack/surrender', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameId: gameState._id }),
      });
      const data = await res.json();
      setGameState(data.game);
      if (data.user) {
        setBalance(data.user.balance);
      }
    } catch (error) {
      console.error('Error surrendering:', error);
    }
    setLoading(false);
  };

  const renderCard = (card) => {
    if (!card) return null;
    console.log('渲染卡牌:', card);
    // Use a placeholder image source for testing
    // const placeholderImageSrc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='; // A 1x1 transparent pixel

    return (
      <div className="card" key={card.code}>
        <img
          src={card.image} // Restore Original image source
          // src={placeholderImageSrc} // Use placeholder for testing
          alt={`${card.value} of ${card.suit}`}
          style={{ width: '100px', height: '140px' }}
        />
      </div>
    );
  };

  return (
    <div className="App">
      <h1>Blackjack</h1>
      
      {!isLoggedIn ? (
        <div className="auth-container">
          <h2>{isRegistering ? 'Register' : 'Login'}</h2>
          <form onSubmit={isRegistering ? handleRegister : handleLogin}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">{isRegistering ? 'Register' : 'Login'}</button>
          </form>
          <button 
            className="switch-auth-btn"
            onClick={() => setIsRegistering(!isRegistering)}
          >
            {isRegistering ? 'Already have an account? Login' : 'No account? Register'}
          </button>
          {message && <p className="message">{message}</p>}
        </div>
      ) : (
        <div className="game-container">
          <div className="user-info">
            <p>Username: {username}</p>
            <p>Balance: ${balance}</p>
            <button 
              className="logout-btn"
              onClick={() => {
                setIsLoggedIn(false);
                setUserId(null);
                setGameState(null);
                setUsername('');
                setPassword('');
              }}
            >
              Logout
            </button>
          </div>
          
          {!gameState ? (
            <div className="start-game">
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                min="1"
                max={balance}
              />
              <button onClick={startGame} disabled={loading}>
                Start Game
              </button>
            </div>
          ) : (
            <div className="game-board">
              {/* 臨時顯示 gameState 的 JSON 字符串 */}
              {/* <pre>{JSON.stringify(gameState, null, 2)}</pre> */}

              <div className="dealer-hand">
                <h3>Dealer</h3>
                <div className="cards-container">
                  {gameState?.dealerHand && Array.isArray(gameState.dealerHand) && gameState.dealerHand.map((card, index) => (
                    <div key={index} className="card-wrapper">
                      {renderCard(card)}
                    </div>
                  ))}
                </div>
              </div>
              <div className="player-hand">
                <h3>Player</h3>
                <div className="cards-container">
                  {gameState?.playerHand && Array.isArray(gameState.playerHand) && gameState.playerHand.map((card, index) => (
                    <div key={index} className="card-wrapper">
                      {renderCard(card)}
                    </div>
                  ))}
                </div>
              </div>
              <div className="game-message">{gameState.message}</div>
              {!gameState.gameOver && (
                <div className="game-controls">
                  <button onClick={hit} disabled={loading}>
                    Hit
                  </button>
                  <button onClick={stand} disabled={loading}>
                    Stand
                  </button>
                  <button onClick={surrender} disabled={loading} className="surrender-btn">
                    Surrender
                  </button>
                </div>
              )}
              {gameState.gameOver && (
                <button onClick={() => setGameState(null)}>
                  New Game
                </button>
              )}
            </div>
          )}
          
          <button 
            className="leaderboard-btn"
            onClick={() => {
              setShowLeaderboard(!showLeaderboard);
              if (!showLeaderboard) {
                fetchLeaderboard();
              }
            }}
          >
            {showLeaderboard ? 'Hide Leaderboard' : 'Show Leaderboard'}
          </button>
          
          {showLeaderboard && (
            <div className="leaderboard">
              <h2>Leaderboard</h2>
              {leaderboard.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Player</th>
                      <th>Highest Win</th>
                      <th>Wins</th>
                      <th>Total Games</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((user, index) => (
                      <tr key={user._id} className={user._id === userId ? 'current-user' : ''}>
                        <td>{index + 1}</td>
                        <td>{user.username}</td>
                        <td>${user.highestWin}</td>
                        <td>{user.wins}</td>
                        <td>{user.totalGames}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No data available</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
