// UserManagement.jsx
import React, { useState } from 'react';
import {
    Table, Button, Modal, Form, Input, Select, Space,
    Avatar, Tag, message, Popconfirm, Tooltip, Badge
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined,
    SearchOutlined, UserAddOutlined,
    UserOutlined, MailOutlined, LockOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { apiService } from '../services/api';
import './UserManagement.scss';

const { Option } = Select;

const UserManagement = ({ currentUser }) => {
    const [open, setOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [form] = Form.useForm();
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery('users', apiService.getUsers);

    // Kiểm tra xem có phải đang thao tác với chính tài khoản đang đăng nhập không
    const isCurrentUser = (user) => {
        return user?.id === currentUser?.id || user?.username === currentUser?.username;
    };

    const createMutation = useMutation(apiService.createUser, {
        onSuccess: () => {
            queryClient.invalidateQueries('users');
            message.success('Thêm người dùng thành công');
        },
        onError: () => {
            message.error('Có lỗi xảy ra khi thêm người dùng');
        }
    });

    const updateMutation = useMutation(
        ({ id, data }) => apiService.updateUserById(id, data),
        {
            onSuccess: () => {
                queryClient.invalidateQueries('users');
                message.success('Cập nhật người dùng thành công');
            },
            onError: () => {
                message.error('Có lỗi xảy ra khi cập nhật');
            }
        }
    );

    const deleteMutation = useMutation(apiService.deleteUser, {
        onSuccess: () => {
            queryClient.invalidateQueries('users');
            message.success('Xóa người dùng thành công');
        },
        onError: () => {
            message.error('Không thể xóa người dùng này');
        }
    });

    const handleSubmit = async (values) => {
        try {
            if (editingUser) {
                // Kiểm tra nếu đang sửa chính tài khoản đang đăng nhập
                if (isCurrentUser(editingUser)) {
                    message.error('Bạn không thể sửa tài khoản của chính mình');
                    return;
                }
                await updateMutation.mutateAsync({ id: editingUser.id, data: values });
            } else {
                await createMutation.mutateAsync(values);
            }

            setOpen(false);
            form.resetFields();
            setEditingUser(null);
        } catch (error) {
            console.error('Submit error:', error);
        }
    };

    const handleEdit = (record) => {
        if (isCurrentUser(record)) {
            message.warning('Bạn không thể sửa tài khoản đang đăng nhập');
            return;
        }
        setEditingUser(record);
        form.setFieldsValue(record);
        setOpen(true);
    };

    const handleDelete = (record) => {
        if (isCurrentUser(record)) {
            message.error('Bạn không thể xóa tài khoản đang đăng nhập');
            return;
        }
        deleteMutation.mutate(record.id);
    };

    const getRoleColor = (role) => {
        const colors = {
            admin: 'red',
            manager: 'orange',
            receptionist: 'blue',
            kitchen: 'green'
        };
        return colors[role] || 'default';
    };

    const getRoleLabel = (role) => {
        const labels = {
            admin: 'Quản trị viên',
            manager: 'Quản lý',
            receptionist: 'Lễ tân',
            kitchen: 'Bếp'
        };
        return labels[role] || role;
    };

    const filteredData = data?.data?.data?.filter(user =>
        user.full_name?.toLowerCase().includes(searchText.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchText.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchText.toLowerCase())
    );

    const columns = [
        {
            title: 'Thông tin',
            dataIndex: 'full_name',
            key: 'full_name',
            render: (text, record) => (
                <div className="user-info-cell">
                    <Avatar
                        style={{ backgroundColor: getRoleColor(record.role) }}
                        icon={<UserOutlined />}
                    />
                    <div className="user-details">
                        <div className="user-name">
                            {text}
                            {isCurrentUser(record) && (
                                <Badge count="Bạn" style={{ backgroundColor: '#52c41a', marginLeft: 8 }} />
                            )}
                        </div>
                        <div className="user-username">
                            <UserOutlined style={{ fontSize: 12, marginRight: 4 }} />
                            @{record.username}
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            render: (email) => (
                <Space>
                    <MailOutlined />
                    <a href={`mailto:${email}`}>{email}</a>
                </Space>
            )
        },
        {
            title: 'Vai trò',
            dataIndex: 'role',
            key: 'role',
            render: (role) => (
                <Tag color={getRoleColor(role)}>
                    {getRoleLabel(role)}
                </Tag>
            )
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 150,
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title={isCurrentUser(record) ? "Không thể sửa tài khoản này" : "Sửa"}>
                        <Button
                            type="link"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                            disabled={isCurrentUser(record)}
                            className={isCurrentUser(record) ? 'disabled-action' : ''}
                        >
                            Sửa
                        </Button>
                    </Tooltip>

                    {!isCurrentUser(record) && (
                        <Popconfirm
                            title="Xác nhận xóa"
                            description={`Bạn có chắc muốn xóa người dùng ${record.full_name}?`}
                            onConfirm={() => handleDelete(record)}
                            okText="Xóa"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                        >
                            <Button
                                type="link"
                                danger
                                icon={<DeleteOutlined />}
                            >
                                Xóa
                            </Button>
                        </Popconfirm>
                    )}
                </Space>
            )
        }
    ];

    return (
        <div className="user-management">
            <div className="user-management-header">
                <div className="header-actions">
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            setEditingUser(null);
                            form.resetFields();
                            setOpen(true);
                        }}
                        size="large"
                    >
                        Thêm người dùng
                    </Button>

                    <Input.Search
                        placeholder="Tìm kiếm theo tên, email, username..."
                        allowClear
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ width: 300 }}
                        prefix={<SearchOutlined />}
                    />
                </div>
            </div>

            <Table
                rowKey="id"
                dataSource={filteredData}
                columns={columns}
                loading={isLoading}
                pagination={{
                    pageSize: 10,
                    showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} người dùng`,
                    showSizeChanger: true,
                    showQuickJumper: true
                }}
                className="user-table"
            />

            <Modal
                open={open}
                onCancel={() => {
                    setOpen(false);
                    form.resetFields();
                    setEditingUser(null);
                }}
                onOk={() => form.submit()}
                title={
                    <div className="modal-title">
                        {editingUser ? (
                            <>
                                <EditOutlined /> Sửa thông tin người dùng
                            </>
                        ) : (
                            <>
                                <UserAddOutlined /> Thêm người dùng mới
                            </>
                        )}
                    </div>
                }
                width={600}
                okText={editingUser ? "Cập nhật" : "Thêm mới"}
                cancelText="Hủy"
            >
                <Form
                    form={form}
                    onFinish={handleSubmit}
                    layout="vertical"
                    className="user-form"
                >
                    <Form.Item
                        name="full_name"
                        label="Họ và tên"
                        rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                    >
                        <Input placeholder="Nhập họ và tên" size="large" prefix={<UserOutlined />} />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập email' },
                            { type: 'email', message: 'Email không hợp lệ' }
                        ]}
                    >
                        <Input placeholder="example@domain.com" size="large" prefix={<MailOutlined />} />
                    </Form.Item>

                    <Form.Item
                        name="username"
                        label="Tên đăng nhập"
                        rules={[{ required: !editingUser, message: 'Vui lòng nhập tên đăng nhập' }]}
                    >
                        <Input
                            placeholder="username"
                            disabled={!!editingUser}
                            size="large"
                            prefix={<UserOutlined />}
                        />
                    </Form.Item>

                    {!editingUser && (
                        <Form.Item
                            name="password"
                            label="Mật khẩu"
                            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
                        >
                            <Input.Password placeholder="Nhập mật khẩu" size="large" prefix={<LockOutlined />} />
                        </Form.Item>
                    )}

                    <Form.Item
                        name="role"
                        label="Vai trò"
                        rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
                    >
                        <Select placeholder="Chọn vai trò" size="large">
                            <Option value="admin">
                                <UserOutlined /> Quản trị viên
                            </Option>
                            <Option value="manager">
                                <UserOutlined /> Quản lý
                            </Option>
                            <Option value="receptionist">
                                Lễ tân
                            </Option>
                            <Option value="kitchen">
                                Bếp
                            </Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default UserManagement;