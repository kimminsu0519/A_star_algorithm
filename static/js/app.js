/**
 * Main Web Application Controller & Renderer
 * Connects UI controls, Grid Canvas, and AStarEngine snapshots.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  let config = {
    rows: 6,
    cols: 6,
    start: { x: 1, y: 4 },
    goal: { x: 4, y: 1 },
    walls: new Set(["2,2", "2,3", "2,4"]),
    allowDiagonal: true,
    straightCost: 10,
    diagonalCost: 14,
    heuristicType: 'manhattan',
    preventCornerCutting: false
  };

  let editMode = 'wall'; // wall | start | goal
  let isMouseDown = false;
  let engine = null;
  let timeline = [];
  let currentStepIndex = 0;
  let isPlaying = false;
  let playTimer = null;
  let playbackSpeedMs = 300;

  // DOM Elements
  const gridBoard = document.getElementById('gridBoard');
  const presetSelect = document.getElementById('presetSelect');
  const heuristicSelect = document.getElementById('heuristicSelect');
  const allowDiagonalCheck = document.getElementById('allowDiagonalCheck');
  const straightCostInput = document.getElementById('straightCostInput');
  const diagonalCostInput = document.getElementById('diagonalCostInput');
  const speedSlider = document.getElementById('speedSlider');
  const speedValueLabel = document.getElementById('speedValueLabel');

  const btnPlay = document.getElementById('btnPlay');
  const btnNext = document.getElementById('btnNext');
  const btnPrev = document.getElementById('btnPrev');
  const btnReset = document.getElementById('btnReset');

  const modeWall = document.getElementById('modeWall');
  const modeStart = document.getElementById('modeStart');
  const modeGoal = document.getElementById('modeGoal');

  const statStepCount = document.getElementById('statStepCount');
  const statOpenCount = document.getElementById('statOpenCount');
  const statClosedCount = document.getElementById('statClosedCount');
  const statPathCost = document.getElementById('statPathCost');

  const logBox = document.getElementById('logBox');
  const openListTableBody = document.querySelector('#openListTable tbody');
  const closedListTableBody = document.querySelector('#closedListTable tbody');
  const cellDetailCard = document.getElementById('cellDetailCard');

  // Initialize App
  function init() {
    setupPresets();
    setupEventListeners();
    loadPreset('blogExample');
  }

  // Setup Presets Dropdown
  function setupPresets() {
    presetSelect.innerHTML = '';
    for (const [key, preset] of Object.entries(window.MAP_PRESETS)) {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = preset.name;
      presetSelect.appendChild(opt);
    }
  }

  // Load selected preset configuration
  function loadPreset(presetKey) {
    pauseAutoPlay();
    const p = window.MAP_PRESETS[presetKey];
    if (!p) return;

    config.rows = p.rows;
    config.cols = p.cols;
    config.start = { ...p.start };
    config.goal = { ...p.goal };
    config.walls = new Set(p.walls);

    recalculateSolution();
  }

  // Recalculate A* timeline snapshots
  function recalculateSolution() {
    engine = new window.AStarEngine(config);
    timeline = engine.solve();
    currentStepIndex = 0;
    renderStep(currentStepIndex);
  }

  // Event Listeners Setup
  function setupEventListeners() {
    presetSelect.addEventListener('change', (e) => loadPreset(e.target.value));

    heuristicSelect.addEventListener('change', (e) => {
      config.heuristicType = e.target.value;
      recalculateSolution();
    });

    allowDiagonalCheck.addEventListener('change', (e) => {
      config.allowDiagonal = e.target.checked;
      recalculateSolution();
    });

    straightCostInput.addEventListener('change', (e) => {
      config.straightCost = parseInt(e.target.value, 10) || 10;
      recalculateSolution();
    });

    diagonalCostInput.addEventListener('change', (e) => {
      config.diagonalCost = parseInt(e.target.value, 10) || 14;
      recalculateSolution();
    });

    speedSlider.addEventListener('input', (e) => {
      playbackSpeedMs = 1050 - parseInt(e.target.value, 10); // inverted: higher slider = faster
      speedValueLabel.textContent = `${playbackSpeedMs}ms`;
      if (isPlaying) {
        pauseAutoPlay();
        startAutoPlay();
      }
    });

    // Control Buttons
    btnPlay.addEventListener('click', toggleAutoPlay);
    btnNext.addEventListener('click', () => {
      pauseAutoPlay();
      stepNext();
    });
    btnPrev.addEventListener('click', () => {
      pauseAutoPlay();
      stepPrev();
    });
    btnReset.addEventListener('click', () => {
      pauseAutoPlay();
      currentStepIndex = 0;
      renderStep(currentStepIndex);
    });

    // Tool Modes
    modeWall.addEventListener('click', () => setEditMode('wall'));
    modeStart.addEventListener('click', () => setEditMode('start'));
    modeGoal.addEventListener('click', () => setEditMode('goal'));

    // Global Mouse up
    document.addEventListener('mouseup', () => { isMouseDown = false; });
  }

  function setEditMode(mode) {
    editMode = mode;
    [modeWall, modeStart, modeGoal].forEach(b => b.classList.remove('active'));
    if (mode === 'wall') modeWall.classList.add('active');
    if (mode === 'start') modeStart.classList.add('active');
    if (mode === 'goal') modeGoal.classList.add('active');
  }

  // Handle cell click / drag interaction
  function handleCellInteract(x, y) {
    pauseAutoPlay();
    const key = `${x},${y}`;

    if (editMode === 'start') {
      if (key !== `${config.goal.x},${config.goal.y}`) {
        config.start = { x, y };
        config.walls.delete(key);
      }
    } else if (editMode === 'goal') {
      if (key !== `${config.start.x},${config.start.y}`) {
        config.goal = { x, y };
        config.walls.delete(key);
      }
    } else if (editMode === 'wall') {
      if (key !== `${config.start.x},${config.start.y}` && key !== `${config.goal.x},${config.goal.y}`) {
        if (config.walls.has(key)) {
          config.walls.delete(key);
        } else {
          config.walls.add(key);
        }
      }
    }

    recalculateSolution();
  }

  // Step Controls
  function stepNext() {
    if (currentStepIndex < timeline.length - 1) {
      currentStepIndex++;
      renderStep(currentStepIndex);
    } else {
      pauseAutoPlay();
    }
  }

  function stepPrev() {
    if (currentStepIndex > 0) {
      currentStepIndex--;
      renderStep(currentStepIndex);
    }
  }

  function toggleAutoPlay() {
    if (isPlaying) {
      pauseAutoPlay();
    } else {
      startAutoPlay();
    }
  }

  function startAutoPlay() {
    isPlaying = true;
    btnPlay.innerHTML = '❚❚ Pause';
    btnPlay.classList.replace('btn-primary', 'btn-accent');
    playTimer = setInterval(() => {
      if (currentStepIndex < timeline.length - 1) {
        stepNext();
      } else {
        pauseAutoPlay();
      }
    }, playbackSpeedMs);
  }

  function pauseAutoPlay() {
    isPlaying = false;
    btnPlay.innerHTML = '▶ Play';
    btnPlay.classList.replace('btn-accent', 'btn-primary');
    if (playTimer) {
      clearInterval(playTimer);
      playTimer = null;
    }
  }

  // Render Grid and Inspector for a specific snapshot step index
  function renderStep(stepIdx) {
    const snap = timeline[stepIdx];
    if (!snap) return;

    // Update Stats
    statStepCount.textContent = `${stepIdx + 1} / ${timeline.length}`;
    statOpenCount.textContent = snap.openList.length;
    statClosedCount.textContent = snap.closedList.length;

    if (snap.path && snap.path.length > 0) {
      const lastPathNode = snap.nodeMap.get(`${config.goal.x},${config.goal.y}`);
      statPathCost.textContent = lastPathNode ? lastPathNode.f : 0;
    } else {
      statPathCost.textContent = snap.status === 'completed' ? '0' : '—';
    }

    // Render Grid Board
    gridBoard.style.gridTemplateColumns = `repeat(${config.cols}, 72px)`;
    gridBoard.style.gridTemplateRows = `repeat(${config.rows}, 72px)`;
    gridBoard.innerHTML = '';

    const openSetKeys = new Set(snap.openList.map(n => `${n.x},${n.y}`));
    const closedSetKeys = new Set(snap.closedList);
    const pathSetKeys = new Set(snap.path.map(p => `${p.x},${p.y}`));
    const currentKey = snap.currentNode ? `${snap.currentNode.x},${snap.currentNode.y}` : null;

    for (let r = 0; r < config.rows; r++) {
      for (let c = 0; c < config.cols; c++) {
        const key = `${c},${r}`;
        const cellEl = document.createElement('div');
        cellEl.className = 'cell';

        // Check special state classes
        if (c === config.start.x && r === config.start.y) {
          cellEl.classList.add('state-start');
        } else if (c === config.goal.x && r === config.goal.y) {
          cellEl.classList.add('state-goal');
        } else if (config.walls.has(key)) {
          cellEl.classList.add('state-wall');
        } else if (pathSetKeys.has(key)) {
          cellEl.classList.add('state-path');
        } else if (key === currentKey) {
          cellEl.classList.add('state-current');
        } else if (closedSetKeys.has(key)) {
          cellEl.classList.add('state-closed');
        } else if (openSetKeys.has(key)) {
          cellEl.classList.add('state-open');
        }

        // Retrieve calculated node values
        const nodeInfo = snap.nodeMap.get(key);
        if (nodeInfo && !config.walls.has(key)) {
          const topEl = document.createElement('div');
          topEl.className = 'cell-top';
          topEl.innerHTML = `<span class="cell-f">${nodeInfo.f}</span><span class="cell-coords">${c},${r}</span>`;

          const centerEl = document.createElement('div');
          centerEl.className = 'cell-center';
          if (nodeInfo.parentArrow && !(c === config.start.x && r === config.start.y)) {
            centerEl.innerHTML = `<span class="parent-arrow">${nodeInfo.parentArrow}</span>`;
          }

          const botEl = document.createElement('div');
          botEl.className = 'cell-bottom';
          botEl.innerHTML = `<span class="cell-g">${nodeInfo.g}</span><span class="cell-h">${nodeInfo.h}</span>`;

          cellEl.appendChild(topEl);
          cellEl.appendChild(centerEl);
          cellEl.appendChild(botEl);
        } else {
          const topEl = document.createElement('div');
          topEl.className = 'cell-top';
          topEl.innerHTML = `<span></span><span class="cell-coords">${c},${r}</span>`;
          cellEl.appendChild(topEl);
        }

        // Cell mouse interaction
        cellEl.addEventListener('mousedown', (e) => {
          isMouseDown = true;
          handleCellInteract(c, r);
        });
        cellEl.addEventListener('mouseenter', () => {
          if (isMouseDown) handleCellInteract(c, r);
          showCellHoverDetails(c, r, snap);
        });

        gridBoard.appendChild(cellEl);
      }
    }

    // Render Inspector Logs & Tables
    renderLogs(stepIdx);
    renderTables(snap);
  }

  // Render Step Log Entries
  function renderLogs(stepIdx) {
    logBox.innerHTML = '';
    for (let i = 0; i <= stepIdx; i++) {
      const snap = timeline[i];
      const logDiv = document.createElement('div');
      logDiv.className = 'log-entry';
      if (snap.status === 'completed') logDiv.classList.add('success');

      logDiv.innerHTML = `<strong>${snap.title}</strong><br>${snap.desc}`;
      logBox.appendChild(logDiv);
    }
    logBox.scrollTop = logBox.scrollHeight;
  }

  // Render Open and Closed list tables
  function renderTables(snap) {
    // Open List
    openListTableBody.innerHTML = '';
    const sortedOpen = [...snap.openList].sort((a, b) => a.f - b.f || a.h - b.h);
    sortedOpen.forEach(n => {
      const tr = document.createElement('tr');
      const pStr = n.parent ? `(${n.parent.x},${n.parent.y})` : 'None';
      tr.innerHTML = `<td>(${n.x},${n.y})</td><td><strong>${n.f}</strong></td><td>${n.g}</td><td>${n.h}</td><td>${pStr}</td>`;
      openListTableBody.appendChild(tr);
    });

    // Closed List
    closedListTableBody.innerHTML = '';
    snap.closedList.forEach(k => {
      const n = snap.nodeMap.get(k);
      if (n) {
        const tr = document.createElement('tr');
        const pStr = n.parent ? `(${n.parent.x},${n.parent.y})` : 'None';
        tr.innerHTML = `<td>(${n.x},${n.y})</td><td>${n.f}</td><td>${n.g}</td><td>${n.h}</td><td>${pStr}</td>`;
        closedListTableBody.appendChild(tr);
      }
    });
  }

  // Render Cell Detail Card on Hover
  function showCellHoverDetails(x, y, snap) {
    const key = `${x},${y}`;
    const node = snap.nodeMap.get(key);

    if (x === config.start.x && y === config.start.y) {
      cellDetailCard.innerHTML = `<div class="hover-detail"><span>Start Node (${x}, ${y})</span><br>Initial position where pathfinding originates. g=0, f=h.</div>`;
    } else if (x === config.goal.x && y === config.goal.y) {
      cellDetailCard.innerHTML = `<div class="hover-detail"><span>Target Node (${x}, ${y})</span><br>Destination node. Target heuristic h=0.</div>`;
    } else if (config.walls.has(key)) {
      cellDetailCard.innerHTML = `<div class="hover-detail"><span>Wall Obstacle (${x}, ${y})</span><br>Impassable node. Excluded from path search.</div>`;
    } else if (node) {
      const pStr = node.parent ? `(${node.parent.x}, ${node.parent.y})` : 'None';
      cellDetailCard.innerHTML = `
        <div class="hover-detail">
          <span>Cell (${x}, ${y}) Breakdown:</span><br>
          • <strong>Total f(n)</strong>: ${node.f} = g(${node.g}) + h(${node.h})<br>
          • <strong>g(n) Cost</strong>: ${node.g} (from Start)<br>
          • <strong>h(n) Heuristic</strong>: ${node.h} (${config.heuristicType} to Goal)<br>
          • <strong>Parent Node</strong>: ${pStr} (${node.parentArrow || 'None'})
        </div>
      `;
    } else {
      const hVal = engine ? engine.calcHeuristic(x, y) : 0;
      cellDetailCard.innerHTML = `<div class="hover-detail"><span>Unexplored Node (${x}, ${y})</span><br>Estimated h(n)=${hVal}. Not yet visited in current step.</div>`;
    }
  }

  init();
});
