import React from 'react';
import { Card, Row, Col, Statistic, Table, Tag } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import './RevenueStats.scss';

const RevenueStats = ({ data }) => {
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value || 0);
    };

    const paymentColumns = [
        {
            title: 'Phương thức',
            dataIndex: 'payment_method',
            key: 'payment_method',
            render: (method) => {
                const labels = {
                    cash: 'Tiền mặt',
                    card: 'Thẻ ngân hàng',
                    transfer: 'Chuyển khoản'
                };
                return labels[method] || method;
            }
        },
        {
            title: 'Số đơn',
            dataIndex: 'count',
            key: 'count',
            render: (count) => count
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'total',
            key: 'total',
            render: (total) => formatCurrency(total)
        }
    ];

    const summary = data?.summary || {};

    return (
        <div className="revenue-stats">
            <Row gutter={[16, 16]}>
                <Col span={8}>
                    <Card className="stat-card">
                        <Statistic
                            title="Tổng doanh thu"
                            value={summary.totalRevenue || 0}
                            formatter={(value) => formatCurrency(value)}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card className="stat-card">
                        <Statistic
                            title="Tổng số đơn"
                            value={summary.totalOrders || 0}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card className="stat-card">
                        <Statistic
                            title="Giá trị trung bình"
                            value={summary.avgOrderValue || 0}
                            formatter={(value) => formatCurrency(value)}
                            valueStyle={{ color: '#722ed1' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Card title="Thống kê theo phương thức thanh toán" className="payment-stats">
                <Table
                    columns={paymentColumns}
                    dataSource={data?.paymentMethods || []}
                    rowKey="payment_method"
                    pagination={false}
                />
            </Card>

            <Card title="Chi tiết doanh thu" className="revenue-detail">
                <Table
                    columns={[
                        {
                            title: 'Kỳ',
                            dataIndex: 'period',
                            key: 'period'
                        },
                        {
                            title: 'Số đơn',
                            dataIndex: 'order_count',
                            key: 'order_count'
                        },
                        {
                            title: 'Doanh thu',
                            dataIndex: 'revenue',
                            key: 'revenue',
                            render: (value) => formatCurrency(value)
                        },
                        {
                            title: 'TB/đơn',
                            dataIndex: 'avg_order_value',
                            key: 'avg_order_value',
                            render: (value) => formatCurrency(value)
                        }
                    ]}
                    dataSource={data?.revenue || []}
                    rowKey="period"
                    pagination={false}
                />
            </Card>
        </div>
    );
};

export default RevenueStats;