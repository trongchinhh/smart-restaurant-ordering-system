import React, { useState } from 'react';
import { Card, Row, Col, DatePicker, Space, Tabs } from 'antd';
import { useQuery } from 'react-query';
import { apiService } from '../services/api';
import RevenueChart from '../components/dashboard/RevenueChart';
import RevenueStats from '../components/statistics/RevenueStats';
import ProductStats from '../components/statistics/ProductStats';
import OrderStats from '../components/statistics/OrderStats';
import Loading from '../components/common/Loading';
import RoleGuard from '../components/common/RoleGuard';
import './StatisticsPage.scss';

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const StatisticsPage = () => {
    const [dateRange, setDateRange] = useState({
        startDate: null,
        endDate: null
    });
    const [period, setPeriod] = useState('month');

    const { data: revenueData, isLoading: revenueLoading } = useQuery(
        ['revenue', period, dateRange],
        () => apiService.getRevenueStats({
            period,
            start_date: dateRange.startDate,
            end_date: dateRange.endDate
        }).then(res => res.data)
    );

    const { data: productData, isLoading: productLoading } = useQuery(
        ['products', dateRange],
        () => apiService.getProductStats({
            start_date: dateRange.startDate,
            end_date: dateRange.endDate,
            limit: 20
        }).then(res => res.data)
    );

    const { data: orderData, isLoading: orderLoading } = useQuery(
        ['orders-stats', dateRange],
        () => apiService.getOrderStats({
            start_date: dateRange.startDate,
            end_date: dateRange.endDate
        }).then(res => res.data)
    );

    if (revenueLoading || productLoading || orderLoading) {
        return <Loading fullScreen />;
    }

    const handleDateChange = (dates) => {
        if (dates) {
            setDateRange({
                startDate: dates[0].format('YYYY-MM-DD'),
                endDate: dates[1].format('YYYY-MM-DD')
            });
        } else {
            setDateRange({ startDate: null, endDate: null });
        }
    };

    return (
        <RoleGuard roles={['admin', 'manager']}>
            <div className="statistics-page">
                <div className="page-header">
                    <h1>Thống kê & Báo cáo</h1>
                    <Space>
                        <RangePicker onChange={handleDateChange} />
                    </Space>
                </div>

                <Tabs defaultActiveKey="revenue">
                    <TabPane tab="Doanh thu" key="revenue">
                        <Row gutter={[16, 16]}>
                            <Col span={24}>
                                <RevenueChart
                                    data={revenueData?.data?.revenue || []}
                                    title="Biểu đồ doanh thu"
                                    period={period}
                                    onPeriodChange={setPeriod}
                                />
                            </Col>
                            <Col span={24}>
                                <RevenueStats data={revenueData?.data} />
                            </Col>
                        </Row>
                    </TabPane>

                    <TabPane tab="Sản phẩm" key="products">
                        <Row gutter={[16, 16]}>
                            <Col span={24}>
                                <ProductStats data={productData?.data} />
                            </Col>
                        </Row>
                    </TabPane>

                    <TabPane tab="Đơn hàng" key="orders">
                        <Row gutter={[16, 16]}>
                            <Col span={24}>
                                <OrderStats data={orderData?.data} />
                            </Col>
                        </Row>
                    </TabPane>
                </Tabs>
            </div>
        </RoleGuard>
    );
};

export default StatisticsPage;