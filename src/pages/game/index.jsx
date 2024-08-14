import React, { useEffect, useRef } from 'react'
import { connect } from 'dva'
import './styles.less'
import * as THREE from 'three'//使用three
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'//引入控制器
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader"//解压模型的库

import Stats from 'three/addons/libs/stats.module.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';//加载模型的库
import { Octree } from 'three/addons/math/Octree.js';
import { OctreeHelper } from 'three/addons/helpers/OctreeHelper.js';
import { Capsule } from 'three/addons/math/Capsule.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { message } from 'antd'
import { MobXProviderContext } from 'mobx-react'

export default connect(state => {
  return {
  }
})(Home)
function Home(props) {
  const refs = new useRef(null)//创建ref
  useEffect(() => {
    refs.current.appendChild(renderer.domElement, stats.domElement)//将 canvas 放到盒子里
  }, [])

  // 时钟用于计算动画
  const clock = new THREE.Clock();
  // 场景
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x88ccee)
  scene.fog = new THREE.Fog(0x88ccee, 0, 50)
  // 相机
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.rotation.order = 'YXZ';//相机旋转顺序
  // 灯光
  const fillLight1 = new THREE.HemisphereLight(0x8dc1de, 0x00668d, 1.5);
  fillLight1.position.set(2, 1, 1);
  scene.add(fillLight1);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
  directionalLight.position.set(- 5, 25, - 1);
  directionalLight.castShadow = true;
  directionalLight.shadow.camera.near = 0.01;
  directionalLight.shadow.camera.far = 500;
  directionalLight.shadow.camera.right = 30;
  directionalLight.shadow.camera.left = - 30;
  directionalLight.shadow.camera.top = 30;
  directionalLight.shadow.camera.bottom = - 30;
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.radius = 4;
  directionalLight.shadow.bias = - 0.00006;
  scene.add(directionalLight);

  // 渲染器
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);//更新渲染器  重新设置渲染的宽度和高度
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  // 帧率
  const stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  // 变量
  const GRAVITY = 30;//重力

  const NUM_SPHERES = 10;//场景内球的最多个数
  const SPHERE_RADIUS = 0.2;

  const STEPS_PER_FRAME = 5;

  const sphereGeometry = new THREE.IcosahedronGeometry(SPHERE_RADIUS, 5);
  const sphereMaterial = new THREE.MeshLambertMaterial({ color: 0xdede8d });

  const spheres = [];//存放所有的小球
  let sphereIdx = 0;

  for (let i = 0; i < NUM_SPHERES; i++) {
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);//球体模型
    sphere.castShadow = true;//开启阴影投射
    sphere.receiveShadow = true;//开启阴影接收
    scene.add(sphere);
    spheres.push({//存放到数组里
      mesh: sphere,
      collider: new THREE.Sphere(new THREE.Vector3(0, - 100, 0), SPHERE_RADIUS),
      velocity: new THREE.Vector3()
    });

  }

  const worldOctree = new Octree();//碰撞检测

  const playerCollider = new Capsule(new THREE.Vector3(0, 0.35, 0), new THREE.Vector3(0, 1, 0), 0.35);//创建胶囊体碰撞器  就是自己 自己就是一个胶囊体

  const playerVelocity = new THREE.Vector3();//玩家速度向量
  const playerDirection = new THREE.Vector3();//玩家方向向量

  let playerOnFloor = false;
  let mouseTime = 0;

  const keyStates = {};

  const vector1 = new THREE.Vector3();
  const vector2 = new THREE.Vector3();
  const vector3 = new THREE.Vector3();

  // 监听鼠标、键盘事件
  document.addEventListener('keydown', (event) => {
    if (event.key === 'w' && keyStates['ControlLeft']) {
      event.preventDefault();
      // 在这里处理下蹲或你需要的其他逻辑
    }
    keyStates[event.code] = true;
  });
  document.addEventListener('keyup', (event) => {
    if (event.key === 'w' && keyStates['ControlLeft']) {
      event.preventDefault();
      // 在这里处理下蹲或你需要的其他逻辑
    }
    keyStates[event.code] = false;
  });
  // 因为左侧有 menu 所以 进入文档里就必须点击右侧部分进入   refs.current => 右侧
  useEffect(() => {
    refs.current.addEventListener('mousedown', () => {
      message.success("现在您可以通过w、a、s、d进行移动")
      document.body.requestPointerLock();
      mouseTime = performance.now();//记录鼠标按下时的高精度 时间戳
    });
  }, [])
  document.addEventListener('mouseup', () => {
    if (document.pointerLockElement !== null) throwBall(); //没有锁定任何元素 才会发射一个球
  });
  document.body.addEventListener('mousemove', (event) => {
    if (document.pointerLockElement === document.body) {//是否已经成功锁定了指针（即鼠标） 到文档的body上
      //设置上下左右移动的灵敏度
      camera.rotation.y -= event.movementX / 300;
      camera.rotation.x -= event.movementY / 400;
    }
  });

  // 发射小球
  function throwBall() {
    const sphere = spheres[sphereIdx];

    camera.getWorldDirection(playerDirection);//获取相机当前指向的方向 并保存在playerDirection向量中

    // console.log(playerCollider);
    sphere.collider.center.copy(playerCollider.end).addScaledVector(playerDirection, playerCollider.radius * 1);//球出现的位置

    // 如果我们按住按钮的时间更长，如果我们向前移动，投球的力度会更大  实测没效果

    const impulse = 15 + 30 * (1 - Math.exp((mouseTime - performance.now()) * 0.001));

    sphere.velocity.copy(playerDirection).multiplyScalar(impulse);//球能发射多远
    sphere.velocity.addScaledVector(playerVelocity, 2);

    sphereIdx = (sphereIdx + 1) % spheres.length;

  }
  // 处理玩家与世界中其他物体的碰撞检测
  function playerCollisions() {

    const result = worldOctree.capsuleIntersect(playerCollider);//碰撞检测:检测玩家的胶囊体碰撞器是否与其他物体相交

    playerOnFloor = false;

    if (result) {

      playerOnFloor = result.normal.y > 0;

      if (!playerOnFloor) {

        playerVelocity.addScaledVector(result.normal, - result.normal.dot(playerVelocity));//不在地面就是调整 垂直速度

      }

      playerCollider.translate(result.normal.multiplyScalar(result.depth));//修正玩家位置，确保其不会穿透碰撞物体

    }

  }
  // 更新玩家每一帧的动作状态 重力影响、速度衰减（阻尼效果）、位置更新
  function updatePlayer(deltaTime) {

    let damping = Math.exp(- 4 * deltaTime) - 1;//阻尼因子

    if (!playerOnFloor) {

      playerVelocity.y -= GRAVITY * deltaTime;

      // small air resistance
      damping *= 0.1;//模拟空气阻力

    }

    // addScaledVector取得playerVelocity向量 然后乘以damping然后再将缩放后的向量加回到playerVelocity上 速度越来越小 实现阻尼效果
    playerVelocity.addScaledVector(playerVelocity, damping);

    const deltaPosition = playerVelocity.clone().multiplyScalar(deltaTime);
    playerCollider.translate(deltaPosition);

    playerCollisions();

    camera.position.copy(playerCollider.end);

  }

  function playerSphereCollision(sphere) {

    const center = vector1.addVectors(playerCollider.start, playerCollider.end).multiplyScalar(0.5);

    const sphere_center = sphere.collider.center;

    const r = playerCollider.radius + sphere.collider.radius;
    const r2 = r * r;

    // approximation: player = 3 spheres

    for (const point of [playerCollider.start, playerCollider.end, center]) {

      const d2 = point.distanceToSquared(sphere_center);

      if (d2 < r2) {

        const normal = vector1.subVectors(point, sphere_center).normalize();
        const v1 = vector2.copy(normal).multiplyScalar(normal.dot(playerVelocity));
        const v2 = vector3.copy(normal).multiplyScalar(normal.dot(sphere.velocity));

        playerVelocity.add(v2).sub(v1);
        sphere.velocity.add(v1).sub(v2);

        const d = (r - Math.sqrt(d2)) / 2;
        sphere_center.addScaledVector(normal, - d);

      }

    }

  }

  function spheresCollisions() {

    for (let i = 0, length = spheres.length; i < length; i++) {

      const s1 = spheres[i];

      for (let j = i + 1; j < length; j++) {

        const s2 = spheres[j];

        const d2 = s1.collider.center.distanceToSquared(s2.collider.center);
        const r = s1.collider.radius + s2.collider.radius;
        const r2 = r * r;

        if (d2 < r2) {

          const normal = vector1.subVectors(s1.collider.center, s2.collider.center).normalize();
          const v1 = vector2.copy(normal).multiplyScalar(normal.dot(s1.velocity));
          const v2 = vector3.copy(normal).multiplyScalar(normal.dot(s2.velocity));

          s1.velocity.add(v2).sub(v1);
          s2.velocity.add(v1).sub(v2);

          const d = (r - Math.sqrt(d2)) / 2;

          s1.collider.center.addScaledVector(normal, d);
          s2.collider.center.addScaledVector(normal, - d);

        }

      }

    }

  }
  // 更新球体
  function updateSpheres(deltaTime) {

    spheres.forEach(sphere => {

      sphere.collider.center.addScaledVector(sphere.velocity, deltaTime);

      const result = worldOctree.sphereIntersect(sphere.collider);

      if (result) {

        sphere.velocity.addScaledVector(result.normal, - result.normal.dot(sphere.velocity) * 1.5);
        sphere.collider.center.add(result.normal.multiplyScalar(result.depth));

      } else {

        sphere.velocity.y -= GRAVITY * deltaTime;

      }

      const damping = Math.exp(- 1.5 * deltaTime) - 1;
      sphere.velocity.addScaledVector(sphere.velocity, damping);

      playerSphereCollision(sphere);

    });

    spheresCollisions();

    for (const sphere of spheres) {

      sphere.mesh.position.copy(sphere.collider.center);

    }

  }

  function getForwardVector() {

    camera.getWorldDirection(playerDirection);
    playerDirection.y = 0;
    playerDirection.normalize();

    return playerDirection;

  }

  function getSideVector() {

    camera.getWorldDirection(playerDirection);
    playerDirection.y = 0;
    playerDirection.normalize();
    playerDirection.cross(camera.up);

    return playerDirection;

  }

  // 键盘控制器
  function controls(deltaTime) {

    // 25 是 一个系数  并不是时间速度这样的单位
    // speedDelta 计算出来也就是个 标量值

    // 提供了一点空气控制
    let speedDelta = deltaTime * (playerOnFloor ? 25 : 8);//标量值

    if (keyStates['ShiftLeft']) {
      speedDelta = 0.01
    }
    if (keyStates['KeyW']) {
      // getForwardVector 获取摄像机面向前方的 方向向量
      // multiplyScalar 让向量里的分量乘以 计算出来的 标量值
      // 通过这种操作，你可以动态地调整玩家的移动速度，使其随时间变化和玩家所处环境的不同而有所不同
      playerVelocity.add(getForwardVector().multiplyScalar(speedDelta));

    }

    if (keyStates['KeyS']) {

      playerVelocity.add(getForwardVector().multiplyScalar(- speedDelta));

    }

    if (keyStates['KeyA']) {

      playerVelocity.add(getSideVector().multiplyScalar(- speedDelta));

    }

    if (keyStates['KeyD']) {

      playerVelocity.add(getSideVector().multiplyScalar(speedDelta));

    }
    if (playerOnFloor) {

      if (keyStates['Space']) {
        playerVelocity.y = 15;
      }

    }

  }

  // 加载地图
  const loader = new GLTFLoader()// .setPath('../../../public/model/');
  // ./models/gltf/
  loader.load('/model/collision-world.glb', (gltf) => {

    scene.add(gltf.scene);

    worldOctree.fromGraphNode(gltf.scene);//3d交互 目前这么理解

    gltf.scene.traverse(child => {

      if (child.isMesh) {

        child.castShadow = true;
        child.receiveShadow = true;

        if (child.material.map) {

          child.material.map.anisotropy = 4;//优化纹理

        }

      }

    });

    const helper = new OctreeHelper(worldOctree);
    helper.visible = false;
    scene.add(helper);

    const gui = new GUI({ width: 200 });
    gui.add({ debug: false }, 'debug')
      .onChange(function (value) {

        helper.visible = value;

      });

    animate();

  });

  function teleportPlayerIfOob() {

    if (camera.position.y <= - 25) {

      playerCollider.start.set(0, 0.35, 0);
      playerCollider.end.set(0, 1, 0);
      playerCollider.radius = 0.35;
      camera.position.copy(playerCollider.end);
      camera.rotation.set(0, 0, 0);

    }

  }

  function teleportPlayerIfOob() {
    if (camera.position.y <= - 25) {
      playerCollider.start.set(0, 0.35, 0);
      playerCollider.end.set(0, 1, 0);
      playerCollider.radius = 0.35;
      camera.position.copy(playerCollider.end);
      camera.rotation.set(0, 0, 0);
    }
  }

  // 渲染函数
  function animate() {
    // clock.getDelta() 获取自上一帧到现在这段时间的差值
    const deltaTime = Math.min(0.05, clock.getDelta()) / STEPS_PER_FRAME;
    //我们在子步骤中寻找碰撞，以降低
    //一个物体过快地穿过另一个物体而无法检测。
    for (let i = 0; i < STEPS_PER_FRAME; i++) {
      controls(deltaTime);
      updatePlayer(deltaTime);
      updateSpheres(deltaTime);
      teleportPlayerIfOob();
    }
    renderer.render(scene, camera);
    stats.update();
    requestAnimationFrame(animate);
  }
  animate();
  window.addEventListener('resize', onWindowResize);

  function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

  }
  return (
    <div styleName="home-box" id='container' ref={refs}>
    </div>
  )
}

