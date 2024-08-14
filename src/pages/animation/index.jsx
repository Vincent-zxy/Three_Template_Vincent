import React, { useEffect, useState } from 'react'
import { connect } from 'dva'
import './styles.less'
import * as THREE from 'three'//使用three
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'//引入控制器
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"//加载模型的库
import { useRef } from 'react'
// import { GUI } from 'dat.gui'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import Stats from 'three/addons/libs/stats.module.js';
export default connect(state => {
  return {
  }
})(Home)

// 1 paused 为 true时 将有效时间改为0 （可以理解为将动作的速度变快变慢 最慢的时候就是 0 也就一动不动 像是暂停了一样）
// 2 paused 和 action（）的区别  前者是暂停动作停止在当前帧 而 action和stop则是 停止整个动画  下次会重新执行
// 3 阴影的条件 ：  灯光 开启阴影投射  +  材质 显示阴影  +  模型 开启阴影 +  渲染器 开启阴影
// 4 动画的切换核心是 设置权重  但是这个过程中要考虑到  动画的淡入淡出效果
// 5 mixer 能够处理复杂的动画调度和混合  确保3D模型的骨骼动画流畅地播放
// 6 核心：
//   模型展示  model.visible
//   骨骼展示  skeleton.visible
//   开启所有动画  actions.forEach（  action.play()  ）  并设置权重值
//   关闭所有动画  actions.forEach（  action.stop()  ）
//   暂停动作  actions.forEach（  action.paused=true  ）
//   取消暂停动作  actions.forEach（  action.paused=false  ）
//   切换动画 startAction.crossFadeTo(endAction, duration, true);  
//   控制模型时间快慢 mixer.timeScale = time 

