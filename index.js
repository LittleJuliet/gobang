const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const radio = getPixelRatio(ctx);
canvas.width = 450 * radio;
canvas.height = 450 * radio;
canvas.style.width = '450px';
canvas.style.height = '450px';
ctx.scale(radio, radio);

function getPixelRatio(context) {
  const backingStore =
    context.backingStorePixelRatio ||
    context.webkitBackingStorePixelRatio ||
    context.mozBackingStorePixelRatio ||
    context.msBackingStorePixelRatio ||
    context.oBackingStorePixelRatio ||
    context.backingStorePixelRatio ||
    1;
  return (window.devicePixelRatio || 1) / backingStore;
}

let hasChess = []; // 二维数组,表示棋盘对应的位置是否已经下过棋 0:无棋 1:玩家棋(黑) 2:电脑棋(白)
let isPlayer = true; // 表示当前该玩家下还是电脑下 true:玩家 false:电脑
let done = false; // 表示已经有胜利者诞生,本局游戏结束
let wins = []; // 三位数组[i][j][k],i和j表示棋盘坐标,k表示下该点的赢法
let winCounts = 0; // 一共有多少种赢法
let playerWin = []; // 一维数组,表示某种赢法下有几颗棋连着,如果为5则表示胜利,6则表示已经不可能通过这种下发获胜
let pcWin = [];

window.onload = function () {
  drawChessBoard();
  initHasChess();
  initWins();
};

/**
 * 画棋盘 15*15
 * 每条线间隔30px,每个格子大小30*30px
 */
function drawChessBoard() {
  ctx.beginPath();
  for (let i = 0; i < 15; i++) {
    // 绘制横线
    ctx.moveTo(15, 15 + 30 * i);
    ctx.lineTo(435, 15 + 30 * i);

    // 绘制竖线
    ctx.moveTo(15 + 30 * i, 15);
    ctx.lineTo(15 + 30 * i, 435);
  }
  ctx.strokeStyle = '#666';
  ctx.stroke();
  ctx.closePath();

  // 画中心点的十字
  ctx.beginPath();
  ctx.moveTo(215, 225);
  ctx.lineTo(235, 225);
  ctx.moveTo(225, 215);
  ctx.lineTo(225, 235);
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#000';
  ctx.stroke();
  ctx.closePath();
}

/**
 * 将每个点的落子情况存入hasChess二维数组
 * 0表示没有棋落在此点
 * 1表示该点是玩家(黑)
 * 2表示该点是电脑(白)
 */
function initHasChess() {
  for (let i = 0; i < 15; i++) {
    hasChess[i] = [];
    for (let j = 0; j < 15; j++) {
      hasChess[i][j] = 0;
    }
  }
}

/**
 * 初始化所有赢法
 * 共572种赢法
 */
function initWins() {
  // 初始化wins
  for (let i = 0; i < 15; i++) {
    wins[i] = [];
    for (let j = 0; j < 15; j++) {
      wins[i][j] = [];
    }
  }

  // 竖着的五子相连
  for (let i = 0; i < 15; i++) {
    for (let j = 0; j < 11; j++) {
      for (let k = 0; k < 5; k++) {
        wins[i][j + k][winCounts] = true;
      }
      winCounts++;
    }
  }

  // 横着的五子相连
  for (let i = 0; i < 15; i++) {
    for (let j = 0; j < 11; j++) {
      for (let k = 0; k < 5; k++) {
        wins[j + k][i][winCounts] = true;
      }
      winCounts++;
    }
  }

  // 斜着的五子相连
  for (let i = 0; i < 11; i++) {
    for (let j = 0; j < 11; j++) {
      for (let k = 0; k < 5; k++) {
        wins[i + k][j + k][winCounts] = true;
      }
      winCounts++;
    }
  }

  // 反斜的五子相连
  for (let i = 14; i > 3; i--) {
    for (let j = 0; j < 11; j++) {
      for (let k = 0; k < 5; k++) {
        wins[i - k][j + k][winCounts] = true;
      }
      winCounts++;
    }
  }

  for (let i = 0; i <= winCounts; i++) {
    // 在每种赢法上的初始值为0,也就是这种赢法下有几个棋相连
    playerWin[i] = 0;
    pcWin[i] = 0;
  }
}

/**
 * 下棋
 */
function oneStep(i, j, player) {
  ctx.beginPath();
  // 通过位置得到棋对应的坐标 棋大小设置为13px
  ctx.arc(15 + 30 * i, 15 + 30 * j, 13, 0, Math.PI * 2);
  // 给棋子设置一个圆形渐变色 开始圆->结束圆
  const gradient = ctx.createRadialGradient(
    15 + 30 * i,
    15 + 30 * j,
    13,
    15 + 30 * i,
    15 + 30 * j,
    0
  );
  // 玩家执黑棋,电脑执白棋
  if (player) {
    gradient.addColorStop(0, '#0a0a0a');
    gradient.addColorStop(1, '#636766');
  } else {
    gradient.addColorStop(0, '#b1b1b1');
    gradient.addColorStop(1, '#f9f9f9');
  }
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.closePath();
}

