import React, { useState } from 'react'
import { useLocation, useHistory } from 'umi'
import { MailOutlined, SettingOutlined, AppstoreOutlined } from '@ant-design/icons';
import { Menu } from 'antd';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

function getItem(label, key, icon, children, type) {
  return {
    key,
    icon,
    children,
    label,
    type,
  };
}

const items = [
  getItem('Navigation One', 'sub1', <MailOutlined />, [
    getItem('模型', '/home', null,),
    getItem('Vr看房', '/forms', null),
    getItem('3D城市', '/city', null,),
    getItem('人物动画', '/animation', null,),
    getItem('模型移动', '/move', null,),
    getItem('我的游戏', '/game', null,),
  ]),
];

const rootSubmenuKeys = ['sub1', 'sub2', 'sub4']

export default function QMenu(props) {
  const history = useHistory()//从umi中引用 之前是 react-router-dom
  const location = useLocation()//从umi中引用 之前是 react-router-dom
  // console.log(location.pathname);
  // 打开列表
  const [openKeys, setOpenKeys] = useState([`sub1`])//打开的列表  数组
  const [selectedKeys, setSelectedKeys] = useState(location.pathname)//选中的项 字符串
  const onOpenChange = (keys) => {
    const latestOpenKey = keys.find((key) => openKeys.indexOf(key) === -1)
    if (rootSubmenuKeys.indexOf(latestOpenKey) === -1) {
      setOpenKeys(keys)
    } else {
      setOpenKeys(latestOpenKey ? [latestOpenKey] : [])
    }
  }

  const onSelect = (opt) => {
    // console.log(opt.key);
    history.push(opt.key)
    setSelectedKeys(opt.key)
  }
  // console.log(selectedKeys);
  return (
    <Menu
      mode="inline"
      openKeys={openKeys}//下拉打开默认
      onOpenChange={onOpenChange}//下拉事件
      selectedKeys={selectedKeys}//选中的项
      onSelect={onSelect}//选中的事件
      style={{
        width: 256,
      }}
      items={items}
    />
  )
}
