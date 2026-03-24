import { PerspectiveCamera, Scene, WebGLRenderer, AxesHelper, BoxGeometry, MeshBasicMaterial, Mesh, TextureLoader } from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import pkq from './src/public/pkq.png'
let scene, camera, renderer, mesh, controls;

// 初始化场景
function initScene() {
  scene = new Scene();
}

// 初始化相机
function initCamera() {
  camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 10; // 往外拉一点
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

// 引入物体
function initMesh() {
  const geometry = new BoxGeometry(); // 物体形状
    const texture = new TextureLoader().load(pkq); // 物体纹理
    const material = new MeshBasicMaterial({
       color: 'yellow', // 物体颜色
       map: texture, // 物体纹理
      }); // 物体材质
    mesh = new Mesh(geometry, material); // 物体网格
    scene.add(mesh); // 把物体添加到场景中
}

function init() {
  initScene();
  initCamera();
  initRenderer();
  initAxesHelper();
  initOrbitControls();
  initMesh();
}

init();

// 动画
function render() {
  if (mesh.position.x >3) {

  } else {
    mesh.position.x += 0.01; // 物体往右移动
  }
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