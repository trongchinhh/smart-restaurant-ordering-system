import React from 'react';
import { Card, Progress, Row, Col, Statistic, Tag } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import './TableOccupancy.scss';

const TableOccupancy = ({ tables, loading }) => {
    const totalTables = tables.length;
    const availableTables = tables.filter(t => t.status === 'available').length;
    const occupiedTables = tables.filter(t => t.status === 'occupied').length;
    const reservedTables = tables.filter(t => t.status === 'reserved').length;

    const occupancyRate = totalTables > 0
        ? ((occupiedTables + reservedTables) / totalTables * 100).toFixed(1)
        : 0;

    const getStatusColor = (status) => {
        const colors = {
            available: 'success',
            occupied: 'processing',
            reserved: 'warning',
            cleaning: 'default'
        };
        return colors[status] || 'default';
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'available':
                return <CheckCircleOutlined />;
            case 'occupied':
                return <ClockCircleOutlined />;
            case 'reserved':
                return <ClockCircleOutlined />;
            default:
                return <CloseCircleOutlined />;
        }
    };

    return (
        <Card title="Tình trạng bàn" className="table-occupancy">
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Progress
                        type="dashboard"
                        percent={parseFloat(occupancyRate)}
                        format={percent => `${percent}%`}
                        strokeColor={{
                            '0%': '#108ee9',
                            '100%': '#87d068'
                        }}
                    />
                </Col>

                <Col span={8}>
                    <Statistic
                        title="Trống"
                        value={availableTables}
                        valueStyle={{ color: '#3f8600' }}
                        prefix={<CheckCircleOutlined />}
                    />
                </Col>
                <Col span={8}>
                    <Statistic
                        title="Đang phục vụ"
                        value={occupiedTables}
                        valueStyle={{ color: '#1890ff' }}
                        prefix={<ClockCircleOutlined />}
                    />
                </Col>
                <Col span={8}>
                    <Statistic
                        title="Đã đặt"
                        value={reservedTables}
                        valueStyle={{ color: '#faad14' }}
                        prefix={<ClockCircleOutlined />}
                    />
                </Col>
            </Row>

            <div className="table-list">
                {tables.slice(0, 8).map(table => (
                    <Tag
                        key={table.id}
                        color={getStatusColor(table.status)}
                        icon={getStatusIcon(table.status)}
                        className="table-tag"
                    >
                        Bàn {table.table_number}
                    </Tag>
                ))}
                {tables.length > 8 && (
                    <Tag>+{tables.length - 8} bàn khác</Tag>
                )}
            </div>
        </Card>
    );
};

export default TableOccupancy;