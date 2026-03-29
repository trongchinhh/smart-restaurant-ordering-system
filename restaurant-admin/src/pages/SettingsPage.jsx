// SettingsPage.jsx
import React from 'react';
import { Card, Tabs } from 'antd';
import { SettingOutlined, UserOutlined, SafetyOutlined } from '@ant-design/icons';
import RoleGuard from '../components/common/RoleGuard';
import { useAuth } from '../contexts/AuthContext';
import './SettingsPage.scss';
import UserManagement from './UserManagement';

const { TabPane } = Tabs;

const SettingsPage = () => {
    const { user } = useAuth();

    return (
        <RoleGuard roles={['admin', 'manager']}>
            <div className="settings-page">
                <div className="page-header">
                    <div className="header-content">
                        <SettingOutlined className="header-icon" />
                        <div>
                            <h1>Cài đặt hệ thống</h1>
                            <p className="header-description">
                                Quản lý cấu hình và người dùng hệ thống
                            </p>
                        </div>
                    </div>
                </div>

                <Card className="settings-card" bordered={false}>
                    <Tabs defaultActiveKey="users">
                        <TabPane
                            tab={
                                <span>
                                    <UserOutlined />
                                    Quản lý người dùng
                                </span>
                            }
                            key="users"
                        >
                            <UserManagement currentUser={user} />
                        </TabPane>

                        <TabPane
                            tab={
                                <span>
                                    <SafetyOutlined />
                                    Bảo mật
                                </span>
                            }
                            key="security"
                        >
                            <div className="security-settings">
                                <p>Các cài đặt bảo mật sẽ sớm được cập nhật...</p>
                            </div>
                        </TabPane>
                    </Tabs>
                </Card>
            </div>
        </RoleGuard>
    );
};

export default SettingsPage;