import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import './Login.scss';

const { Title, Text } = Typography;

const Login = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const onFinish = async (values) => {
        setLoading(true);
        setError('');

        const result = await login(values);

        if (!result.success) {
            setError(result.message || 'Đăng nhập thất bại');
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <Card className="login-card" bordered={false}>
                <div className="login-header">
                    {/* <img src={logo} alt="Logo" className="login-logo" /> */}
                    <Title level={2}>Nhà Hàng ChiLin</Title>
                    <Text type="secondary">Hệ thống quản lý nhà hàng thông minh</Text>
                </div>

                {error && (
                    <Alert
                        message={error}
                        type="error"
                        showIcon
                        className="login-alert"
                        closable
                        onClose={() => setError('')}
                    />
                )}

                <Form
                    name="login"
                    onFinish={onFinish}
                    layout="vertical"
                    size="large"
                >
                    <Form.Item
                        name="email"
                        rules={[{ required: true, message: 'Vui lòng nhập email!' }]}
                    >
                        <Input
                            prefix={<UserOutlined />}
                            placeholder="Email đăng nhập"
                            autoComplete="username"
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Mật khẩu"
                            autoComplete="current-password"
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            block
                            size="large"
                        >
                            Đăng nhập
                        </Button>
                    </Form.Item>
                </Form>


            </Card>
        </div>
    );
};

export default Login;