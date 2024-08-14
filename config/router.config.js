export default [
  {
    path: '/user',
    routes: [{ path: '/user/login', component: './login', title: '登录' }],
  },
  {
    path: '/',
    component: '@/layouts/BasicLayout',
    wrappers: ['@/pages/authorized'], // 路由守卫
    routes: [
      { path: '/home', component: './home', title: '模型导入' },
      { path: '/forms', component: './forms', title: 'VR看房' },
      { path: '/city', component: './city', title: '城市动画' },
      { path: '/animation', component: './animation', title: '人物动画' },
      { path: '/move', component: './move', title: '模型移动' },
      { path: '/game', component: './game', title: '我的游戏' },
    ],
  },
];
