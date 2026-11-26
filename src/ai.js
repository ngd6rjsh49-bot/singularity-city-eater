import * as THREE from 'three';
import { Hole } from './hole.js';

export class AIManager {
  constructor(scene, playerHole) {
    this.scene = scene;
    this.player = playerHole;
    this.bots = [];
    this.difficulty = 'normal';

    // 5 Rival Bots with distinct personalities and spawn hubs
    this.aiConfig = [
      { name: 'Vortex-99', color: 0xff1744, startX: -55, startZ: -55, style: 'aggressive' }, // Red (Relentless hunter)
      { name: 'NovaCrush', color: 0x9c27b0, startX: 55, startZ: 55, style: 'vacuum' },        // Violet (Cluster devourer)
      { name: 'ApexVoid', color: 0x00e676, startX: -55, startZ: 55, style: 'flanker' },       // Emerald (Tactical ambusher)
      { name: 'ShadowByte', color: 0xff9100, startX: 55, startZ: -55, style: 'scavenger' },   // Amber (High-speed sweeper)
      { name: 'GlitchEater', color: 0xff007f, startX: 0, startZ: 65, style: 'berserker' }      // Magenta (Chaotic predator)
    ];

    this.initBots();
    this.setDifficulty('normal');
  }

  setDifficulty(level = 'normal') {
    this.difficulty = level;
    // Calibrated difficulty profiles
    const settings = {
      easy: {
        speed: 15.0,
        huntSpeedMult: 1.08,
        huntDist: 16,
        fleeDist: 26,
        turnRate: 7.0,
        clusterScanRadius: 28,
        massMultiplier: 0.9,
        retargetMin: 0.4,
        retargetMax: 0.8
      },
      normal: {
        speed: 18.5,           // Matches player baseline speed
        huntSpeedMult: 1.22,   // Sprint boost when pursuing prey!
        huntDist: 32,          // Active threat detection
        fleeDist: 22,
        turnRate: 9.5,         // Responsive snappy turning
        clusterScanRadius: 40, // Large neighborhood cluster analysis
        massMultiplier: 1.15,  // Competitive scoring pace
        retargetMin: 0.25,
        retargetMax: 0.55
      },
      hard: {
        speed: 21.0,           // Faster than player
        huntSpeedMult: 1.35,   // Relentless predator dash
        huntDist: 48,          // Long-distance vision
        fleeDist: 24,
        turnRate: 11.5,        // Super sharp maneuvers
        clusterScanRadius: 55,
        massMultiplier: 1.30,  // Escalated growth pressure
        retargetMin: 0.15,
        retargetMax: 0.35
      }
    };

    const s = settings[level] || settings.normal;
    this.currentSettings = s;

    this.bots.forEach((bot) => {
      bot.speed = s.speed;
      bot.aiMassMultiplier = s.massMultiplier;
    });
  }

  initBots() {
    this.bots = this.aiConfig.map((cfg) => {
      const hole = new Hole(this.scene, {
        name: cfg.name,
        color: cfg.color,
        isPlayer: false,
        x: cfg.startX,
        z: cfg.startZ
      });

      hole.aiMassMultiplier = 1.15;
      hole.aiPersonality = cfg.style;
      hole.aiState = {
        state: 'FORAGE',
        targetX: cfg.startX,
        targetZ: cfg.startZ,
        retargetTimer: 0,
        stuckTimer: 0,
        lastX: cfg.startX,
        lastZ: cfg.startZ,
        unstuckDirX: 0,
        unstuckDirZ: 0,
        unstuckTime: 0,
        targetProp: null
      };

      return hole;
    });
  }

  getAllHoles() {
    return [this.player, ...this.bots];
  }

  update(delta, city, callbacks = {}) {
    const allHoles = this.getAllHoles();

    // 1. Update AI behaviors
    for (let i = 0; i < this.bots.length; i++) {
      const bot = this.bots[i];
      if (!bot.active) {
        bot.updatePhysics(delta, city, callbacks);
        continue;
      }

      this.updateBotDecision(bot, delta, city, allHoles);
      bot.updatePhysics(delta, city, callbacks);
    }

    // 2. Resolve Hole-vs-Hole predator/prey eating with responsive hitboxes
    this.checkHoleVsHoleCollisions(allHoles, callbacks);
  }