// 玩家下棋
canvas.addEventListener('click', function (e) {
  // 已经结束
  if (done) return;
  // 当前由电脑下棋
  if (!isPlayer) return;
  // 通过点击的坐标计算得到落子的位置
  const x = e.offsetX;
  const y = e.offsetY;
  // 下棋点半径为15px的圈内表示点击的为该点
  const i = Math.floor(x / 30);
  const j = Math.floor(y / 30);

  // 如果此点还未有棋
  if (hasChess[i][j] == 0) {
    // 落子
    oneStep(i, j, true);
    // 记录棋子
    hasChess[i][j] = 1;

    // 便利该点的所有胜利情况
    for (let k = 0; k <= winCounts; k++) {
      // 如果该点有赢的可能性
      if (wins[i][j][k]) {
        playerWin[k]++; // 该点这种赢法下的棋加1
        pcWin[k] = 6; // 设置电脑在此点不可能胜利
        // 如果此种赢法下玩家有5个棋子相连
        if (playerWin[k] == 5) {
          setTimeout(() => {
            alert('恭喜你，你赢了！');
          }, 0);
          // 胜利者诞生,游戏结束
          done = true;
          break;
        }
      }
    }
    if (!done) {
      // 如果未结束,则轮到电脑下棋
      isPlayer = !isPlayer;
      pcClick();
    }
  }
});

// 电脑落子
function pcClick() {
  // 在每个位置落子的权重
  let playerScore = []; // 玩家的权重
  let pcScore = []; // 电脑的权重
  let maxScore = 0; // 最大权重
  // 落点坐标
  let u = 0;
  let v = 0;

  // 初始化每个点落子的权重
  for (let i = 0; i < 15; i++) {
    playerScore[i] = [];
    pcScore[i] = [];
    for (let j = 0; j < 15; j++) {
      // 初始为0
      playerScore[i][j] = 0;
      pcScore[i][j] = 0;
    }
  }

  // 计算出电脑落子的最佳位置
  for (let i = 0; i < 15; i++) {
    for (let j = 0; j < 15; j++) {
      // 如果此点未落子
      if (hasChess[i][j] == 0) {
        for (let k = 0; k <= winCounts; k++) {
          // 如果该点有赢的可能性
          if (wins[i][j][k]) {
            // 如果玩家在该赢法下已有1颗棋,则加200分
            if (playerWin[k] == 1) {
              playerScore[i][j] += 200;
            } else if (playerWin[k] == 2) {
              // 如果该赢法下已有2颗棋,则加400分
              playerScore[i][j] += 400;
            } else if (playerWin[k] == 3) {
              // 如果该赢法下已有3颗棋,则加2000分
              playerScore[i][j] += 2000;
            } else if (playerWin[k] == 4) {
              // 如果该赢法下已有4颗棋,则加10000分
              playerScore[i][j] += 10000;
            }

            // 当电脑下棋时优先考虑自己胜利的情况,其次阻挠玩家胜利,所以电脑自己赢的分数要高些
            // 如果电脑在该赢法下已有1颗棋,则加220分
            if (pcWin[k] == 1) {
              pcScore[i][j] += 220;
            } else if (pcWin[k] == 2) {
              // 如果电脑在该赢法下已有2颗棋,则加420分
              pcScore[i][j] += 420;
            } else if (pcWin[k] == 3) {
              // 如果电脑在该赢法下已有3颗棋,则加2100分
              pcScore[i][j] += 2100;
            } else if (pcWin[k] == 4) {
              // 如果电脑在该赢法下已有4颗棋,则加20000分
              pcScore[i][j] += 20000;
            }
          }
        }

        // 如果玩家下此点的权重比最大值大,则电脑下此点
        if (playerScore[i][j] > maxScore) {
          maxScore = playerScore[i][j];
          u = i;
          v = j;
        } else if (playerScore[i][j] == maxScore) {
          // 如果玩家下此点的权重与最大值相同,且电脑下此点比下前一点的权重大,则电脑下此点（优先考虑自己胜利）
          if (pcScore[i][j] > pcScore[u][v]) {
            u = i;
            v = j;
          }
        }

        // 如果电脑下此点的权重比最大值大,则电脑下此点
        if (pcScore[i][j] > maxScore) {
          maxScore = pcScore[i][j];
          u = i;
          v = j;
        } else if (pcScore[i][j] == maxScore) {
          // 如果电脑下此点的权重与最大值相同,且玩家下此点比下前一点的权重大,则电脑下此点（阻碍玩家胜利）
          if (playerScore[i][j] > playerScore[u][v]) {
            u = i;
            v = j;
          }
        }
      }
    }
  }

  // u,v就是电脑落子最大权重的位置
  oneStep(u, v, false);
  hasChess[u][v] = 2;

  for (let k = 0; k <= winCounts; k++) {
    // 如果该点有赢的可能性
    if (wins[u][v][k]) {
      pcWin[k]++; // 该点这种赢法下的棋加1
      playerWin[k] = 6; // 设置玩家在此点不可能胜利
      if (pcWin[k] == 5) {
        setTimeout(() => {
          alert('很遗憾，电脑赢！');
        }, 0);
        done = true;
        break;
      }
    }
  }

  if (!done) {
    isPlayer = !isPlayer;
  }
}
