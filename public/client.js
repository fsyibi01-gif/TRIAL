const canvas = document.getElementById("world");
const ctx = canvas.getContext("2d");
const connectionLabel = document.getElementById("connection");
const onlineCount = document.getElementById("online-count");
const peopleList = document.getElementById("people-list");
const chatLog = document.getElementById("chat-log");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const joinDialog = document.getElementById("join-dialog");
const joinForm = document.getElementById("join-form");
const nameInput = document.getElementById("name-input");

let socket;
let self = null;
const players = new Map();
let target = null;
let lastSent = 0;
let view = { w: 800, h: 560, tileW: 64, tileH: 32 };

function resize() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  view.w = rect.width; view.h = rect.height;
  view.tileW = Math.max(48, Math.min(76, rect.width / 11));
  view.tileH = view.tileW * 0.5;
}
window.addEventListener("resize", resize);

function iso(x, y) {
  const originX = view.w / 2;
  const originY = view.h * 0.49;
  return { x: originX + (x - y) * view.tileW / 2, y: originY + (x + y) * view.tileH / 2 };
}
function drawTile(x, y, color) {
  const p = iso(x, y);
  ctx.beginPath();
  ctx.moveTo(p.x, p.y - view.tileH / 2);
  ctx.lineTo(p.x + view.tileW / 2, p.y);
  ctx.lineTo(p.x, p.y + view.tileH / 2);
  ctx.lineTo(p.x - view.tileW / 2, p.y);
  ctx.closePath();
  ctx.fillStyle = color; ctx.fill();
  ctx.strokeStyle = "#c9dfca"; ctx.lineWidth = 0.7; ctx.stroke();
}
function drawBuilding(x, y, width, height, wall, roof, label) {
  const p = iso(x, y);
  const tw = view.tileW, th = view.tileH;
  const w = width * tw * .48, h = height * th * .48, z = th * 1.65;
  ctx.fillStyle = "#00000018";
  ctx.beginPath(); ctx.ellipse(p.x, p.y + th * .7, w * 1.1, th * .8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = wall;
  ctx.beginPath(); ctx.moveTo(p.x - w, p.y - z); ctx.lineTo(p.x, p.y - z + h); ctx.lineTo(p.x, p.y + h); ctx.lineTo(p.x - w, p.y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = shade(wall, -18);
  ctx.beginPath(); ctx.moveTo(p.x, p.y - z + h); ctx.lineTo(p.x + w, p.y - z); ctx.lineTo(p.x + w, p.y); ctx.lineTo(p.x, p.y + h); ctx.closePath(); ctx.fill();
  ctx.fillStyle = roof;
  ctx.beginPath(); ctx.moveTo(p.x - w - 5, p.y - z); ctx.lineTo(p.x, p.y - z - h * .7); ctx.lineTo(p.x + w + 5, p.y - z); ctx.lineTo(p.x, p.y - z + h); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#fff5df";
  ctx.fillRect(p.x - 5, p.y - 13, 10, 16);
  ctx.fillStyle = "#d7e9e0";
  ctx.fillRect(p.x - w * .62, p.y - 22, 10, 9);
  ctx.fillRect(p.x + w * .25, p.y - 22, 10, 9);
}
function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amount));
  const b = Math.max(0, Math.min(255, (n & 255) + amount));
  return `rgb(${r},${g},${b})`;
}
function drawTree(x, y) {
  const p = iso(x, y);
  ctx.fillStyle = "#9a785b"; ctx.fillRect(p.x - 3, p.y - 20, 6, 22);
  ctx.fillStyle = "#7fb18a"; ctx.beginPath(); ctx.arc(p.x, p.y - 26, 15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#9ac79b"; ctx.beginPath(); ctx.arc(p.x - 7, p.y - 32, 8, 0, Math.PI * 2); ctx.fill();
}
function drawPlayer(p, isSelf = false) {
  const pos = iso(p.x, p.y);
  ctx.fillStyle = "#26382d25"; ctx.beginPath(); ctx.ellipse(pos.x, pos.y + 3, 10, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = p.color || "#df9a79"; ctx.beginPath(); ctx.arc(pos.x, pos.y - 12, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#f5d7b9"; ctx.beginPath(); ctx.arc(pos.x, pos.y - 22, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#6a554a"; ctx.beginPath(); ctx.arc(pos.x, pos.y - 25, 6, Math.PI, Math.PI * 2); ctx.fill();
  if (isSelf) { ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(pos.x, pos.y - 12, 10, 0, Math.PI * 2); ctx.stroke(); }
  ctx.font = "10px system-ui"; ctx.textAlign = "center"; ctx.fillStyle = "#526458";
  ctx.fillText(p.name, pos.x, pos.y - 34);
}
function render() {
  const w = view.w, h = view.h;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#dcebdc"; ctx.fillRect(0, 0, w, h);
  for (let y = -12; y <= 12; y++) {
    for (let x = -15; x <= 15; x++) {
      let c = ((x + y) % 2 === 0) ? "#d7e9d7" : "#d2e5d3";
      if (Math.abs(x) < 1 || Math.abs(y) < 1) c = "#d8d5bd";
      if (x > 3 && y < -2) c = "#c5dfc4";
      drawTile(x, y, c);
    }
  }
  drawBuilding(-5, -3, 2.6, 2.4, "#e8c9a7", "#c98570", "Cafe");
  drawBuilding(5, 4, 2.8, 2.5, "#d8c8b7", "#8eaa91", "Home");
  drawBuilding(5, -5, 2.3, 2.1, "#e8d8a8", "#d4a85f", "Shop");
  [[-8,2],[-7,4],[8,-2],[9,-1],[-2,7],[2,-7]].forEach(t => drawTree(t[0], t[1]));
  const all = [...players.values()];
  if (self) all.push(self);
  all.sort((a,b) => (a.x+a.y) - (b.x+b.y));
  all.forEach(p => drawPlayer(p, self && p.id === self.id));
  if (target && self) {
    const p = iso(target.x, target.y);
    ctx.strokeStyle = "#ffffffaa"; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.arc(p.x,p.y,12,0,Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
  }
  requestAnimationFrame(render);
}
function send(data) {
  if (socket && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(data));
}
function addChat(name, text, system = false) {
  const div = document.createElement("div");
  div.className = system ? "system-message" : "chat-line";
  if (system) div.textContent = text;
  else {
    const b = document.createElement("b"); b.textContent = name + ": ";
    div.appendChild(b); div.appendChild(document.createTextNode(text));
  }
  chatLog.appendChild(div); chatLog.scrollTop = chatLog.scrollHeight;
}
function refreshPeople() {
  const list = [...players.values()];
  peopleList.replaceChildren();
  if (!list.length) {
    const p = document.createElement("p"); p.className = "muted"; p.textContent = "No other residents yet. Invite a friend!";
    peopleList.appendChild(p);
  }
  list.forEach(p => {
    const row = document.createElement("div"); row.className = "person";
    const dot = document.createElement("div"); dot.className = "person-dot"; dot.style.background = p.color;
    const info = document.createElement("div");
    const name = document.createElement("div"); name.className = "person-name"; name.textContent = p.name;
    const state = document.createElement("div"); state.className = "person-state"; state.textContent = "Town resident";
    info.append(name, state);
    const wave = document.createElement("button"); wave.textContent = "Wave"; wave.onclick = () => send({type:"interact",targetId:p.id});
    row.append(dot, info, wave); peopleList.appendChild(row);
  });
  const count = list.length + (self ? 1 : 0);
  onlineCount.textContent = `${count} online`; document.getElementById("people-count").textContent = count;
}
function connect(name) {
  const scheme = location.protocol === "https:" ? "wss" : "ws";
  socket = new WebSocket(`${scheme}://${location.host}`);
  connectionLabel.textContent = "Connecting…";
  socket.addEventListener("open", () => send({type:"join",name}));
  socket.addEventListener("message", event => {
    const msg = JSON.parse(event.data);
    if (msg.type === "welcome") {
      self = msg.self; msg.players.forEach(p => players.set(p.id,p));
      document.getElementById("my-name").textContent = self.name;
      joinDialog.close(); refreshPeople(); addChat("Town", "You entered Maple Town.", true);
    } else if (msg.type === "player_joined") {
      players.set(msg.player.id,msg.player); refreshPeople(); addChat("Town", `${msg.player.name} joined the town.`, true);
    } else if (msg.type === "player_left") {
      const p = players.get(msg.id); players.delete(msg.id); refreshPeople();
      if (p) addChat("Town", `${p.name} left the town.`, true);
    } else if (msg.type === "player_moved") {
      const p = players.get(msg.id); if (p) { p.x = msg.x; p.y = msg.y; }
    } else if (msg.type === "chat") addChat(msg.name, msg.text);
    else if (msg.type === "notice") { document.getElementById("action-note").textContent = msg.text; addChat("Town", msg.text, true); }
  });
  socket.addEventListener("close", () => { connectionLabel.textContent = "Disconnected"; addChat("Town", "Connection lost. Refresh to reconnect.", true); });
  socket.addEventListener("error", () => { connectionLabel.textContent = "Connection error"; });
  socket.addEventListener("open", () => { connectionLabel.textContent = "Connected"; });
}
joinForm.addEventListener("submit", e => {
  e.preventDefault();
  const name = nameInput.value.trim();
  if (!name) return;
  connect(name);
});
chatForm.addEventListener("submit", e => {
  e.preventDefault(); const text = chatInput.value.trim(); if (!text) return;
  send({type:"chat",text}); chatInput.value = "";
});
document.getElementById("wave-button").addEventListener("click", () => {
  if (!players.size) { document.getElementById("action-note").textContent = "Invite a friend to wave at them."; return; }
  const first = players.values().next().value; send({type:"interact",targetId:first.id});
});
function move(dx,dy) {
  if (!self) return;
  self.x = Math.max(-24,Math.min(24,self.x+dx));
  self.y = Math.max(-24,Math.min(24,self.y+dy));
  target = null;
  const now = Date.now();
  if (now - lastSent > 35) { send({type:"move",x:self.x,y:self.y}); lastSent = now; }
}
window.addEventListener("keydown", e => {
  if (["INPUT","TEXTAREA"].includes(document.activeElement.tagName)) return;
  const k = e.key.toLowerCase();
  const moves = {w:[0,-1],arrowup:[0,-1],s:[0,1],arrowdown:[0,1],a:[-1,0],arrowleft:[-1,0],d:[1,0],arrowright:[1,0]};
  if (moves[k]) { e.preventDefault(); move(...moves[k]); }
});
canvas.addEventListener("click", e => {
  if (!self) return;
  const rect = canvas.getBoundingClientRect();
  const sx = e.clientX - rect.left - view.w/2;
  const sy = e.clientY - rect.top - view.h*.49;
  const tx = Math.round(sx/view.tileW + sy/view.tileH);
  const ty = Math.round(sy/view.tileH - sx/view.tileW);
  target = {x:Math.max(-24,Math.min(24,tx)),y:Math.max(-24,Math.min(24,ty))};
  const dx = Math.sign(target.x-self.x), dy = Math.sign(target.y-self.y);
  move(dx,dy);
});
resize();
render();
