// Rules of the reward game. Only the tests import fits and GAME_PIECES.
import { pick } from "./common.js";

// ---------- reward game "Klötzli-Regen" ----------
// True only when each of the 15 problems has the result "first": right at the first try, without a hint before.
export function earnsGame(mix) {
  return mix.log.length === mix.n && mix.log.every(entry => entry.result === "first");
}

export const GAME_COLS = 8;
export const GAME_ROWS = 14;
export const GAME_MINUTES = 5;
const ROW_POINTS = [0, 10, 30, 60];
export const GAME_PIECES = [
  { id: "zweier", cells: [[0, 0], [0, 1]] },
  { id: "dreier", cells: [[0, 0], [0, 1], [0, 2]] },
  { id: "ecke", cells: [[0, 0], [1, 0], [1, 1]] },
  { id: "wuerfel", cells: [[0, 0], [0, 1], [1, 0], [1, 1]] }
];

function startGamePiece(game) {
  const shape = pick(GAME_PIECES);
  const width = Math.max(...shape.cells.map(([r, c]) => c)) + 1;
  game.piece = { id: shape.id, cells: shape.cells, row: 0, col: Math.floor((GAME_COLS - width) / 2) };
  if (!fits(game.board, game.piece)) game.over = true;
}

export function newGame() {
  const board = Array.from({ length: GAME_ROWS }, () => Array(GAME_COLS).fill(null));
  const game = { board, piece: null, rows: 0, points: 0, over: false };
  startGamePiece(game);
  return game;
}

export function fits(board, piece) {
  return piece.cells.every(([r, c]) => {
    const row = piece.row + r;
    const col = piece.col + c;
    return row >= 0 && row < GAME_ROWS && col >= 0 && col < GAME_COLS && board[row][col] === null;
  });
}

export function gameMove(game, dCol) {
  if (game.over) return;
  const moved = { ...game.piece, col: game.piece.col + dCol };
  if (fits(game.board, moved)) game.piece = moved;
}

export function gameTurn(game) {
  if (game.over) return;
  const height = Math.max(...game.piece.cells.map(([r, c]) => r)) + 1;
  const cells = game.piece.cells.map(([r, c]) => [c, height - 1 - r]);
  for (const step of [0, -1, 1]) {
    const turned = { ...game.piece, cells, col: game.piece.col + step };
    if (fits(game.board, turned)) {
      game.piece = turned;
      return;
    }
  }
}

function landGamePiece(game) {
  for (const [r, c] of game.piece.cells) {
    game.board[game.piece.row + r][game.piece.col + c] = game.piece.id;
  }
  const board = game.board.filter(row => row.includes(null));
  const cleared = GAME_ROWS - board.length;
  for (let n = 0; n < cleared; n++) board.unshift(Array(GAME_COLS).fill(null));
  game.board = board;
  game.rows += cleared;
  game.points += ROW_POINTS[cleared];
  startGamePiece(game);
  return cleared;
}

export function gameDown(game) {
  if (game.over) return 0;
  const moved = { ...game.piece, row: game.piece.row + 1 };
  if (fits(game.board, moved)) {
    game.piece = moved;
    return 0;
  }
  return landGamePiece(game);
}

export function gameDrop(game) {
  if (game.over) return 0;
  let moved = { ...game.piece, row: game.piece.row + 1 };
  while (fits(game.board, moved)) {
    game.piece = moved;
    moved = { ...game.piece, row: game.piece.row + 1 };
  }
  return landGamePiece(game);
}

export function dropInterval(rows) {
  return Math.max(300, Math.round(900 * 0.85 ** Math.floor(rows / 5)));
}
