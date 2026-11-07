# LITTLE LIFE ONLINE
## Game Design Document — Draft 0.1

### High concept
A browser-based, isometric 2D online life simulation. Players share a persistent-feeling town, create a resident, build a social life, work, earn money, decorate a home, and form consensual relationships with other real players.

### Pillars
1. **Social world:** other residents are real players, visible and approachable in shared spaces.
2. **Life progression:** players develop skills, careers, finances, homes, and relationships over time.
3. **Player agency:** players choose their own goals and pace; no single mandatory storyline.
4. **Safe community:** relationship progression requires mutual consent; chat and social features have block/report/moderation tools.

### Target platform and presentation
- Browser-first; responsive layout for desktop and mobile.
- Isometric 2D town.
- Camera follows the local player.
- Keyboard controls on desktop; touch joystick/tap-to-move on mobile.
- Initial art direction: cozy contemporary town, warm colors, readable silhouettes.

### Core loop
Explore town -> meet residents -> perform activities -> earn money/skills -> improve needs and relationships -> unlock jobs/property/items -> participate in town events.

### Player needs
Initial planned needs: Energy, Hunger, Hygiene, Happiness, Social, Health.
Needs should encourage variety but must not punish players harshly for being offline. Offline decay should be limited or disabled in the first release.

### Social and relationship design
- Players can send friend requests.
- Relationship progression: acquaintance -> friend -> dating -> engaged -> married.
- Both parties must explicitly accept each relationship transition.
- Either player can end a relationship.
- Blocking prevents contact and relationship requests.
- No coercive mechanics, forced pregnancy, or hidden relationship changes.
- Private chat should be opt-in and reportable.

### Family design
- Marriage creates a household link, not shared ownership by default.
- Household membership and property ownership are separate.
- Child/family gameplay is a later feature and should be age-appropriate, non-explicit, and focused on care, time, education, and family events.
- Players should be able to leave households and resolve ownership fairly.

### Career and economy
Initial jobs: cafe assistant, shop clerk, delivery rider, office assistant.
Each job has schedule, task minigame, skill requirement, wage, and career levels.
Economy must be server-authoritative. The client must never decide its own money, item quantity, or job rewards.
Avoid pay-to-win at launch. Monetization should focus on cosmetics, decorations, optional convenience, and expansions.

### World layout
Initial town: Maple Town.
- Town square / spawn
- Cafe
- Park
- Residential block
- Shops
Later areas: downtown, beach, school, hospital, office district.
A single logical shared world may be split into physical rooms/instances as concurrency grows. Players should be able to move between areas without losing social continuity.

### MVP scope
Prototype 0.1:
- nickname join
- isometric map
- local movement
- shared real-time player presence
- global town chat
- wave interaction

MVP 0.2:
- account authentication
- persistent character save
- collision and smooth movement
- touch controls
- moderation/report/block

MVP 0.3:
- NPCs and interaction
- needs and daily activities
- jobs, wages and inventory

MVP 0.4:
- friend requests
- dating/marriage consent flows
- homes and households

### Non-goals for first prototype
- Full MMO-scale world
- Child lifecycle/generational gameplay
- Player-to-player trading
- Real-money marketplace
- Complex combat
- Mobile app store release

### Technical direction
- Browser client: HTML Canvas prototype; consider Phaser for richer production rendering and asset pipelines.
- Realtime server: Node.js + WebSocket initially; evaluate Colyseus when room/state synchronization complexity grows.
- Database: PostgreSQL for durable accounts and game state.
- Hosting: Railway for early backend prototype; static client can be hosted on Railway or a separate static host.
- All valuable state (money, inventory, relationships, property) is validated and committed by the server.
- WebSocket payloads must be validated, rate-limited, and size-limited.
- Use HTTPS/WSS in deployment.
- Backups, moderation, logs, and load tests are required before public release.

### Risks and mitigations
- Free hosting is resource-limited and not a production uptime guarantee.
- In-memory prototype state disappears on restart.
- Shared world concurrency requires load testing and eventually multiple rooms.
- Real-player relationships require consent, privacy controls, reporting, blocking, and moderation.
- Economy exploits require server-side validation and audit logs.

### Success criteria for first public test
- Two or more browsers can join the same town.
- Each sees other players move with acceptable latency.
- Chat is delivered to all connected players.
- Disconnects remove presence cleanly.
- No client can set arbitrary money or inventory because those systems are not client-authoritative.
