import { Button } from 'antd'
import React, { useRef, useEffect } from 'react'
import { useState } from 'react'
import * as THREE from 'three'//使用three
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'//引入控制器
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

const dataSets = {
  1: {
    skyboxPath: "textImg/word",
    images: ["word03.png", "word00.png", "word04.png", "word01.png", "word02.png", "word05.png"],
  },
  2: {
    skyboxPath: "textImg/skyBox3",
    images: ["posx.jpg", "negx.jpg", "posy.jpg", "negy.jpg", "posz.jpg", "negz.jpg"],
  },
  3: {
    skyboxPath: "textImg/skyBox1",
    images: ["posx.jpg", "negx.jpg", "posy.jpg", "negy.jpg", "posz.jpg", "negz.jpg"],
  },
};
function Forms() {
  const refs = new useRef(null)//创建ref
  const [currentType, setCurrentType] = useState(1);
  let scene, camera, renderer, controls, gui
  useEffect(() => {
    init().then(() => {
      refs.current.appendChild(renderer.domElement);
      animate();
    });
    return () => {
      if (gui && gui.domElement.parentNode) {
        gui.domElement.parentNode.removeChild(gui.domElement);
      }
      gui = null;
    };
  }, []);
  useEffect(() => {
    RenderFn();
  }, [currentType]);

  const loadSkybox = (type) => {
    const dataSet = dataSets[type];
    const urls = dataSet.images.map((image) => `${dataSet.skyboxPath}/${image}`);

    return new Promise((resolve, reject) => {
      new THREE.CubeTextureLoader().load(urls, resolve, undefined, reject);
    });
  };

  const RenderFn = () => {
    if (scene.background instanceof THREE.Texture && scene.background !== null) {
      scene.background.dispose();
    }
    scene.remove(...scene.children.filter(obj => obj.type === 'Mesh'));

    loadSkybox(currentType).then((envMap) => {//currentType
      scene.background = envMap;

      const sphereGeometry = new THREE.SphereGeometry(1, 20, 20);
      const material = new THREE.MeshStandardMaterial({
        metalness: 1,
        roughness: 0.0,
        envMap,
      });

      const cube = new THREE.Mesh(sphereGeometry, material);
      scene.add(cube);

      // 在纹理加载完成后开始动画渲染
      animate();
    });
  };
  let conf = {
    handleA: function () {
      loadSkybox(1).then((envMap) => {//currentType
        scene.background = envMap;
        const sphereGeometry = new THREE.SphereGeometry(1, 20, 20);
        const material = new THREE.MeshStandardMaterial({
          metalness: 1,
          roughness: 0.0,
          envMap,
        });
        const cube = new THREE.Mesh(sphereGeometry, material);
        scene.add(cube);
        // 在纹理加载完成后开始动画渲染
        animate();
      });
    },
    handleB: function () {
      loadSkybox(2).then((envMap) => {//currentType
        scene.background = envMap;
        const sphereGeometry = new THREE.SphereGeometry(1, 20, 20);
        const material = new THREE.MeshStandardMaterial({
          metalness: 1,
          roughness: 0.0,
          envMap,
        });
        const cube = new THREE.Mesh(sphereGeometry, material);
        scene.add(cube);
        // 在纹理加载完成后开始动画渲染
        animate();
      });
    },
    handleC: function () {
      loadSkybox(3).then((envMap) => {//currentType
        scene.background = envMap;
        const sphereGeometry = new THREE.SphereGeometry(1, 20, 20);
        const material = new THREE.MeshStandardMaterial({
          metalness: 1,
          roughness: 0.0,
          envMap,
        });
        const cube = new THREE.Mesh(sphereGeometry, material);
        scene.add(cube);
        // 在纹理加载完成后开始动画渲染
        animate();
      });
    }
  }
  gui = new GUI();
  gui.add(conf, 'handleA').name("切换路口")
  gui.add(conf, 'handleB').name("切换学校")
  gui.add(conf, 'handleC').name("切换大桥")
  const init = async () => {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);//相机
    camera.position.set(5, 5, 5);

    renderer = new THREE.WebGLRenderer({ antialias: true });// 初始化渲染器
    renderer.setSize(window.innerWidth, window.innerHeight);// 更新渲染器  重新设置渲染的宽度和高度

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    window.addEventListener('resize', onWindowResize, false);

  }
  init().then(animate);
  const animate = () => {
    controls.update();
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  };
  animate()
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  return (
    <div>
      <Button
        style={{ position: "fixed", left: "20%", display: "none" }}
        onClick={() => setCurrentType(1)}>路口</Button>
      <Button
        style={{ position: "fixed", left: "40%", display: "none" }}
        onClick={() => { setCurrentType(2) }}>学校</Button>
      <Button
        style={{ position: "fixed", left: "60%", display: "none" }}
        onClick={() => { setCurrentType(3) }}>大桥</Button>
      <div ref={refs} style={{ width: "90%", height: "80vh" }}></div>
    </div>
  )
}

export default Forms