import React, { useState } from 'react';
import { Card, Form, Input, Button, Avatar, Row, Col, Tabs, Upload, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, UploadOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import { useMutation } from 'react-query';
import { apiService } from '../services/api';
import './ProfilePage.scss';

const { TabPane } = Tabs;

const ProfilePage = () => {
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [profileForm] = Form.useForm();
    const [passwordForm] = Form.useForm();

    const updateProfileMutation = useMutation(
        (data) => apiService.updateProfile(data),
        {
            onSuccess: (response) => {
                message.success('Cập nhật hồ sơ thành công');
                if (response?.data.data) {
                    updateUser?.(response?.data.data);
                }
            },
            onError: (error) => {
                message.error(error.response?.data?.message || 'Cập nhật thất bại');
            }
        }
    );

    const changePasswordMutation = useMutation(
        (data) => apiService.changePassword(data),
        {
            onSuccess: () => {
                message.success('Đổi mật khẩu thành công');
                passwordForm.resetFields();
            },
            onError: (error) => {
                message.error(error.response?.data?.message || 'Đổi mật khẩu thất bại');
            }
        }
    );

    const handleUpdateProfile = async (values) => {
        setLoading(true);
        try {
            await updateProfileMutation.mutateAsync(values);
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (values) => {
        setLoading(true);
        try {
            await changePasswordMutation.mutateAsync({
                current_password: values.current_password,
                new_password: values.new_password
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async ({ file }) => {
        const formData = new FormData();


        formData.append('image', file); // 👈 QUAN TRỌNG

        try {
            const res = await apiService.updateProfile(formData);


            updateUser(res.data.data);
        } catch (err) {
            console.error(err);
        }
    };
    const avatarUrl = user?.avatar
        ? `${process.env.REACT_APP_UPLOAD_URL}${user.avatar}`
        : null;
    return (
        <div className="profile-page">
            <div className="page-header">
                <h1>Hồ sơ cá nhân</h1>
            </div>

            <Row gutter={[24, 24]}>
                <Col xs={24} md={8}>
                    <Card className="profile-card">
                        <div className="profile-avatar">
                            <Avatar
                                size={120}
                                icon={<UserOutlined />}
                                src={avatarUrl}
                            />
                            <Upload customRequest={handleUpload} showUploadList={false}>
                                <Button icon={<UploadOutlined />} style={{ marginTop: 16 }}>
                                    Thay đổi ảnh
                                </Button>
                            </Upload>
                            <h2>{user?.full_name}</h2>
                            <p>{user?.email}</p>
                            <p className="user-role">
                                {user?.role === 'admin' && 'Quản trị viên'}
                                {user?.role === 'manager' && 'Quản lý'}
                                {user?.role === 'receptionist' && 'Lễ tân'}
                                {user?.role === 'kitchen' && 'Bếp'}
                            </p>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} md={16}>
                    <Card className="settings-card">
                        <Tabs defaultActiveKey="profile">
                            <TabPane tab="Thông tin cá nhân" key="profile">
                                <Form
                                    form={profileForm}
                                    layout="vertical"
                                    onFinish={handleUpdateProfile}
                                    initialValues={{
                                        full_name: user?.full_name,
                                        email: user?.email,
                                        username: user?.username
                                    }}
                                >
                                    <Form.Item
                                        name="full_name"
                                        label="Họ và tên"
                                        rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                                    >
                                        <Input prefix={<UserOutlined />} />
                                    </Form.Item>

                                    <Form.Item
                                        name="email"
                                        label="Email"
                                        rules={[
                                            { required: true, message: 'Vui lòng nhập email' },
                                            { type: 'email', message: 'Email không hợp lệ' }
                                        ]}
                                    >
                                        <Input disabled />
                                    </Form.Item>

                                    <Form.Item
                                        name="username"
                                        label="Tên đăng nhập"
                                    >
                                        <Input disabled />
                                    </Form.Item>

                                    <Form.Item>
                                        <Button type="primary" htmlType="submit" loading={loading}>
                                            Cập nhật thông tin
                                        </Button>
                                    </Form.Item>
                                </Form>
                            </TabPane>

                            <TabPane tab="Đổi mật khẩu" key="password">
                                <Form
                                    form={passwordForm}
                                    layout="vertical"
                                    onFinish={handleChangePassword}
                                >
                                    <Form.Item
                                        name="current_password"
                                        label="Mật khẩu hiện tại"
                                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
                                    >
                                        <Input.Password prefix={<LockOutlined />} />
                                    </Form.Item>

                                    <Form.Item
                                        name="new_password"
                                        label="Mật khẩu mới"
                                        rules={[
                                            { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                                            { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
                                        ]}
                                    >
                                        <Input.Password prefix={<LockOutlined />} />
                                    </Form.Item>

                                    <Form.Item
                                        name="confirm_password"
                                        label="Xác nhận mật khẩu"
                                        dependencies={['new_password']}
                                        rules={[
                                            { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                                            ({ getFieldValue }) => ({
                                                validator(_, value) {
                                                    if (!value || getFieldValue('new_password') === value) {
                                                        return Promise.resolve();
                                                    }
                                                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                                                }
                                            })
                                        ]}
                                    >
                                        <Input.Password prefix={<LockOutlined />} />
                                    </Form.Item>

                                    <Form.Item>
                                        <Button type="primary" htmlType="submit" loading={loading}>
                                            Đổi mật khẩu
                                        </Button>
                                    </Form.Item>
                                </Form>
                            </TabPane>
                        </Tabs>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default ProfilePage;