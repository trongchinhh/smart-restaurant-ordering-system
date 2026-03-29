import React, { useState } from 'react';
import { Layout, Avatar, Dropdown, Menu, Badge, Space, Typography } from 'antd';
import {
    UserOutlined,
    LogoutOutlined,
    SettingOutlined,
    BellOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined
} from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import './Header.scss';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

const Header = ({ collapsed, setCollapsed }) => {
    const { user, logout, hasRole } = useAuth();
    const navigate = useNavigate();
    const [notifications] = useState([]);
    const isKitchen = hasRole('kitchen');
    const isReceptionist = hasRole('receptionist');
    const userMenu = (
        <Menu>
            {!isKitchen && !isReceptionist && (
                <>
                    <Menu.Item key="profile" icon={<UserOutlined />} onClick={() => navigate('/profile')}>
                        Hồ sơ
                    </Menu.Item>
                    <Menu.Item key="settings" icon={<SettingOutlined />} onClick={() => navigate('/settings')}>
                        Cài đặt
                    </Menu.Item>
                    <Menu.Divider />
                </>
            )}

            <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={logout} danger>
                Đăng xuất
            </Menu.Item>
        </Menu>
    );

    const notificationMenu = (
        <Menu>
            {notifications.length > 0 ? (
                notifications.map((notif, index) => (
                    <Menu.Item key={index}>
                        <Text strong>{notif.title}</Text>
                        <br />
                        <Text type="secondary">{notif.message}</Text>
                    </Menu.Item>
                ))
            ) : (
                <Menu.Item disabled>Không có thông báo</Menu.Item>
            )}
        </Menu>
    );

    const getRoleName = (role) => {
        const roles = {
            admin: 'Quản trị viên',
            manager: 'Quản lý',
            receptionist: 'Lễ tân',
            kitchen: 'Bếp'
        };
        return roles[role] || role;
    };
    const avatarUrl = user?.avatar
        ? `${process.env.REACT_APP_UPLOAD_URL}${user.avatar}`
        : null;

    return (
        <AntHeader className="site-header">
            <div className="header-left">
                {React.createElement(
                    collapsed ? MenuUnfoldOutlined : MenuFoldOutlined,
                    {
                        className: 'trigger',
                        onClick: () => setCollapsed(!collapsed)
                    }
                )}
            </div>

            <div className="header-right">
                <Dropdown overlay={notificationMenu} trigger={['click']} placement="bottomRight">
                    <Badge count={notifications.length} className="notification-badge">
                        <BellOutlined className="header-icon" />
                    </Badge>
                </Dropdown>

                <Dropdown overlay={userMenu} trigger={['click']} placement="bottomRight">
                    <Space className="user-info">
                        <Avatar icon={<UserOutlined />} src={avatarUrl} />
                        <div className="user-details">
                            <Text strong>{user?.full_name}</Text>
                            <br />
                            <Text type="secondary" className="user-role">
                                {getRoleName(user?.role)}
                            </Text>
                        </div>
                    </Space>
                </Dropdown>
            </div>
        </AntHeader>
    );
};

export default Header;