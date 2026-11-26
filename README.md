# 🌀 Singularity: City Eater 🏙️

A fast-paced, highly addictive 3D arcade game inspired by *Hole.io* built with **Three.js**.

🎮 **Play Live**: [https://ngd6rjsh49-bot.github.io/singularity-city-eater/](https://ngd6rjsh49-bot.github.io/singularity-city-eater/)

---

## ✨ Features

- **Stylized 3D Urban Grid**: Multi-block city with asphalt roads, pedestrian sidewalks, plazas, central park, and distinct commercial & downtown skyscraper districts.
- **4 Clear Prop Tiers**:
  - *Tier 1 (Tiny)*: Traffic cones, fire hydrants, bicycles, trash cans, streetlights, walking pedestrians.
  - *Tier 2 (Small)*: Park benches, bushes, trees, hotdog carts, parked sedans, taxis, delivery vans.
  - *Tier 3 (Medium)*: City transit buses, semi-trucks, billboards, cafes, gas stations, townhouses.
  - *Tier 4 (Large)*: Apartment blocks, office towers, construction cranes, and towering glass skyscrapers.
- **Physics-Based Swallowing**:
  - Consumable props tilt inward toward the singularity, plunge below the surface, spin, and scale down to zero.
  - Solid obstacle sliding around objects that are currently too large to swallow.
- **Dynamic Isometric Camera**: Top-down view with dynamic zoom that expands from 19 to 80+ units as your black hole grows from a scavenger into a cosmic behemoth.
- **Tactical AI Rivals**: 5 autonomous bots with unique personalities (`Vortex-99`, `NovaCrush`, `ApexVoid`, `ShadowByte`, `GlitchEater`). Features cluster foraging, predictive hunting, predator sprint bursts, and tangential obstacle gliding.
- **3 Difficulty Modes**:
  - 🟢 **Casual / Rustig**: Relaxed competition, gentle AI.
  - 🟡 **Arcade / Normaal**: Classic competitive Hole.io balance.
  - 🔴 **Chaos / Moeilijk**: Fast, relentless predator AI rivalries.
- **90-Second Match Loop**: Countdown clock with SVG radial ring, live leaderboard, floating score popups, combo feast streaks, and end-of-match 3D victory podium.
- **Web Audio API Synth**: Procedural sound effects for pops, thuds, crunches, earthquake collapses, cosmic devour chords, and retro synthwave beat.

---

## 🕹️ Controls

- **Mouse / Touch**: Drag to steer with the virtual joystick indicator.
- **Keyboard**: WASD or Arrow Keys.
- **🏠 Home Button**: Pause and return to the main menu at any time.
- **🔊 Sound Button**: Toggle sound effects and background music.

---

## 🛠️ Local Development

```bash
git clone https://github.com/ngd6rjsh49-bot/singularity-city-eater.git
cd singularity-city-eater
npm install
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your browser.
