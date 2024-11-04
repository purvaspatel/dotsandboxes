import React, { useState, useRef, useEffect } from 'react';
import { Trophy, RotateCcw, Users, PartyPopper, Medal } from 'lucide-react';

const DotsAndBoxes = () => {
  const GRID_SIZE = 10;
  const DOT_SIZE = 6;
  const [CELL_SIZE, setCellSize] = useState(50); // Dynamic cell size
  const CANVAS_PADDING = DOT_SIZE * 2;
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [scores, setScores] = useState({ 1: 0, 2: 0 });
  const [lines, setLines] = useState([]);
  const [boxes, setBoxes] = useState([]);
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const PLAYER_COLORS = {
    1: '#ef4444',
    2: '#3b82f6'
  };

  // Responsive canvas sizing
  const updateCanvasSize = () => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const maxWidth = Math.min(containerWidth - 32, 500); // Max width with padding
    const newCellSize = Math.floor(maxWidth / (GRID_SIZE - 1));
    
    setCellSize(newCellSize);
    
    if (canvasRef.current) {
      canvasRef.current.width = (GRID_SIZE - 1) * newCellSize + DOT_SIZE + (CANVAS_PADDING * 2);
      canvasRef.current.height = (GRID_SIZE - 1) * newCellSize + DOT_SIZE + (CANVAS_PADDING * 2);
    }
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      updateCanvasSize();
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial size

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Redraw when cell size changes
  useEffect(() => {
    drawGame();
  }, [CELL_SIZE, lines, boxes, dragStart, dragEnd]);

  const getWinner = () => {
    if (!gameOver) return null;
    if (scores[1] > scores[2]) return 1;
    if (scores[2] > scores[1]) return 2;
    return 'draw';
  };

  const handleRestart = () => {
    setCurrentPlayer(1);
    setScores({ 1: 0, 2: 0 });
    setLines([]);
    setBoxes([]);
    setGameOver(false);
  };

  const getLineKey = (start, end) => {
    const points = [
      [start.x, start.y],
      [end.x, end.y]
    ].sort((a, b) => a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]);
    return `${points[0][0]},${points[0][1]}-${points[1][0]},${points[1][1]}`;
  };

  const lineExists = (start, end) => {
    const key = getLineKey(start, end);
    return lines.some(line => getLineKey(line.start, line.end) === key);
  };

  const isValidLine = (start, end) => {
    const dx = Math.abs(start.x - end.x);
    const dy = Math.abs(start.y - end.y);
    return (dx === CELL_SIZE && dy === 0) || (dx === 0 && dy === CELL_SIZE);
  };

  const getNearestDot = (x, y) => {
    const dotX = Math.round((x - CANVAS_PADDING) / CELL_SIZE) * CELL_SIZE + CANVAS_PADDING;
    const dotY = Math.round((y - CANVAS_PADDING) / CELL_SIZE) * CELL_SIZE + CANVAS_PADDING;
    return { x: dotX, y: dotY };
  };

  const checkForBoxes = (newLine) => {
    let boxesCompleted = 0;
    const newBoxes = [];
    const lineKey = getLineKey(newLine.start, newLine.end);
    
    const doesBoxExist = (topLeft) => {
      const top = getLineKey(
        { x: topLeft.x, y: topLeft.y },
        { x: topLeft.x + CELL_SIZE, y: topLeft.y }
      );
      const right = getLineKey(
        { x: topLeft.x + CELL_SIZE, y: topLeft.y },
        { x: topLeft.x + CELL_SIZE, y: topLeft.y + CELL_SIZE }
      );
      const bottom = getLineKey(
        { x: topLeft.x, y: topLeft.y + CELL_SIZE },
        { x: topLeft.x + CELL_SIZE, y: topLeft.y + CELL_SIZE }
      );
      const left = getLineKey(
        { x: topLeft.x, y: topLeft.y },
        { x: topLeft.x, y: topLeft.y + CELL_SIZE }
      );

      const existingLines = [...lines, newLine].map(l => getLineKey(l.start, l.end));
      
      return existingLines.includes(top) &&
             existingLines.includes(right) &&
             existingLines.includes(bottom) &&
             existingLines.includes(left);
    };

    if (newLine.start.x === newLine.end.x) {
      const x = newLine.start.x;
      const y = Math.min(newLine.start.y, newLine.end.y);
      
      if (x > CANVAS_PADDING) {
        const leftBox = { x: x - CELL_SIZE, y };
        if (doesBoxExist(leftBox)) {
          boxesCompleted++;
          newBoxes.push({
            x: leftBox.x,
            y: leftBox.y,
            player: currentPlayer
          });
        }
      }
      
      if (x < (GRID_SIZE - 1) * CELL_SIZE + CANVAS_PADDING) {
        const rightBox = { x, y };
        if (doesBoxExist(rightBox)) {
          boxesCompleted++;
          newBoxes.push({
            x: rightBox.x,
            y: rightBox.y,
            player: currentPlayer
          });
        }
      }
    } else {
      const x = Math.min(newLine.start.x, newLine.end.x);
      const y = newLine.start.y;
      
      if (y > CANVAS_PADDING) {
        const topBox = { x, y: y - CELL_SIZE };
        if (doesBoxExist(topBox)) {
          boxesCompleted++;
          newBoxes.push({
            x: topBox.x,
            y: topBox.y,
            player: currentPlayer
          });
        }
      }
      
      if (y < (GRID_SIZE - 1) * CELL_SIZE + CANVAS_PADDING) {
        const bottomBox = { x, y };
        if (doesBoxExist(bottomBox)) {
          boxesCompleted++;
          newBoxes.push({
            x: bottomBox.x,
            y: bottomBox.y,
            player: currentPlayer
          });
        }
      }
    }

    if (boxesCompleted > 0) {
      setBoxes(prev => [...prev, ...newBoxes]);
      setScores(prev => ({
        ...prev,
        [currentPlayer]: prev[currentPlayer] + boxesCompleted
      }));
      return true;
    }
    return false;
  };

  // Touch event handlers
  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    setDragStart(getNearestDot(x, y));
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (!dragStart) return;
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    setDragEnd(getNearestDot(x, y));
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    if (dragStart && dragEnd && isValidLine(dragStart, dragEnd) && !lineExists(dragStart, dragEnd)) {
      const newLine = {
        start: dragStart,
        end: dragEnd,
        player: currentPlayer
      };
      
      setLines(prev => [...prev, newLine]);
      
      const completedBox = checkForBoxes(newLine);
      
      if (!completedBox) {
        setCurrentPlayer(current => current === 1 ? 2 : 1);
      }
    }
    
    setDragStart(null);
    setDragEnd(null);
  };

  // Mouse event handlers
  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDragStart(getNearestDot(x, y));
  };

  const handleMouseMove = (e) => {
    if (!dragStart) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDragEnd(getNearestDot(x, y));
  };

  const handleMouseUp = () => {
    if (dragStart && dragEnd && isValidLine(dragStart, dragEnd) && !lineExists(dragStart, dragEnd)) {
      const newLine = {
        start: dragStart,
        end: dragEnd,
        player: currentPlayer
      };
      
      setLines(prev => [...prev, newLine]);
      
      const completedBox = checkForBoxes(newLine);
      
      if (!completedBox) {
        setCurrentPlayer(current => current === 1 ? 2 : 1);
      }
    }
    
    setDragStart(null);
    setDragEnd(null);
  };

  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw dots with padding
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        ctx.beginPath();
        ctx.arc(
          i * CELL_SIZE + CANVAS_PADDING, 
          j * CELL_SIZE + CANVAS_PADDING, 
          DOT_SIZE / 2, 
          0, 
          2 * Math.PI
        );
        ctx.fillStyle = 'white';
        ctx.fill();
      }
    }

    // Draw boxes
    boxes.forEach(box => {
      ctx.fillStyle = box.player === 1 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)';
      ctx.fillRect(box.x, box.y, CELL_SIZE, CELL_SIZE);
    });

    // Draw lines
    lines.forEach(line => {
      ctx.beginPath();
      ctx.moveTo(line.start.x, line.start.y);
      ctx.lineTo(line.end.x, line.end.y);
      ctx.strokeStyle = PLAYER_COLORS[line.player];
      ctx.lineWidth = 4;
      ctx.stroke();
    });

    // Draw drag line
    if (dragStart && dragEnd) {
      ctx.beginPath();
      ctx.moveTo(dragStart.x, dragStart.y);
      ctx.lineTo(dragEnd.x, dragEnd.y);
      ctx.strokeStyle = isValidLine(dragStart, dragEnd) ? PLAYER_COLORS[currentPlayer] : '#999';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-8 shadow-2xl">
          <div className="flex flex-col lg:flex-row items-center gap-4 sm:gap-8">
            <div className="bg-white/5 rounded-xl p-4 sm:p-6 w-full lg:w-auto" ref={containerRef}>
              <canvas
                ref={canvasRef}
                className="touch-none cursor-pointer mx-auto"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              />
            </div>

            <div className="flex flex-col gap-4 sm:gap-6 w-full lg:w-64">
              <div className="text-center mb-4 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 flex items-center justify-center gap-3">
                  <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400" />
                  Dots and Boxes
                </h2>
                <p className="text-sm sm:text-base text-gray-400">Connect the dots to create boxes and win!</p>
              </div>

              <div className="space-y-4">
                <div className={`p-4 rounded-lg transition-all ${
                  currentPlayer === 1 
                    ? 'bg-red-500/20 ring-2 ring-red-500' 
                    : 'bg-white/5'
                }`}>
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-red-500" />
                    <span className="text-red-500 font-semibold">Player 1</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-white mt-2">{scores[1]} points</div>
                </div>

                <div className={`p-4 rounded-lg transition-all ${
                  currentPlayer === 2 
                    ? 'bg-blue-500/20 ring-2 ring-blue-500' 
                    : 'bg-white/5'
                }`}>
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-blue-500" />
                    <span className="text-blue-500 font-semibold">Player 2</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-white mt-2">{scores[2]} points</div>
                </div>
              </div>

              <button
                onClick={handleRestart}
                className="flex items-center justify-center gap-2 w-full bg-white/10 hover:bg-white/20 text-white py-2 sm:py-3 px-4 rounded-lg transition-all text-sm sm:text-base"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                Reset Game
              </button>

              {/* Game completion modal */}
              {gameOver && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                  <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 max-w-sm w-full text-center">
                    <div className="mb-4">
                      {getWinner() === 'draw' ? (
                        <div className="flex justify-center mb-4">
                          <Medal className="w-16 h-16 text-yellow-400" />
                        </div>
                      ) : (
                        <div className="flex justify-center mb-4">
                          <PartyPopper className="w-16 h-16 text-yellow-400" />
                        </div>
                      )}
                      <h3 className="text-2xl font-bold text-white mb-2">
                        {getWinner() === 'draw' 
                          ? "It's a Draw!" 
                          : `Player ${getWinner()} Wins!`}
                      </h3>
                      <p className="text-gray-300">
                        {getWinner() === 'draw' 
                          ? "Both players played excellently!"
                          : "Congratulations on your victory!"}
                      </p>
                    </div>
                    <div className="flex justify-center gap-4">
                      <button
                        onClick={handleRestart}
                        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg transition-all"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Play Again
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DotsAndBoxes;