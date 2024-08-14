import React, { useEffect, useRef } from 'react'
import { connect } from 'dva'
import './styles.less'
import * as THREE from 'three'//使用three
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'//引入控制器
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"//加载模型的库
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader"//解压模型的库


export default connect(state => {
  return {
  }
})(Home)
function Home(props) {
  const refs = new useRef(null)//创建ref
  useEffect(() => {
    refs.current.appendChild(renderer.domElement)//将 canvas 放到盒子里
  }, [])

  const scene = new THREE.Scene()//创建场景
  const camera = new THREE.PerspectiveCamera(
    75, window.innerWidth / window.innerHeight, 0.1, 1000);//相机
  camera.position.set(0.6, 2, 1.5);//设置相机位置

  const renderer = new THREE.WebGLRenderer({
    atialias: true// 设置抗锯齿  提高画质
  });// 初始化渲染器
  renderer.setSize(window.innerWidth, window.innerHeight)// 更新渲染器  重新设置渲染的宽度和高度

  const light = new THREE.DirectionalLight(0xffffff, 1) //平行光
  light.position.set(0, 10, 0)
  const spotLight = new THREE.SpotLight()//聚光灯
  spotLight.position.set(10, 10, 10)
  const ambientLight = new THREE.AmbientLight(0x404040, 20)//环绕光
  scene.add(light, ambientLight,)

  //创建轨道控制器  只是创建了 就可以 移动 几何体了
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true// 设置控制器阻尼 更丝滑 必须加updata
  const axesHelper = new THREE.AxesHelper(5);// 添加坐标辅助器
  // controls.autoRotate = true;
  scene.add(axesHelper);//必须把辅助器 添加到场景里 
  // 渲染函数
  function animate() {
    controls.update()//阻尼
    //渲染下一帧的时候 重新渲染这个括号里面的函数
    requestAnimationFrame(animate);
    renderer.render(scene, camera);//渲染场景和相机
  }
  animate();

  // 设置cube纹理加载器
  const cubeTextureLoader = new THREE.CubeTextureLoader()
  let envMap = cubeTextureLoader.load([
    "textImg/skyBox3/posx.jpg",//右  px
    "textImg/skyBox3/negx.jpg",//左  nx
    "textImg/skyBox3/posy.jpg",//上  py
    "textImg/skyBox3/negy.jpg",//下  ny
    "textImg/skyBox3/posz.jpg",//前  pz
    "textImg/skyBox3/negz.jpg",//后  nz
  ])//设置给球体  需要贴的图片  正是p 负是n
  scene.background = envMap// 给场景添加背景
  // 给场景所有的物体添加默认的环境贴图
  // scene.environment = envMap

  // 初始化loader
  const dracoloader = new DRACOLoader()
  dracoloader.setDecoderPath("/model/hours")//解压文件
  const gltfLoader = new GLTFLoader();//初始加载
  gltfLoader.setDRACOLoader(dracoloader)

  // 房子模型 加载gltf格式文件 
  gltfLoader.load('/model/hours/scene.gltf', function (gltf) {
    let model = gltf.scene
    model.position.set(0.25, -0.6, -0.25)
    model.scale.set(20, 20, 20)
    model.rotation.set(0, Math.PI / 2, 0)
    scene.add(model);
  })
  // 衣服模型 加载glb格式文件
  gltfLoader.load('/model/school.glb', function (gltf) {
    let model = gltf.scene
    model.position.set(0, -0.25, 0)
    model.scale.set(0.002, 0.002, 0.002)
    scene.add(model);
  })





  return (
    <div styleName="home-box" ref={refs}>
    </div>
  )
}