  updateBotDecision(bot, delta, city, allHoles) {
    const ai = bot.aiState;
    const s = this.currentSettings;
    ai.retargetTimer -= delta;

    // Track movement displacement for anti-stuck detection
    const moveDist = Math.hypot(bot.x - ai.lastX, bot.z - ai.lastZ);
    ai.lastX = bot.x;
    ai.lastZ = bot.z;

    if (moveDist < 0.15) {
      ai.stuckTimer += delta;
    } else {
      ai.stuckTimer = Math.max(0, ai.stuckTimer - delta * 2.0);
    }

    // If bot was trapped by an obstacle for > 0.25s, trigger emergency deflection
    if (ai.stuckTimer > 0.25 && ai.unstuckTime <= 0) {
      ai.unstuckTime = 0.55;
      // Perpendicular escape angle
      const currentAngle = Math.atan2(bot.vz || 1, bot.vx || 1);
      const escapeAngle = currentAngle + (Math.random() > 0.5 ? 1 : -1) * (Math.PI * 0.65);
      ai.unstuckDirX = Math.cos(escapeAngle);
      ai.unstuckDirZ = Math.sin(escapeAngle);
      ai.retargetTimer = 0; // Force immediate re-evaluation of target
    }

    if (ai.unstuckTime > 0) {
      ai.unstuckTime -= delta;
      const escapeSpeed = bot.speed * 1.1;
      bot.vx = THREE.MathUtils.lerp(bot.vx, ai.unstuckDirX * escapeSpeed, delta * 9.0);
      bot.vz = THREE.MathUtils.lerp(bot.vz, ai.unstuckDirZ * escapeSpeed, delta * 9.0);
      return;
    }

    // Phase 1: Predator & Prey radar scan across all holes
    let fleeTarget = null;
    let huntTarget = null;
    let minFleeDist = s.fleeDist + bot.radius * 2.2;
    let minHuntDist = s.huntDist + bot.radius * 2.5;

    for (let j = 0; j < allHoles.length; j++) {
      const other = allHoles[j];
      if (other === bot || !other.active || other.invulnerableTimer > 0) continue;

      const dx = other.x - bot.x;
      const dz = other.z - bot.z;
      const dist = Math.hypot(dx, dz);

      // Flee if rival is >= 1.10x larger and in danger proximity
      if (other.radius >= bot.radius * 1.10 && dist < minFleeDist) {
        fleeTarget = other;
        minFleeDist = dist;
      }
      // Hunt if rival (or player) is <= 0.88x smaller and in strike range
      else if (bot.radius >= other.radius * 1.10 && dist < minHuntDist) {
        // Priority weight towards hunting player for thrilling tension
        const weight = other.isPlayer ? 0.75 : 1.0;
        if (dist * weight < minHuntDist) {
          huntTarget = other;
          minHuntDist = dist * weight;
        }
      }
    }

    let desiredVx = 0;
    let desiredVz = 0;

    // PRIORITY 1: FLEE FROM BIGGER PREDATORS!
    if (fleeTarget) {
      ai.state = 'FLEE';
      const dx = bot.x - fleeTarget.x;
      const dz = bot.z - fleeTarget.z;
      const len = Math.hypot(dx, dz) || 1;
      // High-speed escape burst
      const fleeSpeed = bot.speed * 1.25;
      desiredVx = (dx / len) * fleeSpeed;
      desiredVz = (dz / len) * fleeSpeed;
    }
    // PRIORITY 2: HUNT SMALLER RIVALS & PLAYER (Predictive Interception)!
    else if (huntTarget) {
      ai.state = 'HUNT';
      // Lead target based on target's velocity (predictive interception)
      const dist = Math.hypot(huntTarget.x - bot.x, huntTarget.z - bot.z);
      const leadTime = Math.min(1.0, dist / (bot.speed * s.huntSpeedMult + 0.1));
      const predX = huntTarget.x + (huntTarget.vx || 0) * leadTime * 0.8;
      const predZ = huntTarget.z + (huntTarget.vz || 0) * leadTime * 0.8;

      const dx = predX - bot.x;
      const dz = predZ - bot.z;
      const len = Math.hypot(dx, dz) || 1;
      const huntSpeed = bot.speed * s.huntSpeedMult;
      desiredVx = (dx / len) * huntSpeed;
      desiredVz = (dz / len) * huntSpeed;
    }
    // PRIORITY 3: FORAGING (Smart Cluster Devouring & Vacuuming)!
    else {
      ai.state = 'FORAGE';

      // Check if current target prop is already swallowed or invalid
      if (ai.targetProp && (!ai.targetProp.active || ai.targetProp.swallowing)) {
        ai.retargetTimer = 0;
        ai.targetProp = null;
      }

      if (ai.retargetTimer <= 0) {
        ai.retargetTimer = s.retargetMin + Math.random() * (s.retargetMax - s.retargetMin);

        // Find candidate props in neighborhood
        const scanR = s.clusterScanRadius + bot.radius * 3.0;
        const candidates = city.getPropsNear(bot.x, bot.z, scanR);

        let bestScore = -1;
        let chosenProp = null;

        for (let i = 0; i < candidates.length; i++) {
          const prop = candidates[i];
          if (!prop.active || prop.swallowing) continue;

          // Prop must be consumable
          if (bot.radius * 0.95 >= prop.baseRadius) {
            const d = Math.hypot(prop.x - bot.x, prop.z - bot.z);
            if (d < 0.1) continue;

            // Base score: mass weighted by inverse distance
            let score = (prop.mass * 2.2) / (d + 2.5);

            // Cluster density bonus: how many other consumable props are right next to it?
            let clusterCount = 0;
            for (let k = 0; k < Math.min(candidates.length, 18); k++) {
              const otherProp = candidates[k];
              if (otherProp !== prop && otherProp.active && !otherProp.swallowing) {
                if (Math.hypot(otherProp.x - prop.x, otherProp.z - prop.z) < 6.5) {
                  clusterCount++;
                }
              }
            }
            score += clusterCount * 22;

            if (score > bestScore) {
              bestScore = score;
              chosenProp = prop;
            }
          }
        }

        if (chosenProp) {
          ai.targetProp = chosenProp;
          ai.targetX = chosenProp.x;
          ai.targetZ = chosenProp.z;
        } else {
          // If local block is cleared, head towards rich city district centers
          const hotspots = [
            { x: 0, z: 0 },       // Central Park
            { x: -35, z: 0 },     // Commercial Avenue
            { x: 35, z: 0 },      // Residential Gardens
            { x: 0, z: -35 },     // Plaza
            { x: 0, z: 35 },      // Downtown Strip
            { x: -35, z: -35 },   // Suburb Block
            { x: 35, z: 35 }      // Waterfront
          ];
          const spot = hotspots[Math.floor(Math.random() * hotspots.length)];
          ai.targetX = spot.x + (Math.random() - 0.5) * 16;
          ai.targetZ = spot.z + (Math.random() - 0.5) * 16;
        }
      }

      const dx = ai.targetX - bot.x;
      const dz = ai.targetZ - bot.z;
      const len = Math.hypot(dx, dz);
      if (len > 0.4) {
        desiredVx = (dx / len) * bot.speed;
        desiredVz = (dz / len) * bot.speed;
      }
    }

    // Dynamic Obstacle Avoidance: glide smoothly around unswallowable skyscrapers
    const avoidance = this.computeObstacleAvoidance(bot, desiredVx, desiredVz, city);
    desiredVx = desiredVx * 0.65 + avoidance.vx * 0.75;
    desiredVz = desiredVz * 0.65 + avoidance.vz * 0.75;

    // Rescale to target speed
    const currentDesiredSpeed = (ai.state === 'HUNT' ? bot.speed * s.huntSpeedMult : bot.speed);
    const finalLen = Math.hypot(desiredVx, desiredVz) || 1;
    desiredVx = (desiredVx / finalLen) * currentDesiredSpeed;
    desiredVz = (desiredVz / finalLen) * currentDesiredSpeed;

    // Apply snappy turning acceleration
    bot.vx = THREE.MathUtils.lerp(bot.vx, desiredVx, delta * s.turnRate);
    bot.vz = THREE.MathUtils.lerp(bot.vz, desiredVz, delta * s.turnRate);
  }

