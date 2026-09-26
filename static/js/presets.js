/**
 * Presets including the exact example from recall.tistory.com/40
 */

const MAP_PRESETS = {
  blogExample: {
    name: "📖 Blog Article Example (tistory/40)",
    rows: 5,
    cols: 5,
    start: { x: 1, y: 3 },
    goal: { x: 3, y: 1 },
    walls: [
      "2,1", "2,2", "2,3"
    ],
    description: "The exact grid scenario described in recall.tistory.com/40. Start node (1,3) green, Goal node (3,1) red, with obstacle wall at column 2."
  },
  classicWall: {
    name: "🧱 Classic Wall Barrier",
    rows: 8,
    cols: 8,
    start: { x: 1, y: 4 },
    goal: { x: 6, y: 4 },
    walls: [
      "3,1", "3,2", "3,3", "3,4", "3,5"
    ],
    description: "Standard vertical wall testing path detour around obstacles."
  },
  mazeRunner: {
    name: "🌀 Mini Maze Challenge",
    rows: 9,
    cols: 9,
    start: { x: 0, y: 0 },
    goal: { x: 8, y: 8 },
    walls: [
      "1,0", "1,1", "1,2", "1,3", "1,4", "1,5",
      "3,8", "3,7", "3,6", "3,5", "3,4", "3,3",
      "5,0", "5,1", "5,2", "5,3", "5,4", "5,5",
      "7,8", "7,7", "7,6", "7,5", "7,4", "7,3"
    ],
    description: "Serpentine maze forcing multiple direction switches and Open List re-evaluations."
  },
  emptyField: {
    name: "⛳ Open Field",
    rows: 7,
    cols: 7,
    start: { x: 1, y: 1 },
    goal: { x: 5, y: 5 },
    walls: [],
    description: "Unobstructed grid demonstrating optimal straight/diagonal movement."
  }
};

window.MAP_PRESETS = MAP_PRESETS;
