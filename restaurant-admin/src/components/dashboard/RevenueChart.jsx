import React from 'react';
import { Card, Select, Space, Empty } from 'antd';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import './RevenueChart.scss';

const { Option } = Select;

// ================= FORMAT TIỀN =================
const formatCurrency = (value) => {
    if (!value) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(value);
};

// ================= TOOLTIP FORMAT =================
const tooltipFormatter = (value, name) => {
    if (name === 'Doanh thu') {
        return [formatCurrency(value), name];
    }
    return [value, name];
};

const RevenueChart = ({
    data = [],
    title,
    type = 'line',
    period = 'day',
    onPeriodChange
}) => {

    const renderChart = () => {
        switch (type) {

            // ================= AREA =================
            case 'area':
                return (
                    <AreaChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />

                        <YAxis tickFormatter={formatCurrency} />

                        <Tooltip formatter={tooltipFormatter} />
                        <Legend />

                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#8884d8"
                            fill="#8884d8"
                            name="Doanh thu"
                        />
                        <Area
                            type="monotone"
                            dataKey="order_count"
                            stroke="#82ca9d"
                            fill="#82ca9d"
                            name="Đơn hàng"
                        />
                    </AreaChart>
                );

            // ================= BAR =================
            case 'bar':
                return (
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />

                        <YAxis tickFormatter={formatCurrency} />

                        <Tooltip formatter={tooltipFormatter} />
                        <Legend />

                        <Bar
                            dataKey="revenue"
                            fill="#8884d8"
                            name="Doanh thu"
                        />
                        <Bar
                            dataKey="order_count"
                            fill="#82ca9d"
                            name="Đơn hàng"
                        />
                    </BarChart>
                );

            // ================= LINE (DEFAULT) =================
            default:
                return (
                    <LineChart
                        data={data}
                        margin={{ top: 10, right: 20, left: 30, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />

                        <XAxis dataKey="period" />

                        <YAxis
                            width={90}
                            tickFormatter={formatCurrency}
                        />

                        <Tooltip formatter={tooltipFormatter} />
                        <Legend />

                        <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="#8884d8"
                            name="Doanh thu"
                        />
                        <Line
                            type="monotone"
                            dataKey="order_count"
                            stroke="#82ca9d"
                            name="Đơn hàng"
                        />
                    </LineChart>
                );
        }
    };

    return (
        <Card
            className="revenue-chart"
            title={title}
            extra={
                <Space>
                    <Select
                        value={period}
                        onChange={onPeriodChange}
                        style={{ width: 120 }}
                    >
                        <Option value="day">Theo ngày</Option>
                        <Option value="week">Theo tuần</Option>
                        <Option value="month">Theo tháng</Option>
                        <Option value="year">Theo năm</Option>
                    </Select>
                </Space>
            }
        >
            {data?.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                    {renderChart()}
                </ResponsiveContainer>
            ) : (
                <Empty description="Chưa có dữ liệu doanh thu" />
            )}
        </Card>
    );
};

export default RevenueChart;