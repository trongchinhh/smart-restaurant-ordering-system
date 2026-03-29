import React from 'react';
import { Card, Row, Col, Statistic, Table } from 'antd';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid
} from 'recharts';
import {
    ShoppingCartOutlined,
    ClockCircleOutlined
} from '@ant-design/icons';
import moment from 'moment';
// import './OrderStats.scss';

const OrderStats = ({ data }) => {
    const ordersByStatus = data?.ordersByStatus || [];
    const ordersByHour = data?.ordersByHour || [];
    const averagePreparationTime = data?.averagePreparationTime || 0;

    const totalOrders = ordersByStatus.reduce(
        (sum, item) => sum + Number(item.count || 0),
        0
    );

    const statusData = ordersByStatus.map(item => ({
        status: item.status,
        count: Number(item.count || 0)
    }));

    const hourData = ordersByHour.map(item => ({
        hour: `${String(item.hour).padStart(2, '0')}:00`,
        count: Number(item.count || 0)
    }));

    const statusColumns = [
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status'
        },
        {
            title: 'Số lượng đơn',
            dataIndex: 'count',
            key: 'count',
            render: (value) => Number(value) || 0
        }
    ];

    const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'];

    return (
        <div className="order-stats">
            <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                    <Card>
                        <Statistic
                            title="Tổng số đơn hàng"
                            value={totalOrders}
                            prefix={<ShoppingCartOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card>
                        <Statistic
                            title="Thời gian chuẩn bị trung bình"
                            value={averagePreparationTime}
                            suffix="phút"
                            prefix={<ClockCircleOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col xs={24} lg={12}>
                    <Card title="Đơn hàng theo trạng thái">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    dataKey="count"
                                    nameKey="status"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>

                <Col xs={24} lg={12}>
                    <Card title="Đơn hàng theo khung giờ">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={hourData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="hour" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="count" name="Số đơn" fill="#1890ff" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col span={24}>
                    <Card title="Chi tiết trạng thái đơn hàng">
                        <Table
                            columns={statusColumns}
                            dataSource={statusData}
                            rowKey="status"
                            pagination={false}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default OrderStats;