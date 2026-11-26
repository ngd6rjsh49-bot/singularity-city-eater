import * as THREE from 'three';

export class CityManager {
  constructor(scene) {
    this.scene = scene;
    this.props = [];
    this.pedestrians = [];
    this.citySize = 260; // 260x260 units city
    this.gridCellSize = 10;
    this.spatialGrid = new Map(); // "x,z" -> [propIndex, ...]
    
    // Shared materials for optimal performance
    this.initMaterials();
    this.initGeometries();
    this.buildCityLayout();
    this.populateProps();
  }

  initMaterials() {
    this.mat = {
      asphalt: new THREE.MeshLambertMaterial({ color: 0x22252a }),
      roadMarking: new THREE.MeshBasicMaterial({ color: 0xf5f5f5 }),
      roadYellow: new THREE.MeshBasicMaterial({ color: 0xffcc00 }),
      sidewalk: new THREE.MeshLambertMaterial({ color: 0xb5bcc7 }),
      grass: new THREE.MeshLambertMaterial({ color: 0x48a85e }),
      parkPath: new THREE.MeshLambertMaterial({ color: 0xd8caa8 }),
      water: new THREE.MeshLambertMaterial({ color: 0x2980b9 }),
      curb: new THREE.MeshLambertMaterial({ color: 0x8a929e }),

      // Props - Tier 1
      coneOrange: new THREE.MeshLambertMaterial({ color: 0xff6600 }),
      coneWhite: new THREE.MeshLambertMaterial({ color: 0xeeeeee }),
      hydrantRed: new THREE.MeshLambertMaterial({ color: 0xdd2222 }),
      hydrantSilver: new THREE.MeshLambertMaterial({ color: 0xcccccc }),
      trashCan: new THREE.MeshLambertMaterial({ color: 0x2e7d32 }),
      trashLid: new THREE.MeshLambertMaterial({ color: 0x1b5e20 }),
      metalPole: new THREE.MeshLambertMaterial({ color: 0x455a64 }),
      lampGlow: new THREE.MeshBasicMaterial({ color: 0xfffae0 }),
      bikeFrame: new THREE.MeshLambertMaterial({ color: 0x00bcd4 }),
      tireBlack: new THREE.MeshLambertMaterial({ color: 0x111111 }),
      pedestrianSkin: new THREE.MeshLambertMaterial({ color: 0xffdbac }),
      pedestrianClothes: [
        new THREE.MeshLambertMaterial({ color: 0xe91e63 }),
        new THREE.MeshLambertMaterial({ color: 0x3f51b5 }),
        new THREE.MeshLambertMaterial({ color: 0x009688 }),
        new THREE.MeshLambertMaterial({ color: 0xff9800 }),
        new THREE.MeshLambertMaterial({ color: 0x9c27b0 }),
      ],

      // Props - Tier 2
      woodBench: new THREE.MeshLambertMaterial({ color: 0x8d5b4c }),
      benchIron: new THREE.MeshLambertMaterial({ color: 0x263238 }),
      treeWood: new THREE.MeshLambertMaterial({ color: 0x5d4037 }),
      treeLeaves1: new THREE.MeshLambertMaterial({ color: 0x2e7d32 }),
      treeLeaves2: new THREE.MeshLambertMaterial({ color: 0x388e3c }),
      pineLeaves: new THREE.MeshLambertMaterial({ color: 0x1b5e20 }),
      bushGreen: new THREE.MeshLambertMaterial({ color: 0x43a047 }),
      hotdogStand: new THREE.MeshLambertMaterial({ color: 0xe53935 }),
      awningStripe: new THREE.MeshLambertMaterial({ color: 0xffeb3b }),
      carSedan: [
        new THREE.MeshLambertMaterial({ color: 0x1e88e5 }), // Blue
        new THREE.MeshLambertMaterial({ color: 0xe53935 }), // Red
        new THREE.MeshLambertMaterial({ color: 0xf5f5f5 }), // White
        new THREE.MeshLambertMaterial({ color: 0x212121 }), // Black
      ],
      carTaxi: new THREE.MeshLambertMaterial({ color: 0xffd600 }),
      carGlass: new THREE.MeshLambertMaterial({ color: 0x90caf9, transparent: true, opacity: 0.8 }),
      deliveryVan: new THREE.MeshLambertMaterial({ color: 0xeeeeee }),
      vanAccent: new THREE.MeshLambertMaterial({ color: 0x673ab7 }),

      // Props - Tier 3
      busBody: new THREE.MeshLambertMaterial({ color: 0x00acc1 }),
      truckCab: new THREE.MeshLambertMaterial({ color: 0xd84315 }),
      truckTrailer: new THREE.MeshLambertMaterial({ color: 0xe0e0e0 }),
      billboardFrame: new THREE.MeshLambertMaterial({ color: 0x37474f }),
      billboardPoster: new THREE.MeshBasicMaterial({ color: 0xff4081 }),
      shopBrick: new THREE.MeshLambertMaterial({ color: 0xb71c1c }),
      shopAwning: new THREE.MeshLambertMaterial({ color: 0x00897b }),
      gasCanopy: new THREE.MeshLambertMaterial({ color: 0x1565c0 }),
      gasPump: new THREE.MeshLambertMaterial({ color: 0xff5722 }),
      townhouseRoof: new THREE.MeshLambertMaterial({ color: 0x3e2723 }),
      townhouseWall: new THREE.MeshLambertMaterial({ color: 0xd7ccc8 }),

      // Props - Tier 4
      apartmentWall: new THREE.MeshLambertMaterial({ color: 0x90a4ae }),
      officeGlass: new THREE.MeshLambertMaterial({ color: 0x4fc3f7 }),
      craneYellow: new THREE.MeshLambertMaterial({ color: 0xffb300 }),
      skyscraperGlass1: new THREE.MeshLambertMaterial({ color: 0x0288d1 }),
      skyscraperGlass2: new THREE.MeshLambertMaterial({ color: 0x512da8 }),
      skyscraperGold: new THREE.MeshLambertMaterial({ color: 0xffb74d }),
      buildingSpire: new THREE.MeshLambertMaterial({ color: 0xe0e0e0 }),
      windowEmissive: new THREE.MeshBasicMaterial({ color: 0xfff9c4 })
    };
  }

  initGeometries() {
    this.geo = {
      box: new THREE.BoxGeometry(1, 1, 1),
      cylinder: new THREE.CylinderGeometry(0.5, 0.5, 1, 12),
      cone: new THREE.ConeGeometry(0.5, 1, 12),
      sphere: new THREE.SphereGeometry(0.5, 12, 10),
      dodecahedron: new THREE.DodecahedronGeometry(0.5),
      plane: new THREE.PlaneGeometry(1, 1)
    };
  }

