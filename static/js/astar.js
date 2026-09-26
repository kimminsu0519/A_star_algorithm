/**
 * A* Pathfinding Engine matching recall.tistory.com/40
 * Produces step-by-step state snapshots for visualization and verification.
 */

class AStarEngine {
  constructor(config = {}) {
    this.rows = config.rows || 10;
    this.cols = config.cols || 10;
    this.start = config.start || { x: 1, y: 1 };
    this.goal = config.goal || { x: 4, y: 4 };
    this.walls = new Set(config.walls || []);
    this.allowDiagonal = config.allowDiagonal !== undefined ? config.allowDiagonal : true;
    this.straightCost = config.straightCost || 10;
    this.diagonalCost = config.diagonalCost || 14;
    this.heuristicType = config.heuristicType || 'manhattan'; // manhattan | euclidean | chebyshev
    this.preventCornerCutting = config.preventCornerCutting || false;

    // Snapshot timeline
    this.steps = [];
  }

  // Key generator for cell coordinates
  key(x, y) {
    return `${x},${y}`;
  }

  // Calculate Heuristic h(n)
  calcHeuristic(x, y) {
    const dx = Math.abs(x - this.goal.x);
    const dy = Math.abs(y - this.goal.y);

    if (this.heuristicType === 'euclidean') {
      return Math.round(Math.sqrt(dx * dx + dy * dy) * 10);
    } else if (this.heuristicType === 'chebyshev') {
      return Math.max(dx, dy) * this.straightCost;
    } else {
      // Default: Manhattan distance as used in the blog post
      return (dx + dy) * this.straightCost;
    }
  }

  // Determine parent arrow direction symbol pointing FROM child TO parent
  calcParentDirection(childX, childY, parentX, parentY) {
    if (parentX === undefined || parentY === undefined) return '';
    const dx = parentX - childX;
    const dy = parentY - childY;

    if (dx === 0 && dy === -1) return '↑';
    if (dx === 1 && dy === -1) return '↗';
    if (dx === 1 && dy === 0) return '→';
    if (dx === 1 && dy === 1) return '↘';
    if (dx === 0 && dy === 1) return '↓';
    if (dx === -1 && dy === 1) return '↙';
    if (dx === -1 && dy === 0) return '←';
    if (dx === -1 && dy === -1) return '↖';
    return '';
  }

