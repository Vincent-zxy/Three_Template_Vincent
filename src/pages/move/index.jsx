import React, { useEffect, useRef } from 'react'
import { connect } from 'dva'
import './styles.less'
import * as THREE from 'three'//使用three
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'//引入控制器
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"//加载模型的库
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader"//解压模型的库
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';


export default connect(state => {
  return {}
})(Move)
function Move(props) {
  const refs = new useRef(null)//创建ref
  let gui, controls, renderer, scene, camera
  let animation, mixer, clock, model, conf
  let mirrorSphereCamera//立方体相机
  let transformControls
  let sphereMesh//球体
  let sphereMaterial//球体的材质
  let textureCube// 六张图片
  let textureEquirec// 一张图片
  const v0 = new THREE.Vector3();

  useEffect(() => {
    clock = new THREE.Clock();
    refs.current.appendChild(renderer.domElement)//将 canvas 放到盒子里
    return () => {
      if (gui && gui.domElement.parentNode) {
        gui.domElement.parentNode.removeChild(gui.domElement);
      }
      gui = null;
    };
  }, [])

  const init = async () => {

    scene = new THREE.Scene()//创建场景
    scene.fog = new THREE.FogExp2(0xffffff, .05);//雾化效果

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);//相机
    camera.position.set(0, 1, -3);//设置相机位置
    renderer = new THREE.WebGLRenderer({
      atialias: true// 设置抗锯齿  提高画质
    });// 初始化渲染器
    renderer.setSize(window.innerWidth, window.innerHeight)// 更新渲染器  重新设置渲染的宽度和高度

    // 添加灯光
    const light = new THREE.DirectionalLight(0xffffff, 1)
    light.position.set(0, 10, 0)
    const spotLight = new THREE.SpotLight()//聚光灯
    spotLight.position.set(10, 10, 10)
    const ambientLight = new THREE.AmbientLight(0x404040, 20)//环绕光
    // scene.add(light, spotLight, ambientLight)
    scene.add(ambientLight, spotLight)

    //创建轨道控制器  只是创建了 就可以 移动 几何体了
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true// 设置控制器阻尼 更丝滑 必须加updata
    const axesHelper = new THREE.AxesHelper(10);// 添加坐标辅助器
    // scene.add(axesHelper);//必须把辅助器 添加到场景里 
    // controls.autoRotate = true;//自动旋转

    // 设置cube纹理加载器
    const cubeTextureLoader = new THREE.CubeTextureLoader()
    textureCube = cubeTextureLoader.load([
      "textImg/skyBox3/posx.jpg",//右  px
      "textImg/skyBox3/negx.jpg",//左  nx
      "textImg/skyBox3/posy.jpg",//上  py
      "textImg/skyBox3/negy.jpg",//下  ny
      "textImg/skyBox3/posz.jpg",//前  pz
      "textImg/skyBox3/negz.jpg",//后  nz
    ])//设置给球体  需要贴的图片  正是p 负是n
    // scene.environment = textureCube
    const textureLoader = new THREE.TextureLoader();
    textureEquirec = textureLoader.load('textImg/all_back.jpg');
    textureEquirec.mapping = THREE.EquirectangularReflectionMapping;
    textureEquirec.colorSpace = THREE.SRGBColorSpace;

    scene.background = textureCube

    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(1024);
    mirrorSphereCamera = new THREE.CubeCamera(0.1, 1000, cubeRenderTarget);
    scene.add(mirrorSphereCamera);

    const sphereGeometry = new THREE.SphereGeometry(1, 20, 20);//创建球体
    // sphereMaterial = new THREE.MeshBasicMaterial({ envMap: textureCube });// 材质
    // sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
    // 透明效果，根材质有关
    const mirrorSphereMaterial = new THREE.MeshBasicMaterial({ envMap: cubeRenderTarget.texture });
    // const mirrorSphereMaterial = new THREE.MeshStandardMaterial({
    //   envMap: cubeRenderTarget.texture,
    //   metalness: 1, // 高金属度会有更强的镜面反射
    //   roughness: 0.0, // 低粗糙度会让表面更平滑，反射更清晰
    //   transparent: true,
    // });
    sphereMesh = new THREE.Mesh(sphereGeometry, mirrorSphereMaterial);
    sphereMesh.position.set(0, 0, 0)
    controls.target.copy(sphereMesh.position)
    scene.add(sphereMesh)

    // 物体移动的控制器
    transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.size = 0.75;
    // transformControls.showX = false;
    transformControls.space = 'world';
    transformControls.attach(sphereMesh);//转换控件 用于控制 模型的 手
    scene.add(transformControls);
    transformControls.addEventListener('mouseDown', () => controls.enabled = false);
    transformControls.addEventListener('mouseUp', () => controls.enabled = true);

    // 初始化loader
    const dracoloader = new DRACOLoader()
    dracoloader.setDecoderPath("/model/hours")//解压文件
    const gltfLoader = new GLTFLoader();//初始加载
    gltfLoader.setDRACOLoader(dracoloader)

    gltfLoader.load('/model/girl_animation/scene.gltf', function (gltf) {
      model = gltf.scene
      model.position.set(0, -5, -5)
      model.scale.set(2, 2, 2)
      scene.add(model);
      mixer = new THREE.AnimationMixer(model)
      animation = mixer.clipAction(gltf.animations[0])
      // model.visible = false//默认隐藏
      // animation.play()//默认开启动画
    })

    conf = {
      showModel: true,
      play: false,
      pasued: false,
      time: 1.0,
      followSphere: false,
      turnHead: false,
      Cube: function () {
        // scene.background = textureCube;
        // sphereMaterial.envMap = textureCube; 
        // sphereMaterial.needsUpdate = true;
        scene.background = textureCube;
        mirrorSphereMaterial.envMap = cubeRenderTarget.texture;
        mirrorSphereMaterial.needsUpdate = true;// 更新用到， 感觉没啥用  因为 animate 函数 好像给更新了 或许此处在一些操作后还能保持正常 而起到作用
      },
      Equirectangular: function () {
        // scene.background = textureEquirec;
        // sphereMaterial.envMap = textureEquirec;
        // sphereMaterial.needsUpdate = true;
        scene.background = textureEquirec;
        mirrorSphereMaterial.envMap = cubeRenderTarget.texture;
        mirrorSphereMaterial.needsUpdate = true;
      },
      Refraction: false,
    };
    gui = new GUI();
    gui.add(conf, 'showModel').name("是否显示模型").onChange(function (value) { model.visible = value });
    gui.add(conf, 'play').name('是否播放动画').onChange(function (value) { value ? animation.play() : animation.stop() })
    gui.add(conf, 'pasued').name('暂停动画').onChange(function (value) { value ? animation.paused = true : animation.paused = false })
    gui.add(conf, 'time', 0, 1, 0.01).name('控制速度').onChange(function (speed) { mixer.timeScale = speed })
    gui.add(conf, 'followSphere').name("镜头是否跟随球体移动")
    gui.add(conf, 'turnHead').name("模型是否根据球体变化")
    gui.add(conf, 'Cube').name("切换校园")
    gui.add(conf, 'Equirectangular').name("切换房子内")
    gui.add(conf, 'Refraction').onChange(function (value) {
      if (value) {
        // textureEquirec.mapping = THREE.EquirectangularRefractionMapping;//核心就是通过这个变透明的  修改映射方式
        // textureCube.mapping = THREE.CubeRefractionMapping;
        mirrorSphereMaterial.transparent = true;
        mirrorSphereMaterial.depthWrite = false;
        mirrorSphereMaterial.opacity = 0.5; // 透明度可以根据需求调整
        mirrorSphereMaterial.envMap.mapping = THREE.CubeRefractionMapping;
      } else {
        // textureEquirec.mapping = THREE.EquirectangularReflectionMapping;
        // textureCube.mapping = THREE.CubeReflectionMapping;
        mirrorSphereMaterial.transparent = false;
        mirrorSphereMaterial.depthWrite = true;
        mirrorSphereMaterial.envMap.mapping = THREE.CubeReflectionMapping;
      }
      mirrorSphereMaterial.needsUpdate = true;
    }).name("球体时候透明");

    // gui.add(conf, 'update').name('IK manual update()');
    gui.open();

    window.addEventListener('resize', onWindowResize, false);
  }
  init().then(animate);

  // 渲染函数
  function animate() {
    requestAnimationFrame(animate);
    controls.update()//阻尼
    mirrorSphereCamera.update(renderer, scene);

    if (sphereMesh && conf.followSphere) {
      sphereMesh.getWorldPosition(v0);//获取球的世界坐标  然后把获取到值给 v0
      controls.target.lerp(v0, 0.1);
    }

    if (model && conf.turnHead) {
      sphereMesh.getWorldPosition(v0);
      model.lookAt(v0); //让头朝向 上面获取球的世界坐标
      // console.log(model.rotation);
      model.rotation.set(model.rotation.x + 1.5, model.rotation.y - 3 + Math.PI, model.rotation.z);
    }

    if (mixer) {
      mixer.update(clock.getDelta())//需要clock时间
    }
    renderer.render(scene, camera);//渲染场景和相机
  }
  animate();

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }


  return (
    <div styleName="home-box" ref={refs}>
    </div>
  )
}

