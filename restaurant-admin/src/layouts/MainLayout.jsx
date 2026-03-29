import React, { useState } from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import './MainLayout.scss';

const { Content } = Layout;

const MainLayout = () => {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <Layout className="main-layout">
            <Sidebar collapsed={collapsed} />
            <Layout className="site-layout">
                <Header collapsed={collapsed} setCollapsed={setCollapsed} />
                <Content className="site-content">
                    <div className="content-wrapper">
                        <Outlet />
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
};

export default MainLayout;