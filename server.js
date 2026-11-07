const http = require("http");
const fs = require("fs");
const path = require("path");
const { WebSocketServer } = require("ws");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const WORLD_ID = "starter-town";
const players = new Map();

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

const server = http.createServer((req, res) => {
  const requestPath = decodeURIComponent((req.url || "/").split("?")[0]);
  const safePath = requestPath === "/" ? "/index.html" : requestPath;
  const fullPath = path.normalize(path.join(PUBLIC_DIR, safePath));
  if (!fullPath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403); return res.end("Forbidden");
  }
  fs.readFile(fullPath, (err, data) => {
    if (err) { res.writeHead(404); return res.end("Not found"); }
    res.writeHead(200, { "Content-Type": mime[path.extname(fullPath)] || "application/octet-stream" });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server });
const send = (ws, payload) => {
  if (ws.readyState === 1) ws.send(JSON.stringify(payload));
};
const broadcast = (payload, exceptId = null) => {
  for (const [id, player] of players) {
    if (id !== exceptId) send(player.ws, payload);
  }
};
const cleanName = value => String(value || "Newcomer").trim().replace(/[<>]/g, "").slice(0, 18) || "Newcomer";
const clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n) || 0));

wss.on("connection", (ws) => {
  let playerId = null;

  ws.on("message", raw => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }
    if (!msg || typeof msg.type !== "string") return;

    if (msg.type === "join" && !playerId) {
      playerId = `p_${Math.random().toString(36).slice(2, 10)}`;
      const player = {
        id: playerId,
        name: cleanName(msg.name),
        x: 0,
        y: 0,
        color: ["#e88f70", "#79a9d8", "#9d83c7", "#79b99b", "#e2b85e"][Math.floor(Math.random() * 5)],
        ws
      };
      players.set(playerId, player);
      send(ws, {
        type: "welcome",
        self: { id: player.id, name: player.name, x: player.x, y: player.y, color: player.color },
        worldId: WORLD_ID,
        players: [...players.values()].filter(p => p.id !== playerId).map(({ ws, ...p }) => p)
      });
      broadcast({ type: "player_joined", player: { id: player.id, name: player.name, x: player.x, y: player.y, color: player.color } }, playerId);
      return;
    }

    if (!playerId || !players.has(playerId)) return;
    const current = players.get(playerId);

    if (msg.type === "move") {
      // Server validates and owns the world position.
      current.x = clamp(msg.x, -24, 24);
      current.y = clamp(msg.y, -24, 24);
      broadcast({ type: "player_moved", id: playerId, x: current.x, y: current.y });
    } else if (msg.type === "chat") {
      const text = String(msg.text || "").trim().slice(0, 180);
      if (!text) return;
      broadcast({
        type: "chat",
        id: playerId,
        name: current.name,
        text,
        at: Date.now()
      });
      send(ws, { type: "chat", id: playerId, name: current.name, text, at: Date.now() });
    } else if (msg.type === "interact") {
      const target = String(msg.targetId || "");
      if (!players.has(target) || target === playerId) return;
      send(ws, { type: "notice", text: `You waved at ${players.get(target).name}.` });
      send(players.get(target).ws, { type: "notice", text: `${current.name} waved at you.` });
    }
  });

  ws.on("close", () => {
    if (!playerId) return;
    players.delete(playerId);
    broadcast({ type: "player_left", id: playerId });
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Little Life Online listening on ${PORT}`);
});
