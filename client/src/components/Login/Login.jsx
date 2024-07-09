import React, { useContext } from 'react';
import { Form, Input, Button, Typography } from 'antd';
import api from '../../context/ApiContext';
import './login.css';
import AuthContext from '../../context/AuthContext';

const { Title } = Typography;

const Login = () => {
  const { login } = useContext(AuthContext);

  const onFinish = async (values) => {
    try {
      const response = await api.post('/login', values);
      login(response.data.token);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <Title level={2} className="login-title">Login</Title>
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, message: 'Please input your email!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" className="login-button">
              Login
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default Login;