import * as THREE from 'three';

export class Hole {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.name = options.name || 'Player';
    this.isPlayer = !!options.isPlayer;
    this.colorHex = options.color || 0x00f3ff;
    
    // Position and movement
    this.x = options.x || 0;
    this.z = options.z || 0;
    this.vx = 0;
    this.vz = 0;
    this.speed = 18.0;
    
    // Size & Mass progression
    this.mass = 0;
    this.radius = 1.0;
    this.targetRadius = 1.0;
    this.tier = 1;
    this.score = 0;
    this.swallowedCount = 0;
    this.largestObjectEaten = 'None';
    this.largestObjectMass = 0;

    // State & Respawn
    this.active = true;
    this.isRespawning = false;
    this.respawnTimer = 0;
    this.invulnerableTimer = 0;

    // Visual meshes
    this.initMeshes();
    this.initParticles();
  }

  initMeshes() {
    this.group = new THREE.Group();
    this.group.position.set(this.x, 0.05, this.z);

    // 1. Sleek flat circular pitch-black void disc flush with ground
    const voidGeo = new THREE.CircleGeometry(1, 48);
    const voidMat = new THREE.MeshBasicMaterial({
      color: 0x020305,
      depthWrite: true,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2
    });
    this.voidDisc = new THREE.Mesh(voidGeo, voidMat);
    this.voidDisc.rotation.x = -Math.PI / 2;
    this.voidDisc.position.y = 0.01;
    this.group.add(this.voidDisc);

    // 2. Glowing neon rim torus
    const rimGeo = new THREE.TorusGeometry(1, 0.09, 16, 64);
    this.rimMat = new THREE.MeshBasicMaterial({
      color: this.colorHex,
      transparent: true,
      opacity: 0.98
    });
    this.rimMesh = new THREE.Mesh(rimGeo, this.rimMat);
    this.rimMesh.rotation.x = -Math.PI / 2;
    this.rimMesh.position.y = 0.03;
    this.group.add(this.rimMesh);

    // 3. Subterranean dark well cylinder (depth illusion underneath)
    const wellGeo = new THREE.CylinderGeometry(1, 0.85, 12, 32, 1, true);
    const wellMat = new THREE.MeshBasicMaterial({
      color: 0x010204,
      side: THREE.BackSide
    });
    this.wellMesh = new THREE.Mesh(wellGeo, wellMat);
    this.wellMesh.position.y = -6.0;
    this.group.add(this.wellMesh);

    // 4. Invulnerability shield ring
    const shieldGeo = new THREE.RingGeometry(1.08, 1.25, 32);
    this.shieldMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0
    });
    this.shieldMesh = new THREE.Mesh(shieldGeo, this.shieldMat);
    this.shieldMesh.rotation.x = -Math.PI / 2;
    this.shieldMesh.position.y = 0.05;
    this.group.add(this.shieldMesh);

    this.scene.add(this.group);
  }

  // Swirling particle accretion ring around the rim
  initParticles() {
    this.particleCount = 75;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);
    const baseColor = new THREE.Color(this.colorHex);

    this.particleAngles = [];
    this.particleRadii = [];
    this.particleSpeeds = [];

    for (let i = 0; i < this.particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 0.75 + Math.random() * 0.45;
      const speed = 2.0 + Math.random() * 3.5;

      this.particleAngles.push(angle);
      this.particleRadii.push(r);
      this.particleSpeeds.push(speed);

      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = 0.05 + Math.random() * 0.08;
      positions[i * 3 + 2] = Math.sin(angle) * r;

      // Bright neon tint
      colors[i * 3] = Math.min(1.0, baseColor.r * 1.3);
      colors[i * 3 + 1] = Math.min(1.0, baseColor.g * 1.3);
      colors[i * 3 + 2] = Math.min(1.0, baseColor.b * 1.3);
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.16,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    this.particleSystem = new THREE.Points(geo, pMat);
    this.group.add(this.particleSystem);
  }

  setColor(hex) {
    this.colorHex = hex;
    this.rimMat.color.setHex(hex);
    const baseColor = new THREE.Color(hex);
    const colors = this.particleSystem.geometry.attributes.color.array;
    for (let i = 0; i < this.particleCount; i++) {
      colors[i * 3] = Math.min(1.0, baseColor.r * 1.3);
      colors[i * 3 + 1] = Math.min(1.0, baseColor.g * 1.3);
      colors[i * 3 + 2] = Math.min(1.0, baseColor.b * 1.3);
    }
    this.particleSystem.geometry.attributes.color.needsUpdate = true;
  }

  // Smooth, balanced scale progression
  addMass(amount, propName = '', tier = 1) {
    const mult = this.isPlayer ? 1.0 : (this.aiMassMultiplier || 1.15);
    const effectiveAmount = Math.round(amount * mult);
    this.mass += effectiveAmount;
    this.score += effectiveAmount;
    this.swallowedCount++;

    if (amount > this.largestObjectMass) {
      this.largestObjectMass = amount;
      this.largestObjectEaten = propName || `Tier ${tier} Object`;
    }

    // Mathematical growth scaling formula (Balanced progression)
    // Tier 1: radius 0.92 - 1.6  (Mass 0 - ~200)
    // Tier 2: radius 1.6 - 2.6   (Mass ~200 - ~1,200)
    // Tier 3: radius 2.6 - 4.2   (Mass ~1,200 - ~4,500)
    // Tier 4: radius 4.2+        (Mass ~4,500+)
    this.targetRadius = 0.92 + Math.pow(Math.max(0, this.mass) / 200, 0.46) * 0.72;

    // Tier thresholds
    const prevTier = this.tier;
    if (this.targetRadius >= 4.2) this.tier = 4;
    else if (this.targetRadius >= 2.6) this.tier = 3;
    else if (this.targetRadius >= 1.6) this.tier = 2;
    else this.tier = 1;

    return { leveledUp: this.tier > prevTier, newTier: this.tier };
  }

  updatePhysics(delta, city, callbacks = {}) {
    if (!this.active) {
      if (this.isRespawning) {
        this.respawnTimer -= delta;
        if (this.respawnTimer <= 0) {
          this.respawn();
        }
      }
      return;
    }

    // Invulnerability timer countdown
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= delta;
      this.shieldMat.opacity = Math.sin(Date.now() * 0.02) * 0.4 + 0.5;
      if (this.invulnerableTimer <= 0) {
        this.shieldMat.opacity = 0;
      }
    }

    // Smooth growth lerp
    this.radius = THREE.MathUtils.lerp(this.radius, this.targetRadius, delta * 3.8);

    // Apply scale to visual meshes
    this.group.scale.set(this.radius, 1, this.radius);

    // Update position with velocity
    this.x += this.vx * delta;
    this.z += this.vz * delta;

    // Bounds clamp inside city map
    const limit = 120;
    this.x = THREE.MathUtils.clamp(this.x, -limit, limit);
    this.z = THREE.MathUtils.clamp(this.z, -limit, limit);

    // Sync 3D group position
    this.group.position.x = this.x;
    this.group.position.z = this.z;

    // Update swirling accretion particles
    const positions = this.particleSystem.geometry.attributes.position.array;
    for (let i = 0; i < this.particleCount; i++) {
      this.particleAngles[i] += this.particleSpeeds[i] * delta;
      // Slight inward spiral breathing
      const spiralR = this.particleRadii[i] + Math.sin(this.particleAngles[i] * 3) * 0.08;
      positions[i * 3] = Math.cos(this.particleAngles[i]) * spiralR;
      positions[i * 3 + 2] = Math.sin(this.particleAngles[i]) * spiralR;
    }
    this.particleSystem.geometry.attributes.position.needsUpdate = true;

    // Swallowing check & obstacle collision resolution against city props
    this.processPropInteractions(delta, city, callbacks);
  }

  processPropInteractions(delta, city, callbacks) {
    const searchRadius = this.radius + 6.0;
    const nearbyProps = city.getPropsNear(this.x, this.z, searchRadius);

    for (let i = 0; i < nearbyProps.length; i++) {
      const prop = nearbyProps[i];

      // 1. If currently being swallowed by THIS hole: animate pull & drop
      if (prop.swallowing && prop.swallowingBy === this) {
        prop.swallowProgress += delta / prop.swallowDuration;
        const t = Math.min(1.0, prop.swallowProgress);

        // Inward suction vector towards center
        const pullFactor = Math.pow(t, 1.4);
        prop.mesh.position.x = THREE.MathUtils.lerp(prop.mesh.position.x, this.x, pullFactor * 0.35);
        prop.mesh.position.z = THREE.MathUtils.lerp(prop.mesh.position.z, this.z, pullFactor * 0.35);

        // Pull down below surface
        prop.mesh.position.y = prop.initialY - (t * (prop.height + 4.5));

        // Gravitational tilt inwards and spinning
        prop.mesh.rotation.y += delta * 7.5;
        prop.mesh.rotation.x = Math.sin(t * Math.PI) * 0.45;
        prop.mesh.rotation.z = Math.cos(t * Math.PI) * 0.35;

        // Scale squashes to zero
        const s = Math.max(0.01, 1.0 - t * 1.05);
        prop.mesh.scale.set(s, s, s);

        // Swallowed completely!
        if (t >= 1.0) {
          prop.swallowing = false;
          prop.active = false;
          prop.mesh.visible = false;

          const levelInfo = this.addMass(prop.mass, prop.name, prop.tier);
          if (callbacks.onPropSwallowed) {
            callbacks.onPropSwallowed(this, prop, levelInfo);
          }
        }
        continue;
      }

      // If prop is already being swallowed by another hole, skip
      if (prop.swallowing || !prop.active) continue;

      // 2. Check collision between hole and prop
      const dx = prop.x - this.x;
      const dz = prop.z - this.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      // Swallowing threshold: hole radius must be comfortably larger than prop base radius
      const canSwallow = this.radius * 0.95 >= prop.baseRadius;

      if (dist < this.radius) {
        if (canSwallow) {
          // Initiate swallowing physics!
          prop.swallowing = true;
          prop.swallowingBy = this;
          prop.swallowProgress = 0;
        } else {
          // Large object obstacle collision! Slide hole around it smoothly
          const minDist = this.radius + prop.baseRadius * 0.75;
          if (dist < minDist && dist > 0.001) {
            const overlap = minDist - dist;
            const nx = dx / dist;
            const nz = dz / dist;
            this.x -= nx * overlap * 0.6;
            this.z -= nz * overlap * 0.6;
            this.group.position.x = this.x;
            this.group.position.z = this.z;
          }
        }
      }
    }
  }

  // Devour another rival hole!
  devourRival(rival) {
    const massReward = Math.floor(rival.mass * 0.45) + 600;
    this.addMass(massReward, `${rival.name} (Rival)`, 4);
    rival.getDevouredBy(this);
    return massReward;
  }

  // Victim gets swallowed
  getDevouredBy(predator) {
    this.active = false;
    this.isRespawning = true;
    this.respawnTimer = this.respawnPenaltyDuration || 3.0; // Respawn penalty
    this.mass = Math.max(0, Math.floor(this.mass * (1.0 - (this.respawnMassLoss || 0.25)))); // Mass loss
    this.targetRadius = 0.92 + Math.pow(Math.max(0, this.mass) / 200, 0.46) * 0.72;
    this.radius = Math.max(0.92, this.targetRadius * 0.88);

    // Hide visual meshes while respawning
    this.group.visible = false;
  }

  respawn() {
    this.isRespawning = false;
    this.active = true;
    this.invulnerableTimer = 2.5; // 2.5s invulnerability shield
    this.group.visible = true;

    // Pick a safe open block (e.g. Park or open road)
    const parkCoords = [
      [0, 0], [-25, 25], [25, -25], [-40, -40], [40, 40]
    ];
    const spot = parkCoords[Math.floor(Math.random() * parkCoords.length)];
    this.x = spot[0] + (Math.random() - 0.5) * 10;
    this.z = spot[1] + (Math.random() - 0.5) * 10;
    this.vx = 0;
    this.vz = 0;
    this.group.position.set(this.x, 0.05, this.z);
  }

  reset(x = 0, z = 0) {
    this.x = x;
    this.z = z;
    this.vx = 0;
    this.vz = 0;
    this.mass = 0;
    this.score = 0;
    this.radius = 0.92;
    this.targetRadius = 0.92;
    this.tier = 1;
    this.swallowedCount = 0;
    this.largestObjectEaten = 'None';
    this.largestObjectMass = 0;
    this.active = true;
    this.isRespawning = false;
    this.respawnTimer = 0;
    this.invulnerableTimer = 0;
    this.group.visible = true;
    this.shieldMat.opacity = 0;
    this.group.position.set(this.x, 0.05, this.z);
    this.group.scale.set(1, 1, 1);
  }
}
