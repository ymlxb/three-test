import {
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  AxesHelper,
  GridHelper,
  AmbientLight,
  DirectionalLight,
  MeshPhysicalMaterial,
  Box3,
  Vector3,
  Group,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import GUI from "lil-gui";
import carModelUrl from "./src/public/car.glb";

let scene, camera, renderer, controls, grid, gui;
let carGroup;
let doorOpenProgress = 0;
let doorTargetProgress = 0;

const carParts = {
  body: [],
  glass: [],
};

const doorControllers = [];

const state = {
  bodyColor: "#2e86de",
  glassColor: "#86c5ff",
  doorOpen: false,
};

// 初始化场景
function initScene() {
  scene = new Scene();
}

// 初始化相机
function initCamera() {
  camera = new PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );
  camera.position.set(4.25, 1.4, -4.5);
}

// 初始化渲染器
function initRenderer() {
  renderer = new WebGLRenderer({
    antialias: true, // 抗锯齿
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
}

// 初始化坐标
function initAxesHelper() {
  const axesHelper = new AxesHelper(3);
  scene.add(axesHelper);
}

// 初始化轨道控制器
function initOrbitControls() {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
}

// // 引入物体
// function initMesh() {
//   const geometry = new BoxGeometry(); // 物体形状
//     const texture = new TextureLoader().load(pkq); // 物体纹理
//     const material = new MeshBasicMaterial({
//        color: 'yellow', // 物体颜色
//        map: texture, // 物体纹理
//       }); // 物体材质
//     mesh = new Mesh(geometry, material); // 物体网格
//     scene.add(mesh); // 把物体添加到场景中
// }

// 绘制地面网格
function initGridHelper() {
  grid = new GridHelper(20, 40, "red", "gray"); // 网格大小20，分割40，主线红色，次线灰色\
  grid.material.opacity = 0.5; // 网格线透明度
  grid.material.transparent = true; // 启用透明度
  scene.add(grid);
}

// 初始化灯光
function initLight() {
  const ambientLight = new AmbientLight("#fff", 1.8); // 环境光
  scene.add(ambientLight);

  const directionalLight = new DirectionalLight(0xffffff, 1.2); // 平行光
  directionalLight.position.set(10, 10, 10);
  scene.add(directionalLight);
}

function isBodyMeshName(name) {
  return /(body|chassis|carpaint|paint|hood|bonnet|trunk|fender|bumper)/i.test(
    name,
  );
}

function isGlassMeshName(name) {
  return /(glass|window|windshield|windscreen)/i.test(name);
}

function isDoorMeshName(name) {
  return /(door|frontdoor|reardoor)/i.test(name);
}

function ensureUniqueMaterial(mesh) {
  if (Array.isArray(mesh.material)) {
    mesh.material = mesh.material.map((mat) => mat?.clone?.() ?? mat);
  } else if (mesh.material?.clone) {
    mesh.material = mesh.material.clone();
  }
}

function traverseMaterials(mesh, callback) {
  if (Array.isArray(mesh.material)) {
    mesh.material.forEach((mat, index) => {
      if (mat) callback(mat, index, true);
    });
    return;
  }

  if (mesh.material) {
    callback(mesh.material, 0, false);
  }
}

function setupCarParts(root) {
  carParts.body = [];
  carParts.glass = [];
  doorControllers.length = 0;

  const carBounds = new Box3().setFromObject(root);
  const carCenter = carBounds.getCenter(new Vector3());
  const carSize = carBounds.getSize(new Vector3());

  function registerDoorController(mesh, sideSign, usePivot = true) {
    let target = mesh;

    if (usePivot && mesh.parent) {
      const worldBounds = new Box3().setFromObject(mesh);
      const center = worldBounds.getCenter(new Vector3());

      const hingeWorld = new Vector3(
        sideSign > 0 ? worldBounds.max.x : worldBounds.min.x,
        center.y,
        center.z >= carCenter.z ? worldBounds.max.z : worldBounds.min.z,
      );

      const parent = mesh.parent;
      const pivot = new Group();
      pivot.name = `door_pivot_${mesh.name || "auto"}`;

      parent.add(pivot);
      parent.worldToLocal(hingeWorld);
      pivot.position.copy(hingeWorld);
      pivot.attach(mesh);
      target = pivot;
    }

    doorControllers.push({
      target,
      baseY: target.rotation.y,
      sign: sideSign,
    });
  }

  root.traverse((obj) => {
    if (!obj.isMesh) return;

    obj.castShadow = true;
    obj.receiveShadow = true;

    const meshName = (obj.name || "").toLowerCase();

    if (isGlassMeshName(meshName)) {
      ensureUniqueMaterial(obj);
      carParts.glass.push(obj);
      return;
    }

    if (isDoorMeshName(meshName)) {
      ensureUniqueMaterial(obj);
      const isLeftDoor = /(left|driver|lf|lr|_l|l_)/i.test(meshName);
      const sign = isLeftDoor ? 1 : -1;
      registerDoorController(obj, sign, true);
    }

    if (isBodyMeshName(meshName)) {
      ensureUniqueMaterial(obj);
      carParts.body.push(obj);
    }
  });

  // 兜底：如果模型命名不规范，自动挑选非轮胎/非玻璃网格作为车身
  if (carParts.body.length === 0) {
    root.traverse((obj) => {
      if (!obj.isMesh) return;
      const meshName = (obj.name || "").toLowerCase();

      const isWheelLike = /(wheel|tire|rim|tyre)/i.test(meshName);
      const isGlassLike = isGlassMeshName(meshName);
      const isDoorLike = isDoorMeshName(meshName);

      if (!isWheelLike && !isGlassLike && !isDoorLike) {
        ensureUniqueMaterial(obj);
        carParts.body.push(obj);
      }
    });
  }

  // 如果没有识别到门，自动按空间位置挑选左右两侧中部网格作为“门”候选
  if (doorControllers.length === 0) {
    const candidates = [];

    root.traverse((obj) => {
      if (!obj.isMesh || !obj.parent) return;

      const meshName = (obj.name || "").toLowerCase();
      const isWheelLike = /(wheel|tire|rim|tyre)/i.test(meshName);
      const isGlassLike = isGlassMeshName(meshName);
      if (isWheelLike || isGlassLike) return;

      const worldBounds = new Box3().setFromObject(obj);
      const center = worldBounds.getCenter(new Vector3());

      const sideOffset = Math.abs(center.x - carCenter.x);
      const zOffset = Math.abs(center.z - carCenter.z);
      const minY = carBounds.min.y + carSize.y * 0.2;
      const maxY = carBounds.min.y + carSize.y * 0.85;

      const isSideArea = sideOffset > carSize.x * 0.18;
      const isMiddleZ = zOffset < carSize.z * 0.45;
      const isDoorHeight = center.y > minY && center.y < maxY;

      if (isSideArea && isMiddleZ && isDoorHeight) {
        candidates.push({
          mesh: obj,
          sideSign: center.x >= carCenter.x ? 1 : -1,
          score: sideOffset - zOffset * 0.2,
        });
      }
    });

    candidates
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .forEach((item) => registerDoorController(item.mesh, item.sideSign, true));
  }

  console.log(
    `车门识别完成：${doorControllers.length} 个可动门部件（自动识别可能不完全准确）`,
  );
}

function applyBodyColor(color) {
  carParts.body.forEach((mesh) => {
    traverseMaterials(mesh, (mat) => {
      if (mat.color) {
        mat.color.set(color);
        mat.needsUpdate = true;
      }
    });
  });
}

function applyGlassColor(color) {
  carParts.glass.forEach((mesh) => {
    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map((mat) => {
        const glassMat = new MeshPhysicalMaterial({
          color,
          metalness: 0,
          roughness: 0.03,
          transmission: 0.9,
          transparent: true,
          opacity: 0.45,
          ior: 1.45,
          thickness: 0.2,
          envMapIntensity: 1,
          map: mat?.map ?? null,
          side: mat?.side,
        });
        return glassMat;
      });
      return;
    }

    mesh.material = new MeshPhysicalMaterial({
      color,
      metalness: 0,
      roughness: 0.03,
      transmission: 0.9,
      transparent: true,
      opacity: 0.45,
      ior: 1.45,
      thickness: 0.2,
      envMapIntensity: 1,
      map: mesh.material?.map ?? null,
      side: mesh.material?.side,
    });
  });
}

function updateDoorAnimation() {
  if (doorControllers.length === 0) return;

  doorOpenProgress += (doorTargetProgress - doorOpenProgress) * 0.12;

  if (Math.abs(doorTargetProgress - doorOpenProgress) < 0.001) {
    doorOpenProgress = doorTargetProgress;
  }

  const openAngle = Math.PI / 3; // 60度

  doorControllers.forEach((door) => {
    door.target.rotation.y = door.baseY + door.sign * openAngle * doorOpenProgress;
  });
}

function initGUI() {
  gui = new GUI({ title: "车辆控制面板" });
  const folder = gui.addFolder("材质与车门");

  folder
    .addColor(state, "bodyColor")
    .name("车身颜色")
    .onChange((value) => applyBodyColor(value));

  folder
    .addColor(state, "glassColor")
    .name("玻璃颜色")
    .onChange((value) => applyGlassColor(value));

  folder
    .add(state, "doorOpen")
    .name("开门/关门")
    .onChange((value) => {
      doorTargetProgress = value ? 1 : 0;
    });

  const actions = {
    开门: () => {
      state.doorOpen = true;
      doorTargetProgress = 1;
    },
    关门: () => {
      state.doorOpen = false;
      doorTargetProgress = 0;
    },
  };

  folder.add(actions, "开门");
  folder.add(actions, "关门");
  folder.open();
}

// 加载汽车模型
function loadCarModel() {
  const loader = new GLTFLoader();

  loader.load(
    carModelUrl,
    function (gltf) {
      carGroup = gltf.scene;
      carGroup.rotation.y = Math.PI; // 根据模型朝向调整旋转
      carGroup.scale.set(0.5, 0.5, 0.5); // 根据模型大小调整缩放
      scene.add(carGroup);

      setupCarParts(carGroup);
      applyBodyColor(state.bodyColor);
      applyGlassColor(state.glassColor);
    },
    undefined,
    function (error) {
      console.error("模型加载失败:", error);
    },
  );
}

function init() {
  initScene();
  initCamera();
  initRenderer();
  initAxesHelper();
  initOrbitControls();
  initLight(); // 添加灯光
  // initMesh();
  initGridHelper();
  initGUI();
  loadCarModel(); // 加载汽车
}

init();

// 动画
function render() {
  controls.update();
  updateDoorAnimation();
  renderer.render(scene, camera); // 把三维场景渲染到页面上
  requestAnimationFrame(render); // 循环调用render函数
}
render();

// 监听视口变化，自适应窗口
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight; // 更新相机宽高比
  camera.updateProjectionMatrix(); // 更新相机投影矩阵
  renderer.setSize(window.innerWidth, window.innerHeight); // 更新渲染器大小
});