  // Smooth tangential obstacle gliding
  computeObstacleAvoidance(bot, vx, vz, city) {
    const headingLen = Math.hypot(vx, vz);
    if (headingLen < 0.1) return { vx, vz };

    const lookAheadDist = bot.radius + 3.8;
    const nearbyObstacles = city.getPropsNear(bot.x, bot.z, lookAheadDist + 4.0);

    let avoidVx = 0;
    let avoidVz = 0;
    let hasObstacle = false;

    for (let i = 0; i < nearbyObstacles.length; i++) {
      const prop = nearbyObstacles[i];
      if (!prop.active || prop.swallowing) continue;

      // Only avoid props too large to swallow
      if (prop.baseRadius > bot.radius * 0.95) {
        const dx = prop.x - bot.x;
        const dz = prop.z - bot.z;
        const dist = Math.hypot(dx, dz);
        const minDist = bot.radius + prop.baseRadius * 0.85;

        if (dist < minDist + 2.5) {
          hasObstacle = true;
          // Vector from obstacle to bot (repulsion)
          const pushX = (bot.x - prop.x) / (dist || 1);
          const pushZ = (bot.z - prop.z) / (dist || 1);

          // Tangential sliding direction perpendicular to obstacle
          // Choose tangent that aligns best with current heading
          const tang1X = -pushZ;
          const tang1Z = pushX;
          const dot1 = tang1X * (vx / headingLen) + tang1Z * (vz / headingLen);

          const tangX = dot1 >= 0 ? tang1X : -tang1X;
          const tangZ = dot1 >= 0 ? tang1Z : -tang1Z;

          const strength = 1.0 - Math.min(1.0, dist / (minDist + 2.5));
          avoidVx += (pushX * 0.4 + tangX * 1.2) * strength * bot.speed;
          avoidVz += (pushZ * 0.4 + tangZ * 1.2) * strength * bot.speed;
        }
      }
    }

    if (!hasObstacle) return { vx, vz };
    return { vx: avoidVx, vz: avoidVz };
  }