  buildCityLayout() {
    const cityGroup = new THREE.Group();

    // 1. Base Earth & Subterranean Void base (prevents objects from showing through bottom)
    const earthGeo = new THREE.PlaneGeometry(this.citySize + 100, this.citySize + 100);
    const earthMat = new THREE.MeshBasicMaterial({ color: 0x0b0e14 });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    earth.rotation.x = -Math.PI / 2;
    earth.position.y = -18;
    cityGroup.add(earth);

    // 2. City Ground Base (Asphalt layer)
    const groundGeo = new THREE.PlaneGeometry(this.citySize, this.citySize);
    const ground = new THREE.Mesh(groundGeo, this.mat.asphalt);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    cityGroup.add(ground);

    // 3. Grid of city blocks: 5x5 blocks layout
    const numBlocks = 5;
    const blockSize = 36;
    const roadWidth = 14;
    const startCoord = -((numBlocks * blockSize + (numBlocks - 1) * roadWidth) / 2) + blockSize / 2;

    this.blocks = [];

    for (let bx = 0; bx < numBlocks; bx++) {
      for (let bz = 0; bz < numBlocks; bz++) {
        const cx = startCoord + bx * (blockSize + roadWidth);
        const cz = startCoord + bz * (blockSize + roadWidth);

        // Determine district type
        let district = 'residential';
        if (bx === 2 && bz === 2) {
          district = 'park'; // Central Park
        } else if ((bx === 1 && bz === 2) || (bx === 2 && bz === 1) || (bx === 3 && bz === 2)) {
          district = 'downtown'; // Skyscrapers
        } else if (bx === 0 || bz === 0) {
          district = 'commercial'; // Shops & gas stations
        } else if (bx === 4 && bz === 4) {
          district = 'construction'; // Cranes & warehouse
        }

        this.blocks.push({ cx, cz, size: blockSize, district });

        // Sidewalk / Grass pad for the block (clean plane flush above asphalt)
        const sidewalkGeo = new THREE.PlaneGeometry(blockSize, blockSize);
        const isPark = district === 'park';
        const sidewalkMat = isPark ? this.mat.grass : this.mat.sidewalk;
        const sidewalk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
        sidewalk.rotation.x = -Math.PI / 2;
        sidewalk.position.set(cx, 0.015, cz);
        sidewalk.receiveShadow = true;
        cityGroup.add(sidewalk);

        // Curbs around block
        const curbGeo = new THREE.PlaneGeometry(blockSize + 0.6, blockSize + 0.6);
        const curb = new THREE.Mesh(curbGeo, this.mat.curb);
        curb.rotation.x = -Math.PI / 2;
        curb.position.set(cx, 0.01, cz);
        cityGroup.add(curb);

        // If park: add inner pond and winding path
        if (isPark) {
          const pondGeo = new THREE.CircleGeometry(6, 32);
          const pond = new THREE.Mesh(pondGeo, this.mat.water);
          pond.rotation.x = -Math.PI / 2;
          pond.position.set(cx, 0.025, cz);
          cityGroup.add(pond);

          const path1 = new THREE.Mesh(new THREE.PlaneGeometry(blockSize - 4, 3), this.mat.parkPath);
          path1.rotation.x = -Math.PI / 2;
          path1.position.set(cx, 0.02, cz);
          cityGroup.add(path1);

          const path2 = new THREE.Mesh(new THREE.PlaneGeometry(3, blockSize - 4), this.mat.parkPath);
          path2.rotation.x = -Math.PI / 2;
          path2.position.set(cx, 0.02, cz);
          cityGroup.add(path2);
        }
      }
    }

    // 4. Road Markings (yellow centerlines, white dashed lane lines, crosswalks)
    this.createRoadMarkings(cityGroup, numBlocks, blockSize, roadWidth, startCoord);

    this.scene.add(cityGroup);
  }

  createRoadMarkings(cityGroup, numBlocks, blockSize, roadWidth, startCoord) {
    const roadColor = this.mat.roadYellow;
    const whiteColor = this.mat.roadMarking;

    // Crosswalks and center lines along horizontal & vertical avenues
    for (let i = 0; i < numBlocks - 1; i++) {
      const roadCenter = startCoord + i * (blockSize + roadWidth) + blockSize / 2 + roadWidth / 2;

      // Horizontal road line
      for (let x = -this.citySize / 2 + 10; x < this.citySize / 2 - 10; x += 6) {
        const dash = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 0.35), roadColor);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(x, 0.03, roadCenter);
        cityGroup.add(dash);
      }