function Home() {
  // const [skeleton,setSkeleton]=useState(true)
  const refs = new useRef(null)//创建ref
  let scene, renderer, camera, stats;//场景  渲染器  相机   帧率
  let model, skeleton, mixer, clock;//模型  骨骼  动画器  时钟
  let idleAction, walkAction, runAction;//动作
  let idleWeight, walkWeight, runWeight;//权重 那个高 就执行哪个动作
  let actions, settings, controls;//模型动作  控制面板   轨道控制器
  let singleStepMode = false;//是否开启下一帧
  let sizeOfNextStep = 0;//下一帧步长
  let crossFadeControls = [];
  let grid
  let panel//gui
  // 添加到dom中去
  useEffect(() => {
    init()
    refs.current.appendChild(renderer.domElement)//将 canvas 放到盒子里
    refs.current.appendChild(stats.domElement);//左上角的帧率
    window.addEventListener('resize', onWindowResize);
    return () => {
      if (panel && panel.domElement.parentNode) {
        panel.domElement.parentNode.removeChild(panel.domElement);
      }
      panel = null;
    };
  }, [])
  // 监听屏幕变化
  const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  // 初始化
  const init = () => {
    clock = new THREE.Clock();
    // 场景+相机
    scene = new THREE.Scene()//创建场景
    scene.background = new THREE.Color(0xa0a0a0);//背景颜色
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);//相机
    camera.position.set(2, 2, 2);//设置相机位置

    // 添加灯光    
    const light = new THREE.DirectionalLight(0xffffff, 1)
    light.position.set(10, 10, 10)
    light.castShadow = true; // 开启阴影投射
    const spotLight = new THREE.SpotLight()//聚光灯
    spotLight.position.set(-10, 10, -10)//相反方向更有质感
    const ambientLight = new THREE.AmbientLight(0x404040, 20)//环绕光  会让阴影消失
    // scene.add(light, spotLight, ambientLight)
    scene.add(light, spotLight)

    // 接收平面阴影
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshPhongMaterial({
      color: "white",
      transparent: true, // 开启透明度
      opacity: 0.2, // 设置不完全透明，此处为50%透明度
      depthWrite: false
    }));
    // mesh.position.set(0, -1, 0)
    mesh.rotation.x = - Math.PI / 2;
    mesh.receiveShadow = true;//让这个材质可以显示阴影
    scene.add(mesh);

    //创建辅助网格地面
    grid = new THREE.GridHelper(20, 40, 0xffffff, 0xffffff);//多大的平方   在平方内的格子数量
    grid.material.opacity = 0.2;
    grid.material.depthWrite = false;
    grid.material.transparent = true;
    scene.add(grid);

    //初始加载模型的
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader()//优化  感觉没啥吊用
    gltfLoader.load('/model/soldier.glb', function (gltf) {  // 加载 人物模型 
      model = gltf.scene
      model.rotation.set(0, Math.PI / 2 * 3, 0)
      // 开启模型阴影
      model.traverse((object) => {
        if (object.isMesh) object.castShadow = true;
      })
      scene.add(model);
      // 创建骨骼
      skeleton = new THREE.SkeletonHelper(model);//骨骼
      skeleton.visible = false;
      scene.add(skeleton);

      // 模型动作
      // const mixer = new THREE.AnimationMixer(scene)
      // const walk = gltf.animations.find(a => a.name === "Walk")//Run Idle TPose
      // mixer.clipAction(walk).play()

      // 获取模型动画
      const animations = gltf.animations;
      mixer = new THREE.AnimationMixer(model)//可以理解为模型动画播放器
      idleAction = mixer.clipAction(animations[0]);//站立
      walkAction = mixer.clipAction(animations[3]);//走
      runAction = mixer.clipAction(animations[1]);//跑

      // console.log(idleAction);

      actions = [idleAction, walkAction, runAction]

      // 添加用户面板互动
      createPanel()
      activateAllActions()
      animate();
    })


    // 设置渲染器 + stats
    renderer = new THREE.WebGLRenderer({
      atialias: true// 设置抗锯齿  提高画质
    });// 初始化
    renderer.setSize(window.innerWidth, window.innerHeight)// 更新渲染器  重新设置渲染的宽度和高度
    stats = new Stats();//优化帧率  

    //创建轨道控制器
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true// 设置控制器阻尼 更丝滑 必须加updata
    controls.autoRotate = true; // 是否自动旋转场景，默认关闭

    const axesHelper = new THREE.AxesHelper(5);// 添加坐标辅助器
    scene.add(axesHelper);//必须把辅助器 添加到场景里 

  }
  // GUI 用户调整版
  function createPanel() {

    panel = new GUI({ width: 310 });

    const folder1 = panel.addFolder('Visibility');
    const folder2 = panel.addFolder('Activation/Deactivation');
    const folder3 = panel.addFolder('Pausing/Stepping');
    const folder4 = panel.addFolder('Crossfading');
    const folder5 = panel.addFolder('Blend Weights');
    const folder6 = panel.addFolder('General Speed');
    const folder7 = panel.addFolder('直接切换动画');

    // panel.destroy()//关闭控制面板

    settings = {
      '是否显示模型': true,
      '是否显示骨架': false,
      'deactivate all': deactivateAllActions,//暂停所有动画
      'activate all': activateAllActions,//开始所有动画
      'pause/continue': pauseContinue,//开始/暂停 所有动作
      'make single step': toSingleStepMode,//只走0.05步长  （可以理解为有一个视频，你暂停他了，然后只快进了0.05秒）
      'modify step size': 0.05,//默认步长
      'from walk to idle': function () {
        prepareCrossFade(walkAction, idleAction, 1.0);
      },
      'from idle to walk': function () {
        prepareCrossFade(idleAction, walkAction, 0.5);
      },
      'from walk to run': function () {
        prepareCrossFade(walkAction, runAction, 2.5);
      },
      'from run to walk': function () {
        prepareCrossFade(runAction, walkAction, 5.0);
      },
      'use default duration': true,//默认时间
      'set custom duration': 3.5,//自定义时间
      'modify idle weight': 0.0,//权重值
      'modify walk weight': 1.0,
      'modify run weight': 0.0,
      'modify time scale': 1.0,
      '点击静止': function () { setWeightOther(idleAction, 1) },
      '点击走动': function () { setWeightOther(walkAction, 1) },
      '点击跑动': function () { setWeightOther(runAction, 1) },
    };
    folder1.add({ '是否显示模型': true }, '是否显示模型').onChange(function (value) {
      showModel(value);
    });
    folder1.add(settings, '是否显示骨架').onChange(showSkeleton);
    folder2.add(settings, 'deactivate all');
    folder2.add(settings, 'activate all');
    folder3.add(settings, 'pause/continue');
    folder3.add(settings, 'make single step');
    folder3.add(settings, 'modify step size', 0.01, 0.1, 0.001);//最低  最高  步长
    crossFadeControls.push(folder4.add(settings, 'from walk to idle'));
    crossFadeControls.push(folder4.add(settings, 'from idle to walk'));
    crossFadeControls.push(folder4.add(settings, 'from walk to run'));
    crossFadeControls.push(folder4.add(settings, 'from run to walk'));
    folder4.add(settings, 'use default duration');
    folder4.add(settings, 'set custom duration', 0, 10, 0.01);
    folder5.add(settings, 'modify idle weight', 0.0, 1.0, 0.01).listen().onChange(function (weight) {
      setWeight(idleAction, weight);
    });
    folder5.add(settings, 'modify walk weight', 0.0, 1.0, 0.01).listen().onChange(function (weight) {
      setWeight(walkAction, weight);
    });
    folder5.add(settings, 'modify run weight', 0.0, 1.0, 0.01).listen().onChange(function (weight) {
      setWeight(runAction, weight);
    });
    folder6.add(settings, 'modify time scale', 0.0, 1.5, 0.01).onChange(modifyTimeScale);
    folder7.add(settings, '点击静止')
    folder7.add(settings, '点击走动')
    folder7.add(settings, '点击跑动')
    // folder1.open();
    // folder2.open();
    // folder3.open();
    // folder4.open();
    // folder5.open();
    // folder6.open();
  }
  // 直接切换动画
  function setWeightOther(action, weight) {
    actions.forEach(function (action) {
      console.log(action);
      action.weight = 0
    })
    action.weight = 1
  }
  // 设置权重   setEffectiveWeight  给动作设置权限
  function setWeight(action, weight) {
    action.enabled = true;
    // action.setEffectiveTimeScale(1);
    action.setEffectiveWeight(weight);
  }
  // 模型展示  model.visible
  const showModel = (visibility) => {
    model.visible = visibility;
  }
  // 骨骼展示  skeleton.visible
  const showSkeleton = (visibility) => {
    skeleton.visible = visibility;
  }
  // 开启所有动画 并设置默认权重  play
  const activateAllActions = () => {
    // 用settings默认值 重新当权重
    setWeight(idleAction, settings['modify idle weight']);
    setWeight(walkAction, settings['modify walk weight']);
    setWeight(runAction, settings['modify run weight']);
    actions.forEach(function (action) {
      action.play();
    });
  }
  // 关闭所有动画  stop
  function deactivateAllActions() {
    actions.forEach(function (action) {
      action.stop();
    });
  }
  // 暂停所有的动作   paused = true  action.paused=true  才是暂停
  const pauseAllActions = () => {
    actions.forEach(function (action) {
      action.paused = true;
    });
  }
  // 取消暂停所有的动作 paused = false
  const unPauseAllActions = () => {
    actions.forEach(function (action) {
      action.paused = false;
    });
  }
  // 暂停/播放 当前动作 保持当前帧  控制暂停和播放下一帧
  const pauseContinue = () => {
    if (singleStepMode) {//是否开启下一帧
      singleStepMode = false;
      unPauseAllActions();
    } else {
      if (idleAction.paused) {//判断idleAction 是否暂停  如果暂停就取消
        unPauseAllActions();//取消暂停
      } else {
        pauseAllActions();//暂停
      }
    }
  }
  // 控制模型是否一帧一帧显示  
  function toSingleStepMode() {
    unPauseAllActions();//这个可有可无  因为animate  的 sizeOfNextStep 会设置为0 那自然就会停止动画了(paused=false  ===   步长=0)
    singleStepMode = true;
    sizeOfNextStep = settings['modify step size'];//把settings里的步长值给sizeOfNextStep赋值  步长为 0.05 
  }
  // 切换动画
  function prepareCrossFade(startAction, endAction, defaultDuration) {
    // 切换默认/自定义交叉渐变持续时间（根据用户选择）
    const duration = setCrossFadeDuration(defaultDuration);
    // 确保我们不会在singleStepMode中继续，并且所有操作都是未暂停的
    singleStepMode = false;
    unPauseAllActions();
    // 如果当前动作为“空闲”（持续时间4秒），则立即执行交叉动作；
    // 否则等待，直到当前这个动画完成当前循环 再淡入到下一个动画
    // 这算是一个小优化吧
    if (startAction === idleAction) {
      executeCrossFade(startAction, endAction, duration);
    } else {
      synchronizeCrossFade(startAction, endAction, duration);
    }
  }
  // 控制动画转变的 时间速度吧
  function setCrossFadeDuration(defaultDuration) {
    // 如果开启 使用默认时间 就使用settings 定义的默认时间
    if (settings['use default duration']) {
      return defaultDuration;
    } else {//否则就使用 GUI面板上自定义的时间 
      return settings['set custom duration'];
    }
  }
  // 将动作淡入淡出 时间控制
  function executeCrossFade(startAction, endAction, duration) {
    // 不仅开始动作，而且结束动作在衰减之前都必须获得1的权重
    setWeight(endAction, 1);
    endAction.time = 0;
    // 带扭曲的交叉渐变-也可以通过将第三个参数设置为false来尝试不带扭曲
    startAction.crossFadeTo(endAction, duration, true);// 补帧
  }
  // 清除循环的上一个动画， 循环开始下一个动画  说白了就是： 监听开始动作是否结束  必须等到结束后再调用executeCrossFade设置权重  开始endAction 动画
  function synchronizeCrossFade(startAction, endAction, duration) {
    mixer.addEventListener('loop', onLoopFinished);//添加一个事件监听器，监听mixer（动画混合器）上的'loop'事件
    // 定义内部函数onLoopFinished，它会在startAction动作循环结束时触发  
    function onLoopFinished(event) {
      if (event.action === startAction) {//找到开始动作  
        mixer.removeEventListener('loop', onLoopFinished);//移除事件监听器以避免重复执行  算是一个小优化吧
        executeCrossFade(startAction, endAction, duration);//开始新的交叉淡入淡出动画
      }
    }
  }
  // 控制模型时间快慢  原理 ：动画播放器.timeScale
  function modifyTimeScale(speed) {
    // console.log(speed);
    mixer.timeScale = speed;//所有动画速度都一样
  }
  // 没屁用
  function updateWeightSliders() {
    settings['modify idle weight'] = idleWeight;
    settings['modify walk weight'] = walkWeight;
    settings['modify run weight'] = runWeight;
  }
  // 渲染函数
  const animate = () => {
    requestAnimationFrame(animate);//渲染下一帧的时候 重新渲染这个括号里面的函数
    // 获取权重
    idleWeight = idleAction.getEffectiveWeight();
    walkWeight = walkAction.getEffectiveWeight();
    runWeight = runAction.getEffectiveWeight();

    const time = - performance.now() / 1000;
    grid.position.x = (time) % 1;

    updateWeightSliders();
    let mixerUpdateDelta = clock.getDelta();//默认会走这个  获取自上次更新以来的时间差  就是一个时间
    if (singleStepMode) {//开启下一帧
      mixerUpdateDelta = sizeOfNextStep;//0.05
      sizeOfNextStep = 0;//清空 让下次重新设置步长
    }
    // mixer.update(clock.getDelta())//动画混合器进行更新
    mixer.update(mixerUpdateDelta)//动画混合器进行更新  动画更新时间差

    controls.update()//阻尼
    stats.update()//帧率
    renderer.shadowMap.enabled = true;//渲染器 开启阴影
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 软阴影
    renderer.render(scene, camera);//渲染场景和相机
  }
  return (
    <div styleName="home-box" ref={refs}>
    </div>
  )
}

