# Little Life Online — Prototype 0.1

A small isometric shared-world browser prototype. Players can join the same test town, move around, see other connected players, chat, and wave.

## Run locally

Requirements: Node.js 20+

```bash
npm install
npm start
```

Open http://localhost:3000 in two browser tabs (or two devices on the same network) and join with different nicknames.

## Deploy to Railway

1. Create a GitHub repository and upload this project.
2. In Railway, create a project from that GitHub repository.
3. Railway detects `package.json` and runs `npm start`.
4. Railway provides the `PORT` environment variable automatically.
5. Open the generated public domain.
6. Share that domain with a friend and test from another device.

No custom domain is required for the prototype.

## Important prototype limitations

- Player positions and chat are held in server memory only.
- Restarting the service clears the current online session.
- There is no account/password system yet.
- The PostgreSQL schema is provided in `schema.sql` but is not wired into the prototype.
- The server is a single shared test world and has no room sharding.
- This is a development prototype, not a production-ready secure game server.
- The current movement is intentionally simple grid-step movement. The next iteration should add smooth pathfinding, collision, server-side movement rate limits, and persistent saves.

## Message protocol

Client -> server:
- `{ "type": "join", "name": "Alex" }`
- `{ "type": "move", "x": 1, "y": 0 }`
- `{ "type": "chat", "text": "Hello!" }`
- `{ "type": "interact", "targetId": "player-id" }`

Server -> client:
- `welcome`
- `player_joined`
- `player_left`
- `player_moved`
- `chat`
- `notice`

## Next development milestones

1. Persist accounts and characters in PostgreSQL.
2. Add secure authentication and reconnect/session handling.
3. Add server-authoritative movement, collision and anti-spam controls.
4. Add NPCs, interaction prompts and local chat.
5. Add needs, jobs, money and inventory.
6. Add consent-based friend/dating/marriage request flows.
7. Add household/property and child/family systems.
8. Add moderation, reporting, backups, monitoring and load testing before public launch.
