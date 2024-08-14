import React, { useEffect } from 'react'
import { connect } from 'dva'
import './styles.less'
import * as THREE from 'three'//使用three
import gasp from 'gsap'//引入动画库
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'//引入控制器
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"//加载模型的库
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader"//解压模型的库
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

import { useRef } from 'react'


export default connect(state => {
  return {

  }
})(Home)
function Home(props) {
  const refs = new useRef(null)//创建ref
  let mixer// 动画混合器  用于操作动画
  let clock//时钟
  let model
  let root// Group
  let labelRenderer//渲染 CSS2DObject 文字的

  let raycaster//射线
  const mouse = new THREE.Vector2();

  let css2Label//单个  label
  let modelName//单个  模型名称

  const labeledObjects = {};//存放大模型中 所有小模型的键值对  {小模型名称title：{object:Obeject3D（要渲染到的小模型） ,label: CSS2DObject (文字) } }
  const modelsToLabelArray = [
    { key: "Hot_air_balloon", title: "热气球", color: "pink" },
    { key: "Blimp", title: "飞艇", color: "#04359e" },
    { key: "Buildings", title: "办公楼", color: "#f1a541" },
    { key: "Cars", title: "停车场的小汽车", color: "red" },
    { key: "Car_Blue", title: "蓝色小车", color: "blue" },
    { key: "Car_Green", title: "绿色小车", color: "green" },
    { key: "Car_Yellow", title: "黄色小车", color: "yellow" },
    { key: "Wheel_base", title: "摩天轮", color: "#41f1b6" },
    { key: "Other", title: "广告牌", color: "#c841f1" },
    { key: "Water", title: "水源", color: "#414df1" },
    { key: "Trees", title: "小树", color: "#f1a541" },
  ]//渲染数组


  useEffect(() => {
    clock = new THREE.Clock();//用于更新动画

    document.getElementById('container').appendChild(renderer.domElement);//放到页面 可以通过getElementById 也可以 refs.current.appendChild(renderer.domElement);

    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';
    document.getElementById('container').appendChild(labelRenderer.domElement);// refs.current.appendChild(labelRenderer.domElement);
  }, [])

  const scene = new THREE.Scene()//创建场景

  root = new THREE.Group();//这个组可以包含任何类型的Three.js对象  比如我们现在需要用到的CSS2DObject  
  scene.add(root);//然后再将“这些” 对象添加到场景中去

  raycaster = new THREE.Raycaster();//射线
  document.addEventListener('mousemove', onDocumentMouseMove);


  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);//相机
  camera.position.set(-23, 13, 23);//设置相机位置

  const renderer = new THREE.WebGLRenderer({ atialias: true });//atialias(设置抗锯齿 提高画质)  初始化渲染器
  renderer.setSize(window.innerWidth, window.innerHeight)// 更新渲染器  重新设置渲染的宽度和高度

  const light = new THREE.DirectionalLight(0xffffff, 1)//平行光
  light.position.set(0, 10, 0)
  const spotLight = new THREE.SpotLight()//聚光灯
  spotLight.position.set(-10, -10, 10)
  const ambientLight = new THREE.AmbientLight(0x404040, 20)//环绕光
  scene.add(light, spotLight, ambientLight)

  const controls = new OrbitControls(camera, renderer.domElement)//创建轨道控制器  只是创建了 就可以 移动 几何体了
  controls.enableDamping = true// 设置控制器阻尼 更丝滑 必须加updata
  const axesHelper = new THREE.AxesHelper(100);// 添加坐标辅助器
  scene.add(axesHelper);//必须把辅助器 添加到场景里 
  // const gridHelper = new THREE.GridHelper(100, 100, 'pink', 'aqua')//创建辅助网格地面
  // scene.add(gridHelper)

  // 设置cube纹理加载器
  const cubeTextureLoader = new THREE.CubeTextureLoader()
  var envMap = cubeTextureLoader.load([
    "textImg/skyBox3/posx.jpg",//右  px
    "textImg/skyBox3/negx.jpg",//左  nx
    "textImg/skyBox3/posy.jpg",//上  py
    "textImg/skyBox3/negy.jpg",//下  ny
    "textImg/skyBox3/posz.jpg",//前  pz
    "textImg/skyBox3/negz.jpg",//后  nz
  ])//设置给球体  需要贴的图片  正是p 负是n
  scene.background = envMap // 给场景添加背景

  const gltfLoader = new GLTFLoader();//初始加载
  gltfLoader.setDRACOLoader()
  // 加载城市模型 
  gltfLoader.load('/model/city/scene.gltf', function (gltf) {
    model = gltf.scene
    model.scale.set(0.1, 0.1, 0.1)
    scene.add(model);
    // 多个  循环放进 labeledObjects 整理键值对 
    model.traverse(function (child) {
      if (child.name) {
        // console.log(child);
        const matchedModel = modelsToLabelArray.find(item => item.key === child.name);
        if (matchedModel) {
          // 添加字体
          const text = document.createElement('div');
          text.className = 'label';
          text.style.color = matchedModel.color;
          text.textContent = matchedModel.title;

          const label = new CSS2DObject(text);//生成一个 CSS2DObject 对象
          labeledObjects[child.name] = { child, label };//  { 模型，文字 }

          // 设置初始位置
          label.position.copy(child.position.clone().multiplyScalar(0.001));//克隆该位置 并且将模型的坐标按0.001缩小 
          root.add(label);

        } else {
          // console.log('未处理的模型名称:', child.name);
        }
      }
    });

    // 单个
    // const text = document.createElement('div');
    // text.className = 'label';
    // text.style.color = 'red';
    // text.textContent = "单个自定义模型文字";
    // css2Label = new CSS2DObject(text);
    // modelName = model.getObjectByName('Blimp');
    // css2Label.position.copy(modelName.position.clone().multiplyScalar(0.001));// css2Label.position.set(modelName.position.x * 0.001, modelName.position.y * 0.001, modelName.position.z * 0.001);
    // root.add(css2Label)

    mixer = new THREE.AnimationMixer(model)
    let animate = mixer.clipAction(gltf.animations[0])
    animate.play()
  })

  // 跟新物体运动文字
  function updateLabels() {
    for (const [name, { child, label }] of Object.entries(labeledObjects)) {
      label.position.copy(child.position.clone().multiplyScalar(0.001)); // 更新文字位置
    }
  }
  function updateLabel() {
    if (modelName && css2Label) {
      css2Label.position.copy(modelName.position.clone().multiplyScalar(0.001)); // 调整单位与CSS2DRenderer一致
    }
  }

  function onDocumentMouseMove(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
  }

  // 渲染函数
  function animate() {
    controls.update()//阻尼
    if (mixer) {
      mixer.update(clock.getDelta())
      updateLabels();
      // updateLabel()//单个
    }
    requestAnimationFrame(animate);
    renderer.render(scene, camera);//渲染场景和相机

    // 更新文字 用于一些会移动的小模型
    if (labelRenderer) {
      labelRenderer.render(scene, camera);
    }

    raycaster.setFromCamera(mouse, camera);


  }
  animate();
  return (
    <div id='container' ref={refs}>
    </div>
  )
}

