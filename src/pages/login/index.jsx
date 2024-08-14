import React from 'react'
import { Button } from 'antd'
import { history } from 'umi'
function Login() {
  const onClick = () => {
    console.log(1);
    localStorage.setItem('token', 123)
    history.push('/home')
  }
  return (
    <div>
      <Button onClick={onClick}>登录</Button>
    </div>
  )
}

export default Login