import * as THREE from 'three';
import { CityManager } from './city.js';
import { Hole } from './hole.js';
import { AIManager } from './ai.js';
import { sound } from './audio.js';
import { UIManager } from './ui.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('webgl-canvas');
    this.state = 'MENU'; // 'MENU', 'PLAYING', 'GAMEOVER'
    this.matchDuration = 90.0;
    this.matchTimer = this.matchDuration;
    this.lastTickSec = -1;
    this.rivalsEatenCount = 0;
    this.difficulty = 'normal';

    // Movement input state
    this.keys = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false };
    this.pointer = { active: false, x: 0, y: 0, startX: 0, startY: 0, dirX: 0, dirZ: 0 };

    this.initThree();
    this.initGameObjects();
    this.initInput();
    this.initUIBindings();

    // Clock for delta time
    this.clock = new THREE.Clock();
    
    // Start animation loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initThree() {
    // 1. Scene & Linear Fog (preventing white screen wash-out when zoomed out)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xd2e1ed);
    // Linear fog starting far beyond camera distance to keep city 100% crisp
    this.scene.fog = new THREE.Fog(0xd2e1ed, 120, 360);

    // 2. Camera (Top-down Isometric angle)
    this.camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.5, 500);
    this.cameraPitch = 0.88; // ~50 degrees
    this.cameraDistance = 24.0;
    this.cameraTarget = new THREE.Vector3(0, 0, 0);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // 4. Lighting (Sunlight with crisp directional shadows + bounce ambient)
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444455, 0.65);
    hemiLight.position.set(0, 50, 0);
    this.scene.add(hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xfff5e6, 1.25);
    this.dirLight.position.set(60, 90, 50);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 280;
    const d = 90;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0005;
    this.scene.add(this.dirLight);

    // Handle Window Resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  initGameObjects() {
    // City Builder
    this.city = new CityManager(this.scene);

    // Player Hole
    this.player = new Hole(this.scene, {
      name: 'Player',
      color: 0x00f3ff,
      isPlayer: true,
      x: 0,
      z: 0
    });

    // AI Rivals Manager
    this.ai = new AIManager(this.scene, this.player);

    // UI Manager
    this.ui = new UIManager(this.camera, this.renderer);
  }

  initInput() {
    // Keyboard inputs
    window.addEventListener('keydown', (e) => {
      if (this.keys.hasOwnProperty(e.key) || this.keys.hasOwnProperty(e.code)) {
        this.keys[e.key] = true;
        this.keys[e.code] = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      if (this.keys.hasOwnProperty(e.key) || this.keys.hasOwnProperty(e.code)) {
        this.keys[e.key] = false;
        this.keys[e.code] = false;
      }
    });

    // Pointer / Mouse / Touch steering
    const joystickThumb = document.getElementById('joystick-thumb');
    const joystickBase = document.getElementById('joystick-base');

    const handlePointerStart = (clientX, clientY) => {
      if (this.state !== 'PLAYING') return;
      this.pointer.active = true;
      this.pointer.startX = clientX;
      this.pointer.startY = clientY;
      this.pointer.x = clientX;
      this.pointer.y = clientY;

      if (joystickBase && joystickThumb) {
        joystickBase.style.display = 'block';
        joystickBase.style.left = `${clientX}px`;
        joystickBase.style.top = `${clientY}px`;
        joystickThumb.style.transform = `translate(0px, 0px)`;
      }
    };

    const handlePointerMove = (clientX, clientY) => {
      if (!this.pointer.active) return;
      this.pointer.x = clientX;
      this.pointer.y = clientY;

      const dx = clientX - this.pointer.startX;
      const dy = clientY - this.pointer.startY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxR = 50;

      if (dist > 5) {
        this.pointer.dirX = dx / Math.max(dist, 1);
        this.pointer.dirZ = dy / Math.max(dist, 1);
      } else {
        this.pointer.dirX = 0;
        this.pointer.dirZ = 0;
      }

      if (joystickThumb) {
        const clampDist = Math.min(dist, maxR);
        const tx = (dx / (dist || 1)) * clampDist;
        const ty = (dy / (dist || 1)) * clampDist;
        joystickThumb.style.transform = `translate(${tx}px, ${ty}px)`;
      }
    };

    const handlePointerEnd = () => {
      this.pointer.active = false;
      this.pointer.dirX = 0;
      this.pointer.dirZ = 0;
      if (joystickBase) joystickBase.style.display = 'none';
    };

    // Mouse events
    this.canvas.addEventListener('mousedown', (e) => handlePointerStart(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => handlePointerMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', handlePointerEnd);

    // Touch events
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) handlePointerStart(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });

    window.addEventListener('touchend', handlePointerEnd);
    window.addEventListener('touchcancel', handlePointerEnd);
  }

  initUIBindings() {
    // Start game button
    const startBtn = document.getElementById('start-btn');
    const startModal = document.getElementById('start-modal');
    const nameInput = document.getElementById('player-name-input');

    // Color skin picker
    const colorSwatches = document.querySelectorAll('.color-swatch');
    colorSwatches.forEach((swatch) => {
      swatch.addEventListener('click', () => {
        colorSwatches.forEach(s => s.classList.remove('selected'));
        swatch.classList.add('selected');
        const hex = parseInt(swatch.dataset.color, 16);
        this.player.setColor(hex);
      });
    });

    // Difficulty picker
    const diffButtons = document.querySelectorAll('.diff-btn');
    diffButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        diffButtons.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.difficulty = btn.dataset.diff || 'normal';
      });
    });

    startBtn.addEventListener('click', () => {
      sound.init();
      sound.startBgMusic();

      const chosenName = nameInput.value.trim() || 'Player';
      this.player.name = chosenName;

      startModal.classList.remove('active');
      this.startGame();
    });

    // Home buttons (HUD and Summary screen)
    const homeBtn = document.getElementById('home-btn');
    if (homeBtn) {
      homeBtn.addEventListener('click', () => {
        this.goToHome();
      });
    }

    const summaryHomeBtn = document.getElementById('summary-home-btn');
    if (summaryHomeBtn) {
      summaryHomeBtn.addEventListener('click', () => {
        this.goToHome();
      });
    }

    // Play again button
    const restartBtn = document.getElementById('restart-btn');
    restartBtn.addEventListener('click', () => {
      this.ui.hideEndGameSummary();
      this.restartGame();
    });

    // Sound mute toggle button
    const muteBtn = document.getElementById('mute-btn');
    muteBtn.addEventListener('click', () => {
      const isMuted = sound.toggleMute();
      muteBtn.classList.toggle('muted', isMuted);
      muteBtn.innerText = isMuted ? '🔇' : '🔊';
    });
  }

  goToHome() {
    this.state = 'MENU';
    this.city.reset();
    this.player.reset(0, 0);
    this.ai.reset();
    this.matchTimer = this.matchDuration;
    this.lastTickSec = -1;
    this.rivalsEatenCount = 0;
    this.ui.hideEndGameSummary();
    this.ui.updateTimer(this.matchDuration);
    this.ui.updatePlayerStats(this.player);
    this.ui.updateLeaderboard(this.ai.getAllHoles());
    const startModal = document.getElementById('start-modal');
    if (startModal) startModal.classList.add('active');
  }

  applyDifficulty() {
    this.ai.setDifficulty(this.difficulty);

    if (this.difficulty === 'easy') {
      this.player.speed = 18.5;
      this.player.respawnPenaltyDuration = 2.0;
      this.player.respawnMassLoss = 0.15;
    } else if (this.difficulty === 'hard') {
      this.player.speed = 17.5;
      this.player.respawnPenaltyDuration = 4.0;
      this.player.respawnMassLoss = 0.35;
    } else {
      this.player.speed = 18.0;
      this.player.respawnPenaltyDuration = 3.0;
      this.player.respawnMassLoss = 0.25;
    }
  }

  startGame() {
    this.applyDifficulty();
    this.state = 'PLAYING';
    this.matchTimer = this.matchDuration;
    this.rivalsEatenCount = 0;
    this.lastTickSec = -1;
  }

  restartGame() {
    this.city.reset();
    this.player.reset(0, 0);
    this.ai.reset();
    this.applyDifficulty();
    this.rivalsEatenCount = 0;
    this.matchTimer = this.matchDuration;
    this.lastTickSec = -1;
    this.state = 'PLAYING';
    sound.startBgMusic();
  }

  updatePlayerControls(delta) {
    if (!this.player.active) return;

    let inputX = 0;
    let inputZ = 0;

    // Keyboard WASD / Arrows
    if (this.keys.w || this.keys.ArrowUp) inputZ -= 1;
    if (this.keys.s || this.keys.ArrowDown) inputZ += 1;
    if (this.keys.a || this.keys.ArrowLeft) inputX -= 1;
    if (this.keys.d || this.keys.ArrowRight) inputX += 1;

    // Mouse / Touch virtual steering override
    if (this.pointer.active && (this.pointer.dirX !== 0 || this.pointer.dirZ !== 0)) {
      inputX = this.pointer.dirX;
      inputZ = this.pointer.dirZ;
    }

    const len = Math.sqrt(inputX * inputX + inputZ * inputZ);
    if (len > 0) {
      inputX /= len;
      inputZ /= len;
    }

    // Hole speed scales slightly as you get massive to retain snappy arcade responsiveness
    const currentSpeed = this.player.speed * (1.0 + (this.player.tier - 1) * 0.08);

    const targetVx = inputX * currentSpeed;
    const targetVz = inputZ * currentSpeed;

    // Smooth inertia acceleration & braking
    this.player.vx = THREE.MathUtils.lerp(this.player.vx, targetVx, delta * 9.0);
    this.player.vz = THREE.MathUtils.lerp(this.player.vz, targetVz, delta * 9.0);
  }

  updateCamera(delta) {
    // Dynamic top-down isometric zoom:
    // As player grows from radius 0.9 to 8.0+, zoom out smoothly
    const targetDist = 19.0 + Math.pow(this.player.radius, 1.05) * 6.5;
    this.cameraDistance = THREE.MathUtils.lerp(this.cameraDistance, targetDist, delta * 3.5);

    // Dynamically adjust fog distances so the screen NEVER washes out white as you grow!
    if (this.scene.fog) {
      this.scene.fog.near = this.cameraDistance * 1.8;
      this.scene.fog.far = this.cameraDistance * 4.5 + 150;
    }

    // Smooth camera target tracking
    this.cameraTarget.x = THREE.MathUtils.lerp(this.cameraTarget.x, this.player.x, delta * 5.0);
    this.cameraTarget.z = THREE.MathUtils.lerp(this.cameraTarget.z, this.player.z, delta * 5.0);

    // Camera trauma shake offset
    const shake = this.ui.getShakeOffset();

    // Isometric offset position
    const camY = this.cameraDistance * Math.sin(this.cameraPitch) + shake.y;
    const camZOffset = this.cameraDistance * Math.cos(this.cameraPitch) + shake.z;

    this.camera.position.set(
      this.cameraTarget.x + shake.x,
      camY,
      this.cameraTarget.z + camZOffset
    );

    this.camera.lookAt(this.cameraTarget.x, 0, this.cameraTarget.z);

    // Keep sunlight centered near player
    this.dirLight.position.set(
      this.cameraTarget.x + 60,
      90,
      this.cameraTarget.z + 50
    );
    this.dirLight.target.position.set(this.cameraTarget.x, 0, this.cameraTarget.z);
    this.dirLight.target.updateMatrixWorld();
  }

  handlePropSwallowed(hole, prop, levelInfo) {
    if (hole.isPlayer) {
      // Sound effect
      sound.playSwallow(prop.tier);

      // Combo system
      const combo = this.ui.triggerCombo();
      if (combo > 1) {
        sound.playComboChime(combo);
      }

      // Tier 3/4 camera trauma shake
      if (prop.tier === 3) {
        this.ui.addTrauma(0.35);
      } else if (prop.tier === 4) {
        this.ui.addTrauma(0.75);
      }

      // Score popup badge
      const comboMult = Math.min(4, 1 + (combo - 1) * 0.25);
      const scoreGain = Math.floor(prop.mass * comboMult);
      this.ui.spawnScorePopup(prop.x, 0, prop.z, `+${scoreGain}`, prop.tier);

      // Level up announcement
      if (levelInfo.leveledUp) {
        sound.playGrowthTierUp();
        this.ui.addTrauma(0.5);
        this.ui.showAlert(`🎉 LEVEL UP! TIER ${levelInfo.newTier} UNLOCKED!`, 3.0, '#ffff00');
      }
    }
  }

  handleHoleSwallowed(predator, victim, massReward) {
    if (predator.isPlayer) {
      // Player devoured a rival bot!
      this.rivalsEatenCount++;
      sound.playRivalDevoured();
      this.ui.addTrauma(0.9);
      this.ui.spawnScorePopup(victim.x, 0, victim.z, `+${massReward} DEVOUR!`, 4);
      this.ui.showAlert(`💥 YOU DEVOURED ${victim.name}! +${massReward} MASS`, 3.2, '#ff0055');
    } else if (victim.isPlayer) {
      // Player got eaten by a bigger rival!
      sound.playPlayerDevoured();
      this.ui.addTrauma(1.0);
      this.ui.showAlert(`💀 DEVOURED BY ${predator.name}! RESPAWNING...`, 3.0, '#ff1744');
    }
  }

  updateMatchTimer(delta) {
    if (this.state !== 'PLAYING') return;

    this.matchTimer -= delta;
    this.ui.updateTimer(this.matchTimer);

    // Audio ticks in final 10 seconds
    const curSec = Math.ceil(this.matchTimer);
    if (curSec <= 10 && curSec > 0 && curSec !== this.lastTickSec) {
      this.lastTickSec = curSec;
      sound.playTick(true);
    } else if (curSec > 10 && curSec !== this.lastTickSec && curSec % 10 === 0) {
      this.lastTickSec = curSec;
    }

    // Match end
    if (this.matchTimer <= 0) {
      this.endGame();
    }
  }

  endGame() {
    this.state = 'GAMEOVER';
    sound.playMatchEnd();
    const allHoles = this.ai.getAllHoles();
    this.ui.showEndGameSummary(allHoles, this.player, this.rivalsEatenCount);
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);

    // Animated city elements (pedestrian walking wobbles)
    this.city.update(delta);

    if (this.state === 'PLAYING') {
      // Player controls
      this.updatePlayerControls(delta);

      // Player physics & prop swallowing
      this.player.updatePhysics(delta, this.city, {
        onPropSwallowed: (hole, prop, levelInfo) => this.handlePropSwallowed(hole, prop, levelInfo)
      });

      // AI Rivals updates & Hole vs Hole resolution
      this.ai.update(delta, this.city, {
        onPropSwallowed: (hole, prop, levelInfo) => this.handlePropSwallowed(hole, prop, levelInfo),
        onHoleSwallowed: (predator, victim, massReward) => this.handleHoleSwallowed(predator, victim, massReward)
      });

      // Match timer
      this.updateMatchTimer(delta);

      // UI HUD updates
      this.ui.update(delta);
      this.ui.updatePlayerStats(this.player);
      this.ui.updateLeaderboard(this.ai.getAllHoles());
    }

    // Dynamic camera tracking
    this.updateCamera(delta);

    // Render WebGL scene
    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
