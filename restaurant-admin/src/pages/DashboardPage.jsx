import React, { useState, useEffect } from 'react';
import { Row, Col, Space } from 'antd';
import {
    DollarCircleOutlined,
    ShoppingCartOutlined,
    UserOutlined,
    TableOutlined
} from '@ant-design/icons';
import { useQuery } from 'react-query';
import { apiService } from '../services/api';
import StatsCard from '../components/dashboard/StatsCard';
import RevenueChart from '../components/dashboard/RevenueChart';
import PopularItems from '../components/dashboard/PopularItems';
import TableOccupancy from '../components/dashboard/TableOccupancy';
import Loading from '../components/common/Loading';
import RoleGuard from '../components/common/RoleGuard';
import './DashboardPage.scss';

const DashboardPage = () => {
    const [period, setPeriod] = useState('day');
    const [revenueData, setRevenueData] = useState([]);

    const { data: dashboardData, isLoading: dashboardLoading } = useQuery(
        'dashboard',
        () => apiService.getDashboardStats().then(res => res.data.data)
    );

    const { data: tablesData, isLoading: tablesLoading } = useQuery(
        'tables',
        () => apiService.getTables({ limit: 100 }).then(res => res.data)
    );

    const { data: revenueStats, isLoading: revenueLoading } = useQuery(
        ['revenue', period],
        () => apiService.getRevenueStats({ period }).then(res => res.data.data),
        {
            onSuccess: (data) => {
                setRevenueData(data?.revenue || []);
            }
        }
    );

    if (dashboardLoading || tablesLoading || revenueLoading) {
        return <Loading fullScreen />;
    }

    const stats = dashboardData || {};
    const tables = tablesData?.data || [];
    const popularItems = stats.popularItems || [];

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value);
    };

    return (
        <RoleGuard roles={['admin', 'manager', 'receptionist']}>
            <div className="dashboard-page">
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} lg={6}>
                            <StatsCard
                                title="Doanh thu hôm nay"
                                value={stats.today?.revenue || 0}
                                formatter={formatCurrency}
                                icon={<DollarCircleOutlined />}
                                trend={stats.trends?.revenue}
                                color="#52c41a"
                            />
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <StatsCard
                                title="Đơn hàng hôm nay"
                                value={stats.today?.orders || 0}
                                icon={<ShoppingCartOutlined />}
                                trend={stats.trends?.orders}
                                color="#1890ff"
                            />
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <StatsCard
                                title="Đơn đang phục vụ"
                                value={stats.activeOrders || 0}
                                icon={<UserOutlined />}
                                color="#faad14"
                            />
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <StatsCard
                                title="Bàn trống"
                                value={stats.tables?.available || 0}
                                icon={<TableOutlined />}
                                color="#722ed1"
                            />
                        </Col>
                    </Row>

                    <Row gutter={[16, 16]}>
                        <Col xs={24} lg={16}>
                            <RevenueChart
                                data={revenueData}
                                title="Biểu đồ doanh thu"
                                period={period}
                                onPeriodChange={setPeriod}
                            />
                        </Col>
                        <Col xs={24} lg={8}>
                            <TableOccupancy tables={tables} loading={tablesLoading} />
                        </Col>
                    </Row>

                    <Row gutter={[16, 16]}>
                        <Col xs={24}>
                            <PopularItems data={popularItems} loading={dashboardLoading} />
                        </Col>
                    </Row>
                </Space>
            </div>
        </RoleGuard>
    );
};

export default DashboardPage;