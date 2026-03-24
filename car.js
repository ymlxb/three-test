import {
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  AxesHelper,
  BoxGeometry,
  MeshBasicMaterial,
  Mesh,
  TextureLoader,
  GridHelper,
  AmbientLight,
  DirectionalLight,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import pkq from "./src/public/pkq.png";
import carModelUrl from "./src/public/car.glb";

let scene, camera, renderer, mesh, controls, grid;

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
  camera.position.set(4.25, 1.4, -4.5)
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
  const ambientLight = new AmbientLight('#fff', 2); // 环境光
  scene.add(ambientLight);

  const directionalLight = new DirectionalLight(0xffffff, 1); // 平行光
  directionalLight.position.set(10, 10, 10);
  scene.add(directionalLight);
}

// 加载汽车模型
function loadCarModel() {
  const loader = new GLTFLoader();

  loader.load(
    carModelUrl,
    function (gltf) {
      const car = gltf.scene;
      car.rotation.y = Math.PI; // 根据模型朝向调整旋转
      car.scale.set(0.5, 0.5, 0.5); // 根据模型大小调整缩放
      scene.add(car);
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
  loadCarModel(); // 加载汽车
}

init();

// 动画
function render() {
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