      // Vertical road line
      for (let z = -this.citySize / 2 + 10; z < this.citySize / 2 - 10; z += 6) {
        const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 3.5), roadColor);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(roadCenter, 0.03, z);
        cityGroup.add(dash);
      }

      // Crosswalks at intersections
      for (let j = 0; j < numBlocks; j++) {
        const blockCoord = startCoord + j * (blockSize + roadWidth);

        // Zebra stripes near horizontal road
        for (let s = -4; s <= 4; s += 1.3) {
          const stripeH = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 2.8), whiteColor);
          stripeH.rotation.x = -Math.PI / 2;
          stripeH.position.set(blockCoord + s, 0.03, roadCenter - roadWidth / 2 + 1.6);
          cityGroup.add(stripeH);

          const stripeH2 = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 2.8), whiteColor);
          stripeH2.rotation.x = -Math.PI / 2;
          stripeH2.position.set(blockCoord + s, 0.03, roadCenter + roadWidth / 2 - 1.6);
          cityGroup.add(stripeH2);
        }
      }
    }
  }

  // Populate city with hundreds of props across Tiers 1 to 4
  populateProps() {
    this.blocks.forEach((block) => {
      this.populateBlock(block);
    });

    // Also populate road edges with streetlights, fire hydrants, parked cars
    this.populateRoads();
  }

  populateBlock(block) {
    const { cx, cz, size, district } = block;
    const half = size / 2 - 2;

    switch (district) {
      case 'park':
        this.populateParkDistrict(cx, cz, half);
        break;
      case 'downtown':
        this.populateDowntownDistrict(cx, cz, half);
        break;
      case 'commercial':
        this.populateCommercialDistrict(cx, cz, half);
        break;
      case 'construction':
        this.populateConstructionDistrict(cx, cz, half);
        break;
      case 'residential':
      default:
        this.populateResidentialDistrict(cx, cz, half);
        break;
    }
  }

  populateParkDistrict(cx, cz, half) {
    // Park benches (Tier 2)
    const benchAngles = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
    benchAngles.forEach((angle, i) => {
      const dist = 9.5;
      const bx = cx + Math.cos(angle) * dist;
      const bz = cz + Math.sin(angle) * dist;
      this.addProp(this.createBenchMesh(), bx, bz, 1.1, 0.8, 2, 45, 'Park Bench', angle);
      
      // Trash can next to bench (Tier 1)
      const tx = bx + Math.cos(angle + 0.3) * 1.8;
      const tz = bz + Math.sin(angle + 0.3) * 1.8;
      this.addProp(this.createTrashCanMesh(), tx, tz, 0.38, 0.85, 1, 15, 'Trash Can');

      // Pedestrian walking in park (Tier 1)
      const px = cx + Math.cos(angle + 0.8) * 6;
      const pz = cz + Math.sin(angle + 0.8) * 6;
      this.addPedestrian(px, pz);
    });

    // Trees (Tier 2) around corners and lawn
    const treeOffsets = [
      [-half + 3, -half + 3], [half - 3, -half + 3],
      [-half + 3, half - 3], [half - 3, half - 3],
      [-half + 8, 0], [half - 8, 0], [0, -half + 8], [0, half - 8],
      [-8, -8], [8, 8], [-8, 8], [8, -8]
    ];
    treeOffsets.forEach(([ox, oz], idx) => {
      const type = idx % 3 === 0 ? 'pine' : 'deciduous';
      this.addProp(this.createTreeMesh(type), cx + ox, cz + oz, 1.35, 4.2, 2, 60, type === 'pine' ? 'Pine Tree' : 'Oak Tree');
    });

    // Bushes (Tier 2)
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const bx = cx + Math.cos(angle) * 13;
      const bz = cz + Math.sin(angle) * 13;
      this.addProp(this.createBushMesh(), bx, bz, 0.85, 0.9, 2, 35, 'Bush');
    }

    // Hotdog cart near path (Tier 2)
    this.addProp(this.createHotdogStandMesh(), cx + 4, cz - 4, 1.25, 2.2, 2, 80, 'Hotdog Stand', 0.5);
  }

  populateDowntownDistrict(cx, cz, half) {
    // Mega skyscraper in center (Tier 4)
    const skyHeight = 28 + Math.random() * 12;
    const skyType = Math.floor(Math.random() * 3);
    this.addProp(this.createSkyscraperMesh(skyType, skyHeight), cx, cz, 4.8, skyHeight, 4, 1400, 'Sky Tower', (Math.PI / 2) * Math.floor(Math.random() * 4));

    // 2 Mid-rise office buildings (Tier 4)
    const officeOffsets = [
      [-half + 6, -half + 6],
      [half - 6, half - 6]
    ];
    officeOffsets.forEach(([ox, oz], i) => {
      const h = 15 + i * 4;
      this.addProp(this.createOfficeMesh(h), cx + ox, cz + oz, 3.6, h, 4, 850, 'Office Complex', 0);
    });

    // Plaza with plaza trees & streetlights & pedestrians
    const plazaSpots = [
      [half - 5, -half + 5],
      [-half + 5, half - 5]
    ];
    plazaSpots.forEach(([ox, oz]) => {
      this.addProp(this.createTreeMesh('deciduous'), cx + ox, cz + oz, 1.2, 3.8, 2, 50, 'Plaza Tree');
      this.addProp(this.createBenchMesh(), cx + ox + 2, cz + oz, 1.0, 0.7, 2, 40, 'Plaza Bench', Math.PI / 4);
      this.addPedestrian(cx + ox - 2, cz + oz);
      this.addPedestrian(cx + ox, cz + oz + 2);
    });

    // Tier 1 props: Bicycles, Cones, Trash cans on the plaza
    this.addProp(this.createBicycleMesh(), cx - 5, cz + 6, 0.45, 0.75, 1, 20, 'Bicycle', 1.2);
    this.addProp(this.createBicycleMesh(), cx - 6, cz + 6, 0.45, 0.75, 1, 20, 'Bicycle', 1.2);
    this.addProp(this.createTrashCanMesh(), cx - 4, cz - 7, 0.38, 0.85, 1, 15, 'Trash Can');
    this.addProp(this.createTrafficConeMesh(), cx + 6, cz - 5, 0.28, 0.65, 1, 10, 'Traffic Cone');
    this.addProp(this.createTrafficConeMesh(), cx + 7, cz - 5, 0.28, 0.65, 1, 10, 'Traffic Cone');
  }

  populateCommercialDistrict(cx, cz, half) {
    // Small Shops & gas stations (Tier 3)
    this.addProp(this.createShopMesh(0), cx - 7, cz - 7, 2.5, 4.5, 3, 260, 'Coffee Cafe', 0);
    this.addProp(this.createShopMesh(1), cx + 7, cz - 7, 2.5, 4.5, 3, 260, 'Bakery Store', 0);
    
    // Gas Station (Tier 3)
    this.addProp(this.createGasStationMesh(), cx, cz + 6, 3.2, 3.8, 3, 380, 'Gas Station', 0);

    // Billboard (Tier 3)
    this.addProp(this.createBillboardMesh(), cx - half + 3, cz + half - 4, 1.9, 6.0, 3, 220, 'Mega Billboard', 0.4);

    // Parked Sedans & Delivery Vans (Tier 2)
    this.addProp(this.createCarMesh('sedan', 0), cx - 6, cz + 1, 1.3, 1.2, 2, 75, 'Parked Sedan', Math.PI / 2);
    this.addProp(this.createCarMesh('taxi', 0), cx + 6, cz + 1, 1.3, 1.2, 2, 80, 'Taxi Cab', Math.PI / 2);
    this.addProp(this.createDeliveryVanMesh(), cx - 11, cz - 3, 1.6, 2.1, 2, 110, 'Delivery Van', 0);

    // Pedestrians & street props (Tier 1)
    for (let p = 0; p < 4; p++) {
      this.addPedestrian(cx - 3 + p * 2.5, cz - 11);
    }
    this.addProp(this.createFireHydrantMesh(), cx + 11, cz - 11, 0.3, 0.7, 1, 15, 'Fire Hydrant');
    this.addProp(this.createStreetlightMesh(), cx - 12, cz - 11, 0.45, 3.6, 1, 30, 'Streetlight');
  }

  populateConstructionDistrict(cx, cz, half) {
    // Towering construction crane (Tier 4)
    this.addProp(this.createConstructionCraneMesh(), cx, cz, 4.5, 22, 4, 1100, 'Construction Crane', 0.6);

    // Semi-trucks (Tier 3)
    this.addProp(this.createSemiTruckMesh(), cx - 8, cz - 6, 2.8, 2.8, 3, 340, 'Semi Truck', 0);
    this.addProp(this.createSemiTruckMesh(), cx + 8, cz + 6, 2.8, 2.8, 3, 340, 'Freight Carrier', Math.PI);

    // Warehouse / Construction containers (Tier 3)
    this.addProp(this.createContainerMesh(), cx + 7, cz - 7, 2.1, 2.0, 3, 180, 'Cargo Container', 0.2);
    this.addProp(this.createContainerMesh(), cx + 7, cz - 3, 2.1, 2.0, 3, 180, 'Cargo Container', 0);

    // Traffic cones perimeter (Tier 1)
    for (let c = -12; c <= 12; c += 3) {
      this.addProp(this.createTrafficConeMesh(), cx + c, cz + 12, 0.26, 0.65, 1, 10, 'Traffic Cone');
      this.addProp(this.createTrafficConeMesh(), cx + 12, cz + c, 0.26, 0.65, 1, 10, 'Traffic Cone');
    }

    // Workers / Pedestrians with hardhat colors (Tier 1)
    this.addPedestrian(cx - 3, cz);
    this.addPedestrian(cx + 2, cz - 2);
  }

  populateResidentialDistrict(cx, cz, half) {
    // 2 Townhouses (Tier 3)
    this.addProp(this.createTownhouseMesh(0), cx - 6, cz - 6, 2.6, 6.2, 3, 320, 'Brick Townhouse', 0);
    this.addProp(this.createTownhouseMesh(1), cx + 6, cz - 6, 2.6, 6.2, 3, 320, 'Brownstone', 0);

    // Apartment block (Tier 4)
    this.addProp(this.createApartmentMesh(), cx, cz + 6, 3.8, 11.5, 4, 750, 'Apartment Block', 0);

    // Trees and gardens (Tier 2)
    this.addProp(this.createTreeMesh('deciduous'), cx - 11, cz - 11, 1.25, 4.0, 2, 55, 'Frontyard Tree');
    this.addProp(this.createTreeMesh('deciduous'), cx + 11, cz - 11, 1.25, 4.0, 2, 55, 'Garden Tree');
    this.addProp(this.createBushMesh(), cx - 6, cz - 12, 0.8, 0.8, 2, 30, 'Garden Bush');
    this.addProp(this.createBushMesh(), cx + 6, cz - 12, 0.8, 0.8, 2, 30, 'Garden Bush');

    // Parked sedan (Tier 2)
    this.addProp(this.createCarMesh('sedan', 2), cx - 6, cz, 1.3, 1.2, 2, 75, 'Parked Sedan', 0);

    // Fire hydrant, bicycles, trash cans (Tier 1)
    this.addProp(this.createFireHydrantMesh(), cx - 12, cz, 0.3, 0.7, 1, 15, 'Fire Hydrant');
    this.addProp(this.createTrashCanMesh(), cx - 10, cz + 2, 0.38, 0.85, 1, 15, 'Trash Can');
    this.addProp(this.createBicycleMesh(), cx + 11, cz + 2, 0.45, 0.75, 1, 20, 'Bicycle', -0.5);
    this.addPedestrian(cx + 8, cz);
  }

  populateRoads() {
    // Populate road edges with streetlights, city transit buses, taxis, fire hydrants
    const numBlocks = 5;
    const blockSize = 36;
    const roadWidth = 14;
    const startCoord = -((numBlocks * blockSize + (numBlocks - 1) * roadWidth) / 2) + blockSize / 2;

    for (let i = 0; i < numBlocks - 1; i++) {
      const roadCoord = startCoord + i * (blockSize + roadWidth) + blockSize / 2 + roadWidth / 2;

      // Streetlights along avenue
      for (let pos = -100; pos <= 100; pos += 25) {
        // Horizontal road lights
        this.addProp(this.createStreetlightMesh(), pos, roadCoord - roadWidth / 2 - 0.5, 0.45, 3.6, 1, 30, 'Streetlight', 0);
        this.addProp(this.createStreetlightMesh(), pos, roadCoord + roadWidth / 2 + 0.5, 0.45, 3.6, 1, 30, 'Streetlight', Math.PI);

        // Vertical road lights
        this.addProp(this.createStreetlightMesh(), roadCoord - roadWidth / 2 - 0.5, pos, 0.45, 3.6, 1, 30, 'Streetlight', Math.PI / 2);
        this.addProp(this.createStreetlightMesh(), roadCoord + roadWidth / 2 + 0.5, pos, 0.45, 3.6, 1, 30, 'Streetlight', -Math.PI / 2);
      }

      // City Transit Buses on roads (Tier 3)
      this.addProp(this.createBusMesh(), -40 + i * 35, roadCoord + 3, 2.2, 2.4, 3, 290, 'Metro Transit Bus', 0);
      this.addProp(this.createBusMesh(), roadCoord - 3, 30 - i * 40, 2.2, 2.4, 3, 290, 'City Bus', Math.PI / 2);

      // Taxis and sedans parked or in lane (Tier 2)
      this.addProp(this.createCarMesh('taxi', 0), -15 + i * 20, roadCoord - 3, 1.3, 1.2, 2, 80, 'NYC Taxi', 0);
      this.addProp(this.createCarMesh('sedan', 1), roadCoord + 3, -20 + i * 25, 1.3, 1.2, 2, 75, 'Sedan', Math.PI / 2);

      // Fire hydrants at road corners (Tier 1)
      this.addProp(this.createFireHydrantMesh(), roadCoord - roadWidth / 2 - 1, -50 + i * 30, 0.3, 0.7, 1, 15, 'Fire Hydrant');
    }
  }

  // ==========================================
  // 3D MESH GENERATORS (Clean low-poly stylized)
  // ==========================================

  // Tier 1: Traffic Cone
  createTrafficConeMesh() {
    const group = new THREE.Group();
    const base = new THREE.Mesh(this.geo.box, this.mat.coneOrange);
    base.scale.set(0.48, 0.08, 0.48);
    base.position.y = 0.04;
    group.add(base);

    const cone = new THREE.Mesh(this.geo.cone, this.mat.coneOrange);
    cone.scale.set(0.38, 0.65, 0.38);
    cone.position.y = 0.36;
    group.add(cone);

    const stripe = new THREE.Mesh(this.geo.cylinder, this.mat.coneWhite);
    stripe.scale.set(0.24, 0.12, 0.24);
    stripe.position.y = 0.32;
    group.add(stripe);

    return group;
  }

  // Tier 1: Fire Hydrant
  createFireHydrantMesh() {
    const group = new THREE.Group();
    const body = new THREE.Mesh(this.geo.cylinder, this.mat.hydrantRed);
    body.scale.set(0.3, 0.65, 0.3);
    body.position.y = 0.35;
    group.add(body);

    const cap = new THREE.Mesh(this.geo.sphere, this.mat.hydrantSilver);
    cap.scale.set(0.28, 0.18, 0.28);
    cap.position.y = 0.7;
    group.add(cap);

    const nozzle1 = new THREE.Mesh(this.geo.cylinder, this.mat.hydrantSilver);
    nozzle1.rotation.z = Math.PI / 2;
    nozzle1.scale.set(0.12, 0.48, 0.12);
    nozzle1.position.y = 0.45;
    group.add(nozzle1);

    return group;
  }

  // Tier 1: Trash Can
  createTrashCanMesh() {
    const group = new THREE.Group();
    const bin = new THREE.Mesh(this.geo.cylinder, this.mat.trashCan);
    bin.scale.set(0.42, 0.75, 0.42);
    bin.position.y = 0.4;
    group.add(bin);

    const lid = new THREE.Mesh(this.geo.cylinder, this.mat.trashLid);
    lid.scale.set(0.48, 0.12, 0.48);
    lid.position.y = 0.8;
    group.add(lid);

    return group;
  }

  // Tier 1: Bicycle
  createBicycleMesh() {
    const group = new THREE.Group();
    // Wheels
    const w1 = new THREE.Mesh(this.geo.cylinder, this.mat.tireBlack);
    w1.rotation.z = Math.PI / 2;
    w1.scale.set(0.35, 0.08, 0.35);
    w1.position.set(0, 0.2, -0.45);
    group.add(w1);

    const w2 = new THREE.Mesh(this.geo.cylinder, this.mat.tireBlack);
    w2.rotation.z = Math.PI / 2;
    w2.scale.set(0.35, 0.08, 0.35);
    w2.position.set(0, 0.2, 0.45);
    group.add(w2);

    // Frame
    const frame = new THREE.Mesh(this.geo.box, this.mat.bikeFrame);
    frame.scale.set(0.08, 0.35, 0.7);
    frame.position.set(0, 0.35, 0);
    group.add(frame);

    // Handlebars
    const handle = new THREE.Mesh(this.geo.cylinder, this.mat.metalPole);
    handle.rotation.x = Math.PI / 2;
    handle.scale.set(0.06, 0.4, 0.06);
    handle.position.set(0, 0.58, 0.38);
    group.add(handle);

    return group;
  }

  // Tier 1: Streetlight
  createStreetlightMesh() {
    const group = new THREE.Group();
    const pole = new THREE.Mesh(this.geo.cylinder, this.mat.metalPole);
    pole.scale.set(0.12, 3.4, 0.12);
    pole.position.y = 1.7;
    group.add(pole);

    const arm = new THREE.Mesh(this.geo.box, this.mat.metalPole);
    arm.scale.set(0.1, 0.1, 0.9);
    arm.position.set(0, 3.35, 0.35);
    group.add(arm);

    const lamp = new THREE.Mesh(this.geo.box, this.mat.lampGlow);
    lamp.scale.set(0.24, 0.12, 0.32);
    lamp.position.set(0, 3.25, 0.7);
    group.add(lamp);

    return group;
  }

  // Tier 1: Stylized Pedestrian / Mannequin
  createPedestrianMesh() {
    const group = new THREE.Group();
    const skinMat = this.mat.pedestrianSkin;
    const clothMat = this.mat.pedestrianClothes[Math.floor(Math.random() * this.mat.pedestrianClothes.length)];

    // Legs
    const legs = new THREE.Mesh(this.geo.box, this.mat.tireBlack);
    legs.scale.set(0.26, 0.5, 0.18);
    legs.position.y = 0.25;
    group.add(legs);

    // Torso / Shirt
    const torso = new THREE.Mesh(this.geo.box, clothMat);
    torso.scale.set(0.34, 0.48, 0.24);
    torso.position.y = 0.68;
    group.add(torso);

    // Head
    const head = new THREE.Mesh(this.geo.sphere, skinMat);
    head.scale.set(0.22, 0.24, 0.22);
    head.position.y = 1.05;
    group.add(head);

    return group;
  }

  // Tier 2: Park Bench
  createBenchMesh() {
    const group = new THREE.Group();
    // Slats
    const seat = new THREE.Mesh(this.geo.box, this.mat.woodBench);
    seat.scale.set(0.7, 0.08, 1.8);
    seat.position.set(0, 0.38, 0);
    group.add(seat);

    const back = new THREE.Mesh(this.geo.box, this.mat.woodBench);
    back.scale.set(0.08, 0.5, 1.8);
    back.position.set(-0.3, 0.65, 0);
    group.add(back);

    // Iron legs
    const leg1 = new THREE.Mesh(this.geo.box, this.mat.benchIron);
    leg1.scale.set(0.68, 0.35, 0.1);
    leg1.position.set(-0.02, 0.18, -0.75);
    group.add(leg1);

    const leg2 = new THREE.Mesh(this.geo.box, this.mat.benchIron);
    leg2.scale.set(0.68, 0.35, 0.1);
    leg2.position.set(-0.02, 0.18, 0.75);
    group.add(leg2);

    return group;
  }

  // Tier 2: Tree
  createTreeMesh(type = 'deciduous') {
    const group = new THREE.Group();
    const trunk = new THREE.Mesh(this.geo.cylinder, this.mat.treeWood);
    trunk.scale.set(0.4, 2.0, 0.4);
    trunk.position.y = 1.0;
    trunk.castShadow = true;
    group.add(trunk);

    if (type === 'pine') {
      for (let i = 0; i < 3; i++) {
        const cone = new THREE.Mesh(this.geo.cone, this.mat.pineLeaves);
        cone.scale.set(2.4 - i * 0.5, 1.6, 2.4 - i * 0.5);
        cone.position.y = 2.0 + i * 1.1;
        cone.castShadow = true;
        group.add(cone);
      }
    } else {
      const mat = Math.random() > 0.5 ? this.mat.treeLeaves1 : this.mat.treeLeaves2;
      const foliage1 = new THREE.Mesh(this.geo.dodecahedron, mat);
      foliage1.scale.set(2.2, 2.0, 2.2);
      foliage1.position.y = 2.7;
      foliage1.castShadow = true;
      group.add(foliage1);

      const foliage2 = new THREE.Mesh(this.geo.dodecahedron, mat);
      foliage2.scale.set(1.6, 1.5, 1.6);
      foliage2.position.set(0.4, 3.5, 0.3);
      foliage2.castShadow = true;
      group.add(foliage2);
    }

    return group;
  }

  // Tier 2: Bush
  createBushMesh() {
    const group = new THREE.Group();
    const bush = new THREE.Mesh(this.geo.dodecahedron, this.mat.bushGreen);
    bush.scale.set(1.2, 0.9, 1.2);
    bush.position.y = 0.5;
    bush.castShadow = true;
    group.add(bush);
    return group;
  }

  // Tier 2: Hotdog Stand
  createHotdogStandMesh() {
    const group = new THREE.Group();
    const cart = new THREE.Mesh(this.geo.box, this.mat.hotdogStand);
    cart.scale.set(1.4, 0.9, 1.0);
    cart.position.y = 0.55;
    group.add(cart);

    const umbrellaPole = new THREE.Mesh(this.geo.cylinder, this.mat.metalPole);
    umbrellaPole.scale.set(0.06, 1.8, 0.06);
    umbrellaPole.position.set(0.3, 1.2, 0);
    group.add(umbrellaPole);

    const awning = new THREE.Mesh(this.geo.cone, this.mat.awningStripe);
    awning.scale.set(1.6, 0.6, 1.6);
    awning.position.set(0.3, 2.1, 0);
    group.add(awning);

    return group;
  }

  // Tier 2: Car (Sedan / Taxi)
  createCarMesh(type = 'sedan', colorIdx = 0) {
    const group = new THREE.Group();
    const carMat = type === 'taxi' ? this.mat.carTaxi : this.mat.carSedan[colorIdx % this.mat.carSedan.length];

    // Chassis base
    const body = new THREE.Mesh(this.geo.box, carMat);
    body.scale.set(1.6, 0.65, 3.2);
    body.position.y = 0.5;
    body.castShadow = true;
    group.add(body);

    // Cabin
    const cabin = new THREE.Mesh(this.geo.box, this.mat.carGlass);
    cabin.scale.set(1.35, 0.58, 1.7);
    cabin.position.set(0, 0.95, -0.15);
    group.add(cabin);

    // Wheels
    const wheelOffsets = [
      [-0.8, 0.28, -0.9], [0.8, 0.28, -0.9],
      [-0.8, 0.28, 0.9], [0.8, 0.28, 0.9]
    ];
    wheelOffsets.forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(this.geo.cylinder, this.mat.tireBlack);
      wheel.rotation.z = Math.PI / 2;
      wheel.scale.set(0.36, 0.2, 0.36);
      wheel.position.set(wx, wy, wz);
      group.add(wheel);
    });

    // Taxi roof light
    if (type === 'taxi') {
      const roofSign = new THREE.Mesh(this.geo.box, this.mat.roadMarking);
      roofSign.scale.set(0.6, 0.18, 0.25);
      roofSign.position.set(0, 1.32, -0.15);
      group.add(roofSign);
    }

    return group;
  }

  // Tier 2: Delivery Van
  createDeliveryVanMesh() {
    const group = new THREE.Group();
    const body = new THREE.Mesh(this.geo.box, this.mat.deliveryVan);
    body.scale.set(1.8, 1.6, 3.8);
    body.position.y = 1.05;
    body.castShadow = true;
    group.add(body);

    const stripe = new THREE.Mesh(this.geo.box, this.mat.vanAccent);
    stripe.scale.set(1.82, 0.35, 3.8);
    stripe.position.y = 1.05;
    group.add(stripe);

    const cabinGlass = new THREE.Mesh(this.geo.box, this.mat.carGlass);
    cabinGlass.scale.set(1.7, 0.7, 1.0);
    cabinGlass.position.set(0, 1.35, 1.1);
    group.add(cabinGlass);

    const wheels = [
      [-0.9, 0.35, -1.1], [0.9, 0.35, -1.1],
      [-0.9, 0.35, 1.1], [0.9, 0.35, 1.1]
    ];
    wheels.forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(this.geo.cylinder, this.mat.tireBlack);
      wheel.rotation.z = Math.PI / 2;
      wheel.scale.set(0.45, 0.22, 0.45);
      wheel.position.set(wx, wy, wz);
      group.add(wheel);
    });

    return group;
  }

  // Tier 3: Metro Transit Bus
  createBusMesh() {
    const group = new THREE.Group();
    const body = new THREE.Mesh(this.geo.box, this.mat.busBody);
    body.scale.set(2.2, 1.9, 6.8);
    body.position.y = 1.25;
    body.castShadow = true;
    group.add(body);

    // Window bands
    const windows = new THREE.Mesh(this.geo.box, this.mat.carGlass);
    windows.scale.set(2.25, 0.75, 6.2);
    windows.position.y = 1.6;
    group.add(windows);

    // Wheels
    const wheels = [
      [-1.12, 0.42, -2.1], [1.12, 0.42, -2.1],
      [-1.12, 0.42, 2.1], [1.12, 0.42, 2.1]
    ];
    wheels.forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(this.geo.cylinder, this.mat.tireBlack);
      wheel.rotation.z = Math.PI / 2;
      wheel.scale.set(0.55, 0.28, 0.55);
      wheel.position.set(wx, wy, wz);
      group.add(wheel);
    });

    return group;
  }

  // Tier 3: Semi Truck & Container
  createSemiTruckMesh() {
    const group = new THREE.Group();
    // Cab
    const cab = new THREE.Mesh(this.geo.box, this.mat.truckCab);
    cab.scale.set(2.4, 2.3, 2.6);
    cab.position.set(0, 1.45, 3.2);
    cab.castShadow = true;
    group.add(cab);

    // Windshield
    const cabGlass = new THREE.Mesh(this.geo.box, this.mat.carGlass);
    cabGlass.scale.set(2.25, 0.85, 0.9);
    cabGlass.position.set(0, 1.85, 3.75);
    group.add(cabGlass);

    // Long Cargo Container
    const trailer = new THREE.Mesh(this.geo.box, this.mat.truckTrailer);
    trailer.scale.set(2.35, 2.6, 6.5);
    trailer.position.set(0, 1.7, -1.6);
    trailer.castShadow = true;
    group.add(trailer);

    return group;
  }

  // Tier 3: Billboard
  createBillboardMesh() {
    const group = new THREE.Group();
    // Twin metal posts
    const post1 = new THREE.Mesh(this.geo.cylinder, this.mat.billboardFrame);
    post1.scale.set(0.25, 5.0, 0.25);
    post1.position.set(-1.6, 2.5, 0);
    group.add(post1);

    const post2 = new THREE.Mesh(this.geo.cylinder, this.mat.billboardFrame);
    post2.scale.set(0.25, 5.0, 0.25);
    post2.position.set(1.6, 2.5, 0);
    group.add(post2);

    // Board
    const board = new THREE.Mesh(this.geo.box, this.mat.billboardPoster);
    board.scale.set(5.2, 2.6, 0.4);
    board.position.set(0, 5.2, 0);
    board.castShadow = true;
    group.add(board);

    return group;
  }

  // Tier 3: Small Shop / Bakery
  createShopMesh(variant = 0) {
    const group = new THREE.Group();
    const building = new THREE.Mesh(this.geo.box, this.mat.shopBrick);
    building.scale.set(4.8, 3.8, 4.8);
    building.position.y = 1.9;
    building.castShadow = true;
    group.add(building);

    // Awning
    const awning = new THREE.Mesh(this.geo.box, this.mat.shopAwning);
    awning.scale.set(4.2, 0.5, 1.2);
    awning.position.set(0, 2.2, 2.6);
    group.add(awning);

    // Storefront Window
    const win = new THREE.Mesh(this.geo.box, this.mat.carGlass);
    win.scale.set(3.8, 1.6, 0.2);
    win.position.set(0, 1.2, 2.45);
    group.add(win);

    return group;
  }

  // Tier 3: Gas Station
  createGasStationMesh() {
    const group = new THREE.Group();
    // Canopy roof
    const roof = new THREE.Mesh(this.geo.box, this.mat.gasCanopy);
    roof.scale.set(6.2, 0.6, 5.4);
    roof.position.y = 3.6;
    roof.castShadow = true;
    group.add(roof);

    // Pillars
    const p1 = new THREE.Mesh(this.geo.cylinder, this.mat.metalPole);
    p1.scale.set(0.3, 3.4, 0.3);
    p1.position.set(-2.2, 1.7, -1.8);
    group.add(p1);

    const p2 = new THREE.Mesh(this.geo.cylinder, this.mat.metalPole);
    p2.scale.set(0.3, 3.4, 0.3);
    p2.position.set(2.2, 1.7, -1.8);
    group.add(p2);

    const p3 = new THREE.Mesh(this.geo.cylinder, this.mat.metalPole);
    p3.scale.set(0.3, 3.4, 0.3);
    p3.position.set(-2.2, 1.7, 1.8);
    group.add(p3);

    const p4 = new THREE.Mesh(this.geo.cylinder, this.mat.metalPole);
    p4.scale.set(0.3, 3.4, 0.3);
    p4.position.set(2.2, 1.7, 1.8);
    group.add(p4);

    // Gas pump islands
    const pump1 = new THREE.Mesh(this.geo.box, this.mat.gasPump);
    pump1.scale.set(0.8, 1.2, 1.6);
    pump1.position.set(-1.2, 0.6, 0);
    group.add(pump1);

    const pump2 = new THREE.Mesh(this.geo.box, this.mat.gasPump);
    pump2.scale.set(0.8, 1.2, 1.6);
    pump2.position.set(1.2, 0.6, 0);
    group.add(pump2);

    return group;
  }

  // Tier 3: Townhouse
  createTownhouseMesh(variant = 0) {
    const group = new THREE.Group();
    const walls = new THREE.Mesh(this.geo.box, this.mat.townhouseWall);
    walls.scale.set(4.5, 5.5, 4.5);
    walls.position.y = 2.75;
    walls.castShadow = true;
    group.add(walls);

    // Sloped roof
    const roof = new THREE.Mesh(this.geo.cone, this.mat.townhouseRoof);
    roof.scale.set(3.8, 1.8, 3.8);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 6.0;
    roof.castShadow = true;
    group.add(roof);

    // Chimney
    const chimney = new THREE.Mesh(this.geo.box, this.mat.shopBrick);
    chimney.scale.set(0.7, 1.6, 0.7);
    chimney.position.set(1.2, 6.2, 0.8);
    group.add(chimney);

    return group;
  }

  // Tier 3: Cargo Container
  createContainerMesh() {
    const group = new THREE.Group();
    const c = new THREE.Mesh(this.geo.box, this.mat.truckCab);
    c.scale.set(3.8, 1.9, 2.2);
    c.position.y = 0.95;
    c.castShadow = true;
    group.add(c);
    return group;
  }

  // Tier 4: Apartment Complex
  createApartmentMesh() {
    const group = new THREE.Group();
    const body = new THREE.Mesh(this.geo.box, this.mat.apartmentWall);
    body.scale.set(7.5, 11.0, 7.5);
    body.position.y = 5.5;
    body.castShadow = true;
    group.add(body);

    // Balconies
    for (let floor = 2; floor <= 9; floor += 2.2) {
      const balcony = new THREE.Mesh(this.geo.box, this.mat.benchIron);
      balcony.scale.set(5.5, 0.35, 0.7);
      balcony.position.set(0, floor, 3.85);
      group.add(balcony);
    }

    // Rooftop water tank
    const tank = new THREE.Mesh(this.geo.cylinder, this.mat.townhouseRoof);
    tank.scale.set(1.4, 1.8, 1.4);
    tank.position.set(1.8, 11.9, 1.5);
    group.add(tank);

    return group;
  }

  // Tier 4: Mid-Rise Office Building
  createOfficeMesh(height = 16) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(this.geo.box, this.mat.officeGlass);
    body.scale.set(6.8, height, 6.8);
    body.position.y = height / 2;
    body.castShadow = true;
    group.add(body);

    // Helipad on top
    const helipad = new THREE.Mesh(this.geo.cylinder, this.mat.asphalt);
    helipad.scale.set(2.4, 0.2, 2.4);
    helipad.position.set(0, height + 0.1, 0);
    group.add(helipad);

    return group;
  }

  // Tier 4: Construction Crane
  createConstructionCraneMesh() {
    const group = new THREE.Group();
    // Tower mast
    const mast = new THREE.Mesh(this.geo.box, this.mat.craneYellow);
    mast.scale.set(1.2, 22, 1.2);
    mast.position.y = 11;
    mast.castShadow = true;
    group.add(mast);

    // Horizontal Boom
    const boom = new THREE.Mesh(this.geo.box, this.mat.craneYellow);
    boom.scale.set(1.0, 1.0, 15);
    boom.position.set(0, 21.5, 3.5);
    boom.castShadow = true;
    group.add(boom);

    // Counterweight
    const counterWeight = new THREE.Mesh(this.geo.box, this.mat.asphalt);
    counterWeight.scale.set(1.8, 1.4, 2.4);
    counterWeight.position.set(0, 21.5, -3.2);
    group.add(counterWeight);

    return group;
  }

  // Tier 4: Towering Glass Skyscraper
  createSkyscraperMesh(type = 0, height = 34) {
    const group = new THREE.Group();
    const glassMat = type === 0 ? this.mat.skyscraperGlass1 : (type === 1 ? this.mat.skyscraperGlass2 : this.mat.skyscraperGold);

    // Multi-tier stepped design
    const tier1H = height * 0.55;
    const body1 = new THREE.Mesh(this.geo.box, glassMat);
    body1.scale.set(8.5, tier1H, 8.5);
    body1.position.y = tier1H / 2;
    body1.castShadow = true;
    group.add(body1);

    const tier2H = height * 0.32;
    const body2 = new THREE.Mesh(this.geo.box, glassMat);
    body2.scale.set(6.2, tier2H, 6.2);
    body2.position.y = tier1H + tier2H / 2;
    body2.castShadow = true;
    group.add(body2);

    const tier3H = height * 0.13;
    const body3 = new THREE.Mesh(this.geo.box, glassMat);
    body3.scale.set(4.0, tier3H, 4.0);
    body3.position.y = tier1H + tier2H + tier3H / 2;
    body3.castShadow = true;
    group.add(body3);

    // Spire antenna needle
    const spire = new THREE.Mesh(this.geo.cylinder, this.mat.buildingSpire);
    spire.scale.set(0.25, 6.0, 0.25);
    spire.position.y = height + 3.0;
    group.add(spire);

    // Glowing window accents
    for (let w = 4; w < height - 6; w += 3.5) {
      const winAccent = new THREE.Mesh(this.geo.box, this.mat.windowEmissive);
      winAccent.scale.set(8.55, 0.3, 8.55);
      winAccent.position.y = w;
      group.add(winAccent);
    }

    return group;
  }

  // ==========================================
  // PROP REGISTRATION & SPATIAL PARTITIONING
  // ==========================================

  addProp(mesh, x, z, baseRadius, height, tier, mass, name, rotY = 0) {
    mesh.position.set(x, 0, z);
    mesh.rotation.y = rotY;
    this.scene.add(mesh);

    const prop = {
      id: this.props.length,
      mesh,
      x,
      z,
      initialY: 0,
      initialRotY: rotY,
      baseRadius,
      height,
      tier,
      mass,
      name,
      active: true,
      swallowing: false,
      swallowingBy: null,
      swallowProgress: 0,
      swallowDuration: 0.35 + tier * 0.12 // Tier 1: 0.47s, Tier 4: 0.83s
    };

    this.props.push(prop);
    this.addToSpatialGrid(prop);
    return prop;
  }

  addPedestrian(x, z) {
    const mesh = this.createPedestrianMesh();
    mesh.position.set(x, 0, z);
    mesh.rotation.y = Math.random() * Math.PI * 2;
    this.scene.add(mesh);

    const prop = {
      id: this.props.length,
      mesh,
      x,
      z,
      initialY: 0,
      initialRotY: mesh.rotation.y,
      baseRadius: 0.32,
      height: 1.1,
      tier: 1,
      mass: 18,
      name: 'Pedestrian',
      active: true,
      swallowing: false,
      swallowingBy: null,
      swallowProgress: 0,
      swallowDuration: 0.38,
      isPedestrian: true,
      walkSpeed: 0.02 + Math.random() * 0.02,
      walkDir: Math.random() * Math.PI * 2,
      walkWobble: Math.random() * 10
    };

    this.props.push(prop);
    this.pedestrians.push(prop);
    this.addToSpatialGrid(prop);
  }

  getGridKey(x, z) {
    const gx = Math.floor(x / this.gridCellSize);
    const gz = Math.floor(z / this.gridCellSize);
    return `${gx},${gz}`;
  }

  addToSpatialGrid(prop) {
    const key = this.getGridKey(prop.x, prop.z);
    if (!this.spatialGrid.has(key)) {
      this.spatialGrid.set(key, []);
    }
    this.spatialGrid.get(key).push(prop.id);
  }

  // Fast neighbor query around a coordinate within a radius
  getPropsNear(x, z, radius) {
    const results = [];
    const minGx = Math.floor((x - radius) / this.gridCellSize);
    const maxGx = Math.floor((x + radius) / this.gridCellSize);
    const minGz = Math.floor((z - radius) / this.gridCellSize);
    const maxGz = Math.floor((z + radius) / this.gridCellSize);

    for (let gx = minGx; gx <= maxGx; gx++) {
      for (let gz = minGz; gz <= maxGz; gz++) {
        const key = `${gx},${gz}`;
        const ids = this.spatialGrid.get(key);
        if (ids) {
          for (let i = 0; i < ids.length; i++) {
            const prop = this.props[ids[i]];
            if (prop && prop.active) {
              results.push(prop);
            }
          }
        }
      }
    }
    return results;
  }

  // Update animated props (pedestrians walking & wobble)
  update(delta) {
    for (let i = 0; i < this.pedestrians.length; i++) {
      const p = this.pedestrians[i];
      if (p.active && !p.swallowing) {
        p.walkWobble += delta * 6;
        p.mesh.rotation.z = Math.sin(p.walkWobble) * 0.08;
        
        // Gentle walking patrol
        p.x += Math.cos(p.walkDir) * p.walkSpeed;
        p.z += Math.sin(p.walkDir) * p.walkSpeed;
        p.mesh.position.x = p.x;
        p.mesh.position.z = p.z;

        // Change direction randomly or if out of bounds
        if (Math.random() < 0.01 || Math.abs(p.x) > 120 || Math.abs(p.z) > 120) {
          p.walkDir += (Math.random() - 0.5) * Math.PI;
          p.mesh.rotation.y = -p.walkDir + Math.PI / 2;
        }
      }
    }
  }

  // Reset all props for Play Again
  reset() {
    this.props.forEach((prop) => {
      prop.active = true;
      prop.swallowing = false;
      prop.swallowingBy = null;
      prop.swallowProgress = 0;
      prop.mesh.visible = true;
      prop.mesh.position.set(prop.x, prop.initialY, prop.z);
      prop.mesh.rotation.set(0, prop.initialRotY, 0);
      prop.mesh.scale.set(1, 1, 1);
    });
  }
}