  // Highly responsive hole-vs-hole eating
  checkHoleVsHoleCollisions(allHoles, callbacks) {
    for (let i = 0; i < allHoles.length; i++) {
      const holeA = allHoles[i];
      if (!holeA.active || holeA.invulnerableTimer > 0) continue;

      for (let j = i + 1; j < allHoles.length; j++) {
        const holeB = allHoles[j];
        if (!holeB.active || holeB.invulnerableTimer > 0) continue;

        const dx = holeB.x - holeA.x;
        const dz = holeB.z - holeA.z;
        const dist = Math.hypot(dx, dz);

        // Responsive devour hitbox: triggered when victim enters within 85% of predator radius
        if (holeA.radius >= holeB.radius * 1.10 && dist < holeA.radius * 0.85) {
          const massGained = holeA.devourRival(holeB);
          if (callbacks.onHoleSwallowed) {
            callbacks.onHoleSwallowed(holeA, holeB, massGained);
          }
        } else if (holeB.radius >= holeA.radius * 1.10 && dist < holeB.radius * 0.85) {
          const massGained = holeB.devourRival(holeA);
          if (callbacks.onHoleSwallowed) {
            callbacks.onHoleSwallowed(holeB, holeA, massGained);
          }
        }
      }
    }
  }

  reset() {
    this.bots.forEach((bot, idx) => {
      const cfg = this.aiConfig[idx];
      bot.reset(cfg.startX, cfg.startZ);
      bot.speed = this.currentSettings?.speed || 18.5;
      bot.aiState = {
        state: 'FORAGE',
        targetX: cfg.startX,
        targetZ: cfg.startZ,
        retargetTimer: 0,
        stuckTimer: 0,
        lastX: cfg.startX,
        lastZ: cfg.startZ,
        unstuckDirX: 0,
        unstuckDirZ: 0,
        unstuckTime: 0,
        targetProp: null
      };
    });
  }
}