  // Run solver and record step snapshots
  solve() {
    this.steps = [];

    const openList = new Map(); // key -> node
    const closedList = new Set();
    const nodeMap = new Map(); // key -> node details

    // Create Start Node
    const startKey = this.key(this.start.x, this.start.y);
    const startH = this.calcHeuristic(this.start.x, this.start.y);
    const startNode = {
      x: this.start.x,
      y: this.start.y,
      g: 0,
      h: startH,
      f: startH,
      parent: null,
      parentArrow: ''
    };

    openList.set(startKey, startNode);
    nodeMap.set(startKey, startNode);

    // Snapshot 0: Initial Start Node added to Open List (Blog Step 1)
    this.recordSnapshot({
      stepNum: 1,
      title: "Step 1: Add Start Node to Open List",
      desc: `Add Start node (${this.start.x}, ${this.start.y}) to Open List with g=0, h=${startH}, f=${startH}.`,
      currentNode: startNode,
      openList: Array.from(openList.values()),
      closedList: Array.from(closedList),
      nodeMap: new Map(nodeMap),
      status: 'searching'
    });

    let stepCounter = 2;
    let pathFound = false;
    let goalNodeRef = null;

    while (openList.size > 0) {
      // Step (1/4 in blog): Pick node with smallest f(n) from Open List
      let currentKey = null;
      let minF = Infinity;
      let minH = Infinity;

      for (const [k, node] of openList.entries()) {
        if (node.f < minF || (node.f === minF && node.h < minH)) {
          minF = node.f;
          minH = node.h;
          currentKey = k;
        }
      }

      const currentNode = openList.get(currentKey);

      // Check if current node is Goal
      if (currentNode.x === this.goal.x && currentNode.y === this.goal.y) {
        pathFound = true;
        goalNodeRef = currentNode;
        break;
      }

      // Move node from Open List to Closed List (Blog Step 4)
      openList.delete(currentKey);
      closedList.add(currentKey);

      this.recordSnapshot({
        stepNum: stepCounter++,
        title: `Select Node (${currentNode.x}, ${currentNode.y}) [f=${currentNode.f}]`,
        desc: `Move node (${currentNode.x}, ${currentNode.y}) with lowest f(n)=${currentNode.f} from Open List to Closed List. Inspecting neighbors...`,
        currentNode: currentNode,
        openList: Array.from(openList.values()),
        closedList: Array.from(closedList),
        nodeMap: new Map(nodeMap),
        status: 'searching'
      });

      // Define 8 directions: straight first, then diagonal
      const neighbors = [
        { dx: 0, dy: -1, cost: this.straightCost },  // Up
        { dx: 1, dy: 0, cost: this.straightCost },   // Right
        { dx: 0, dy: 1, cost: this.straightCost },   // Down
        { dx: -1, dy: 0, cost: this.straightCost }   // Left
      ];

      if (this.allowDiagonal) {
        neighbors.push(
          { dx: 1, dy: -1, cost: this.diagonalCost }, // Up-Right
          { dx: 1, dy: 1, cost: this.diagonalCost },  // Down-Right
          { dx: -1, dy: 1, cost: this.diagonalCost }, // Down-Left
          { dx: -1, dy: -1, cost: this.diagonalCost } // Up-Left
        );
      }

      for (const offset of neighbors) {
        const nx = currentNode.x + offset.dx;
        const ny = currentNode.y + offset.dy;
        const nKey = this.key(nx, ny);

        // Check grid boundary
        if (nx < 0 || nx >= this.cols || ny < 0 || ny >= this.rows) continue;

        // Check wall obstacle
        if (this.walls.has(nKey)) continue;

        // Check closed list
        if (closedList.has(nKey)) continue;

        // Corner cutting check (optional rule)
        if (this.preventCornerCutting && offset.dx !== 0 && offset.dy !== 0) {
          const adj1 = this.key(currentNode.x + offset.dx, currentNode.y);
          const adj2 = this.key(currentNode.x, currentNode.y + offset.dy);
          if (this.walls.has(adj1) || this.walls.has(adj2)) continue;
        }

        const tentativeG = currentNode.g + offset.cost;
        const hVal = this.calcHeuristic(nx, ny);
        const fVal = tentativeG + hVal;
        const arrow = this.calcParentDirection(nx, ny, currentNode.x, currentNode.y);

        if (!openList.has(nKey)) {
          // New candidate node added to Open List (Blog Step 5)
          const newNeighborNode = {
            x: nx,
            y: ny,
            g: tentativeG,
            h: hVal,
            f: fVal,
            parent: { x: currentNode.x, y: currentNode.y },
            parentArrow: arrow
          };
          openList.set(nKey, newNeighborNode);
          nodeMap.set(nKey, newNeighborNode);

          // Check if Goal node was added to Open List (Blog Step 7 & 8)
          if (nx === this.goal.x && ny === this.goal.y) {
            pathFound = true;
            goalNodeRef = newNeighborNode;
          }
        } else {
          // Existing node in Open List: check if g(n) is lower (Blog Step 6)
          const existingNode = openList.get(nKey);
          if (tentativeG < existingNode.g) {
            existingNode.g = tentativeG;
            existingNode.f = fVal;
            existingNode.parent = { x: currentNode.x, y: currentNode.y };
            existingNode.parentArrow = arrow;
            nodeMap.set(nKey, existingNode);
          }
        }
      }

      if (pathFound) break;
    }

    // Path reconstruction (Blog Step 8)
    if (pathFound && goalNodeRef) {
      const finalPath = [];
      let curr = goalNodeRef;

      while (curr) {
        finalPath.unshift({ x: curr.x, y: curr.y });
        if (curr.parent) {
          const parentKey = this.key(curr.parent.x, curr.parent.y);
          curr = nodeMap.get(parentKey);
        } else {
          curr = null;
        }
      }

      this.recordSnapshot({
        stepNum: stepCounter,
        title: "Step 8: Goal Reached! Reconstruct Path",
        desc: `Goal node (${this.goal.x}, ${this.goal.y}) reached! Backtracking parent pointers from Goal to Start yields optimal shortest path.`,
        currentNode: goalNodeRef,
        openList: Array.from(openList.values()),
        closedList: Array.from(closedList),
        nodeMap: new Map(nodeMap),
        path: finalPath,
        status: 'completed'
      });
    } else {
      this.recordSnapshot({
        stepNum: stepCounter,
        title: "Search Terminated: No Path Found",
        desc: "Open List is empty and Goal node is unreachable.",
        currentNode: null,
        openList: [],
        closedList: Array.from(closedList),
        nodeMap: new Map(nodeMap),
        path: [],
        status: 'failed'
      });
    }

    return this.steps;
  }

  recordSnapshot(data) {
    this.steps.push({
      stepNum: data.stepNum,
      title: data.title,
      desc: data.desc,
      currentNode: data.currentNode,
      openList: JSON.parse(JSON.stringify(data.openList)),
      closedList: Array.from(data.closedList),
      nodeMap: new Map(data.nodeMap),
      path: data.path ? JSON.parse(JSON.stringify(data.path)) : [],
      status: data.status
    });
  }
}

// Export for browser global context
window.AStarEngine = AStarEngine;
