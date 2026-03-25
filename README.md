# Three.js 从 0 到 1 基础教程与项目实战

欢迎来到 Three.js 学习仓库！本仓库不仅包含实际的代码示例，还附带了这份详细的基础知识教程，旨在帮助你从零开始掌握 Three.js，开启 3D 网页开发之旅。

## 🚀 项目运行指南

在开始学习之前，你可以先运行本项目中的代码，直观感受 Three.js 的效果。

### 1. 安装依赖

本项目使用 `npm` 进行包管理。请确保你的环境中已安装 [Node.js](https://nodejs.org/)。

```bash
npm install
```

### 2. 启动开发服务器

本项目使用 `Parcel` 作为打包工具，支持热更新。

```bash
npm run start
```

启动后，打开浏览器访问 `http://localhost:1234` 即可看到效果。
_目前入口文件配置在 `index.html` 中，引入了 `car.js`。你可以修改 `index.html` 中的 `<script>` 标签来切换不同的示例文件。_

---

## 📚 Three.js 基础知识百科

Three.js 是一个基于 WebGL 的 JavaScript 3D 库。它对 WebGL 复杂的 API 进行了封装，使得在浏览器中创建和显示 3D 图形变得简单而直观。

### 1. 核心三要素 (The Big Three)

任何 Three.js 程序都离不开这三个核心组件：

#### 🎬 场景 (Scene)

场景是所有物体的容器，相当于一个 3D 空间。所有的模型、灯光、相机都需要添加到场景中才能被渲染。

```javascript
import * as THREE from "three";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xefefef); // 设置背景颜色
```

#### 📷 相机 (Camera)

相机决定了我们在屏幕上能看到什么。最常用的是 **透视相机 (PerspectiveCamera)**，它模拟人眼的视觉效果（近大远小）。

```javascript
// 参数：视角(fov), 宽高比(aspect), 近裁剪面(near), 远裁剪面(far)
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.set(0, 2, 5); // 设置相机位置
```

#### 🖼️ 渲染器 (Renderer)

渲染器负责将场景和相机结合，计算出每一帧的画面并绘制到 `<canvas>` 元素上。

```javascript
const renderer = new THREE.WebGLRenderer({ antialias: true }); // 开启抗锯齿
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement); // 将 canvas 添加到页面
```

### 2. 物体 (Objects)

在 Three.js 中，通过 **网格 (Mesh)** 来表示物体。Mesh 由 **几何体 (Geometry)** 和 **材质 (Material)** 组成。

#### 📐 几何体 (Geometry)

决定物体的形状。Three.js 提供了许多内置几何体：

- `BoxGeometry` (立方体)
- `SphereGeometry` (球体)
- `PlaneGeometry` (平面)
- `CylinderGeometry` (圆柱体) 等

```javascript
const geometry = new THREE.BoxGeometry(1, 1, 1); // 长宽高均为1
```

#### 🎨 材质 (Material)

决定物体的外观（颜色、纹理、反光等）。

- `MeshBasicMaterial`: 基础材质，不受光照影响，适合调试。
- `MeshStandardMaterial`: 标准物理材质，受光照影响，效果真实（常用）。
- `MeshLambertMaterial`: 兰伯特材质，无光泽表面。
- `MeshPhongMaterial`: 冯氏材质，有高光。

```javascript
const material = new THREE.MeshStandardMaterial({
  color: 0x00ff00,
  roughness: 0.5, // 粗糙度
  metalness: 0.1, // 金属度
});
```

#### 📦 网格 (Mesh)

将几何体和材质结合生成物体，并添加到场景中。

```javascript
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);
```

### 3. 光源 (Lights)

如果没有光源，使用标准材质的物体将是黑色的。

- **环境光 (AmbientLight)**: 均匀照亮场景中的所有物体，无方向，无阴影。
- **平行光 (DirectionalLight)**: 模拟太阳光，光线平行，通过位置和目标点决定方向，**可以产生阴影**。
- **点光源 (PointLight)**: 类似于灯泡，从一点向四周发散。
- **聚光灯 (SpotLight)**: 手电筒或舞台灯光效果。

```javascript
// 环境光
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // 颜色, 强度
scene.add(ambientLight);

// 平行光
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);
```

### 4. 辅助工具 (Helpers & Controls)

为了方便开发，我们通常会使用一些辅助工具。

#### 🎮 轨道控制器 (OrbitControls)

允许用户通过鼠标旋转、缩放和平移相机，非常适合查看 3D 模型。
_注意：需要额外引入。_

```javascript
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // 开启阻尼效果，更有惯性感觉
```

#### 📏 坐标轴与网格

- `AxesHelper`: 显示 X(红)/Y(绿)/Z(蓝) 轴。
- `GridHelper`: 显示地面网格。

```javascript
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

const gridHelper = new THREE.GridHelper(10, 10);
scene.add(gridHelper);
```

#### 🎛️ 调试界面 (lil-gui)

用于在网页右上角生成一个控制面板，动态修改变量。

```javascript
import GUI from "lil-gui";
const gui = new GUI();
gui.add(cube.position, "x", -3, 3).name("立方体 X 轴");
```

### 5. 动画循环 (Animation Loop)

为了让画面动起来，我们需要不断地重新渲染场景。通常使用 `requestAnimationFrame`。

```javascript
function animate() {
  requestAnimationFrame(animate);

  // 在每一帧更新物体或控制器
  cube.rotation.x += 0.01;
  controls.update(); // 如果开启了 damping

  // 执行渲染
  renderer.render(scene, camera);
}
animate();
```

### 6. 处理窗口缩放

当浏览器窗口大小改变时，需要更新相机的宽高比和渲染器的尺寸，否则画面会变形。

```javascript
window.addEventListener("resize", () => {
  // 更新相机宽高比
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  // 更新渲染器尺寸
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
```

### 7. 补充：组 (Group) 与 层级关系

Three.js 的场景图是树状结构。你可以将多个 Mesh 添加到一个 `THREE.Group` 中，然后对 Group 进行旋转或移动，里面的所有子物体都会跟随变化。这在制作复杂的物体（如一辆车由车身和轮子组成）时非常有用。

```javascript
const car = new THREE.Group();

const body = new THREE.Mesh(bodyGeo, bodyMat);
const wheel1 = new THREE.Mesh(wheelGeo, wheelMat);
// ...

car.add(body);
car.add(wheel1);
// ...

scene.add(car);
// 移动整个车
car.position.x = 2;
```

### 8. 加载外部模型 (GLTF/GLB)

在实际开发中，我们很少完全用代码手写几何体，而是从 Blender 等软件导出模型。GLTF/GLB 是 Web 3D 领域的“JPEG”，推荐使用。

要加载模型，需要引入 `GLTFLoader`。

```javascript
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const loader = new GLTFLoader();

loader.load(
  "path/to/model.glb",
  (gltf) => {
    const model = gltf.scene;
    model.scale.set(0.5, 0.5, 0.5); // 缩放模型
    scene.add(model);
  },
  (xhr) => {
    // 加载进度
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  },
  (error) => {
    console.error("An error happened", error);
  },
);
```

---

## 📝 学习资源推荐

- [Three.js 官方文档](https://threejs.org/docs/index.html) - 最权威的查询手册。
- [Three.js Examples](https://threejs.org/examples/) - 改代码是最好的学习方式。


祝你学习愉快！🌟
