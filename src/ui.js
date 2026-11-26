import * as THREE from 'three';

export class UIManager {
  constructor(camera, renderer) {
    this.camera = camera;
    this.renderer = renderer;

    // DOM Elements
    this.timerEl = document.getElementById('timer-text');
    this.timerRing = document.getElementById('timer-ring');
    this.leaderboardList = document.getElementById('leaderboard-list');
    this.massBar = document.getElementById('mass-fill');
    this.massText = document.getElementById('mass-text');
    this.tierBadge = document.getElementById('tier-badge');
    this.comboContainer = document.getElementById('combo-container');
    this.comboMultiplier = document.getElementById('combo-multiplier');
    this.comboBar = document.getElementById('combo-bar-fill');
    this.popupContainer = document.getElementById('popup-container');
    this.alertBanner = document.getElementById('alert-banner');
    this.respawnBanner = document.getElementById('respawn-banner');
    this.respawnSeconds = document.getElementById('respawn-seconds');

    // Summary Modal Elements
    this.summaryModal = document.getElementById('summary-modal');
    this.finalRankEl = document.getElementById('final-rank');
    this.finalTitleEl = document.getElementById('final-title');
    this.statSwallowed = document.getElementById('stat-swallowed');
    this.statLargest = document.getElementById('stat-largest');
    this.statMass = document.getElementById('stat-mass');
    this.statRivals = document.getElementById('stat-rivals');
    this.podiumFirst = document.getElementById('podium-1');
    this.podiumSecond = document.getElementById('podium-2');
    this.podiumThird = document.getElementById('podium-3');

    // Combo system
    this.comboCount = 0;
    this.comboTimer = 0;
    this.comboMaxTime = 2.5;

    // Screen shake
    this.shakeTrauma = 0;

    // Projected 2D popups pool
    this.popups = [];
  }

  // Camera trauma shake
  addTrauma(amount) {
    this.shakeTrauma = Math.min(1.0, this.shakeTrauma + amount);
  }

  getShakeOffset() {
    if (this.shakeTrauma <= 0) return { x: 0, y: 0, z: 0 };
    const shake = Math.pow(this.shakeTrauma, 2) * 1.6;
    const offsetX = (Math.random() * 2 - 1) * shake;
    const offsetY = (Math.random() * 2 - 1) * shake * 0.5;
    const offsetZ = (Math.random() * 2 - 1) * shake;
    return { x: offsetX, y: offsetY, z: offsetZ };
  }

  update(delta) {
    // Screen shake decay
    if (this.shakeTrauma > 0) {
      this.shakeTrauma = Math.max(0, this.shakeTrauma - delta * 2.2);
    }

    // Combo decay
    if (this.comboCount > 0) {
      this.comboTimer -= delta;
      const progress = Math.max(0, this.comboTimer / this.comboMaxTime);
      if (this.comboBar) this.comboBar.style.width = `${progress * 100}%`;

      if (this.comboTimer <= 0) {
        this.comboCount = 0;
        if (this.comboContainer) this.comboContainer.classList.remove('active');
      }
    }

    // Update floating score badges
    this.updatePopups(delta);
  }

  triggerCombo() {
    this.comboCount++;
    this.comboTimer = this.comboMaxTime;
    if (this.comboContainer) {
      this.comboContainer.classList.add('active');
      if (this.comboMultiplier) this.comboMultiplier.innerText = `x${this.comboCount}`;
    }
    return this.comboCount;
  }

  updateTimer(timeLeft) {
    const secs = Math.max(0, Math.ceil(timeLeft));
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    const timeStr = `${mins}:${remSecs < 10 ? '0' : ''}${remSecs}`;
    
    if (this.timerEl) {
      this.timerEl.innerText = timeStr;
      if (secs <= 10) {
        this.timerEl.parentElement.classList.add('urgent');
      } else {
        this.timerEl.parentElement.classList.remove('urgent');
      }
    }

    // SVG radial progress
    if (this.timerRing) {
      const circumference = 2 * Math.PI * 26; // radius 26
      const offset = circumference * (1 - secs / 90);
      this.timerRing.style.strokeDasharray = `${circumference}`;
      this.timerRing.style.strokeDashoffset = `${offset}`;
    }
  }

  updatePlayerStats(player) {
    // Mass & Tier
    const tierNames = [
      'Tier 1: Scavenger',
      'Tier 2: City Menace',
      'Tier 3: Mega Kaiju',
      'Tier 4: Cosmic Singularity'
    ];
    if (this.tierBadge) {
      this.tierBadge.innerText = tierNames[player.tier - 1] || 'Tier 1';
      this.tierBadge.className = `tier-badge tier-${player.tier}`;
    }

    if (this.massText) {
      this.massText.innerText = `${Math.floor(player.mass).toLocaleString()} Mass`;
    }

    // Tier target progress bar (calibrated to balanced progression)
    const thresholds = [0, 200, 1200, 4500, 14000];
    const curTierFloor = thresholds[player.tier - 1] || 0;
    const nextTierCeil = thresholds[player.tier] || 10000;
    const pct = Math.min(100, Math.max(0, ((player.mass - curTierFloor) / (nextTierCeil - curTierFloor)) * 100));
    if (this.massBar) {
      this.massBar.style.width = `${pct}%`;
    }

    // Respawn display
    if (player.isRespawning) {
      if (this.respawnBanner) {
        this.respawnBanner.classList.add('active');
        if (this.respawnSeconds) {
          this.respawnSeconds.innerText = Math.ceil(player.respawnTimer);
        }
      }
    } else {
      if (this.respawnBanner) {
        this.respawnBanner.classList.remove('active');
      }
    }
  }

