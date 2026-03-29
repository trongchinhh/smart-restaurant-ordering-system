import React, { useEffect, useState } from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    DashboardOutlined,
    TableOutlined,
    MenuOutlined,
    ShoppingOutlined,
    //KitchenOutlined,
    CoffeeOutlined,
    BarChartOutlined,
    SettingOutlined,
    UserOutlined,
    QrcodeOutlined
} from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import logo from '../../assets/images/logo.jpg';
import './Sidebar.scss';

const { Sider } = Layout;

const Sidebar = ({ collapsed }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, hasRole } = useAuth();
    const { can } = usePermissions();
    const [menuItems, setMenuItems] = useState([]);
    const isKitchen = hasRole('kitchen');
    const isReceptionist = hasRole('receptionist');
    useEffect(() => {
        const items = [
            {
                key: 'dashboard',
                icon: <DashboardOutlined />,
                label: 'Dashboard',
                onClick: () => navigate('/dashboard'),
                visible: can('viewDashboard')
            },
            {
                key: 'tables',
                icon: <TableOutlined />,
                label: 'Quản lý bàn',
                onClick: () => navigate('/tables'),
                visible: can('viewTables')
            },
            {
                key: 'menu',
                icon: <MenuOutlined />,
                label: 'Thực đơn',
                onClick: () => navigate('/menu'),
                visible: can('viewMenu')
            },
            {
                key: 'orders',
                icon: <ShoppingOutlined />,
                label: 'Đơn hàng',
                onClick: () => navigate('/orders'),
                visible: can('viewOrders')
            },
            {
                key: 'kitchen',
                icon: <CoffeeOutlined />,
                label: 'Khu vực bếp',
                onClick: () => navigate('/kitchen'),
                visible: can('viewKitchenQueue')
            },
            // THÊM MỤC TAKEAWAY QR

            {
                key: 'statistics',
                icon: <BarChartOutlined />,
                label: 'Thống kê',
                onClick: () => navigate('/statistics'),
                visible: can('viewStatistics')
            },
            {
                key: 'settings',
                icon: <SettingOutlined />,
                label: 'Cài đặt',
                onClick: () => navigate('/settings'),
                visible: can('viewSettings')
            }
        ];

        setMenuItems(items.filter(item => item.visible));
    }, [navigate, can]);

    const selectedKey = menuItems.find(item =>
        location.pathname.startsWith(`/${item.key}`)
    )?.key || 'dashboard';

    return (
        <Sider trigger={null} collapsible collapsed={collapsed} className="site-sidebar">
            <div className="logo-container">
                <img src={logo} alt="Restaurant Logo" className="logo" />
                {!collapsed && <span className="logo-text">Nhà Hàng ChiLin</span>}
            </div>

            <Menu
                theme="dark"
                mode="inline"
                selectedKeys={[selectedKey]}
                items={menuItems}
                className="sidebar-menu"
            />
            {!isKitchen && !isReceptionist && (
                <div className="sidebar-footer">
                    <Menu theme="dark" mode="inline" selectable={false}>
                        <Menu.Item key="profile" icon={<UserOutlined />} onClick={() => navigate('/profile')}>
                            {!collapsed && 'Hồ sơ'}
                        </Menu.Item>
                    </Menu>
                </div>
            )}

        </Sider>
    );
};

export default Sidebar;