  updateLeaderboard(holes) {
    if (!this.leaderboardList) return;

    // Sort holes by score/mass descending
    const sorted = [...holes].sort((a, b) => b.score - a.score);

    let html = '';
    sorted.forEach((hole, idx) => {
      const isPlayer = hole.isPlayer;
      const rankNum = idx + 1;
      const hexColor = `#${hole.colorHex.toString(16).padStart(6, '0')}`;
      html += `
        <div class="lb-row ${isPlayer ? 'lb-player' : ''}">
          <span class="lb-rank">#${rankNum}</span>
          <span class="lb-dot" style="background:${hexColor}; box-shadow:0 0 6px ${hexColor};"></span>
          <span class="lb-name">${hole.name} ${isPlayer ? '(YOU)' : ''}</span>
          <span class="lb-score">${Math.floor(hole.score).toLocaleString()}</span>
        </div>
      `;
    });

    this.leaderboardList.innerHTML = html;
  }

  // Floating 3D-to-2D Score Badge
  spawnScorePopup(worldX, worldY, worldZ, text, tier = 1) {
    const el = document.createElement('div');
    el.className = `score-popup popup-tier-${tier}`;
    el.innerText = text;
    this.popupContainer.appendChild(el);

    this.popups.push({
      el,
      x: worldX,
      y: worldY + 1.0,
      z: worldZ,
      age: 0,
      maxAge: 0.85 + tier * 0.15
    });
  }

  updatePopups(delta) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const tempVec = new THREE.Vector3();

    for (let i = this.popups.length - 1; i >= 0; i--) {
      const p = this.popups[i];
      p.age += delta;
      p.y += delta * 2.2; // Float upward

      if (p.age >= p.maxAge) {
        p.el.remove();
        this.popups.splice(i, 1);
        continue;
      }

      tempVec.set(p.x, p.y, p.z);
      tempVec.project(this.camera);

      // Check if in front of camera
      if (tempVec.z < 1) {
        const screenX = (tempVec.x * 0.5 + 0.5) * w;
        const screenY = (-tempVec.y * 0.5 + 0.5) * h;
        const opacity = 1.0 - (p.age / p.maxAge);
        const scale = 1.0 + (p.age / p.maxAge) * 0.4;

        p.el.style.transform = `translate(-50%, -50%) translate3d(${screenX}px, ${screenY}px, 0) scale(${scale})`;
        p.el.style.opacity = `${opacity}`;
      } else {
        p.el.style.opacity = '0';
      }
    }
  }

  showAlert(message, duration = 2.4, color = '#00f3ff') {
    if (!this.alertBanner) return;
    this.alertBanner.innerText = message;
    this.alertBanner.style.color = color;
    this.alertBanner.style.borderColor = color;
    this.alertBanner.style.textShadow = `0 0 12px ${color}`;
    this.alertBanner.classList.add('active');

    clearTimeout(this.alertTimeout);
    this.alertTimeout = setTimeout(() => {
      this.alertBanner.classList.remove('active');
    }, duration * 1000);
  }

  showEndGameSummary(allHoles, player, rivalsEaten) {
    const sorted = [...allHoles].sort((a, b) => b.score - a.score);
    const playerRank = sorted.findIndex(h => h.isPlayer) + 1;

    // Podium names
    if (this.podiumFirst) this.podiumFirst.innerText = sorted[0]?.name || 'N/A';
    if (this.podiumSecond) this.podiumSecond.innerText = sorted[1]?.name || 'N/A';
    if (this.podiumThird) this.podiumThird.innerText = sorted[2]?.name || 'N/A';

    // Player stats
    if (this.finalRankEl) this.finalRankEl.innerText = `#${playerRank}`;
    if (this.finalTitleEl) {
      if (playerRank === 1) this.finalTitleEl.innerText = '🏆 APEX SINGULARITY - 1ST PLACE!';
      else if (playerRank <= 3) this.finalTitleEl.innerText = '🥈 PODIUM FINISHER!';
      else this.finalTitleEl.innerText = 'CITY DEVOURER';
    }

    if (this.statSwallowed) this.statSwallowed.innerText = player.swallowedCount;
    if (this.statLargest) this.statLargest.innerText = player.largestObjectEaten;
    if (this.statMass) this.statMass.innerText = Math.floor(player.mass).toLocaleString();
    if (this.statRivals) this.statRivals.innerText = rivalsEaten;

    if (this.summaryModal) {
      this.summaryModal.classList.add('active');
    }
  }

  hideEndGameSummary() {
    if (this.summaryModal) {
      this.summaryModal.classList.remove('active');
    }
  }
}
