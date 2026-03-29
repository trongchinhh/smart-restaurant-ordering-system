import React from 'react';
import { Card, Statistic, Space } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import './StatsCard.scss';

const StatsCard = ({ title, value, icon, trend, color = '#1890ff', formatter }) => {
    const renderTrend = () => {
        if (trend === undefined || trend === null) {
            return <div className="stats-trend stats-trend--placeholder">.</div>;
        }

        if (trend > 0) {
            return (
                <div className="stats-trend" style={{ color: '#3f8600' }}>
                    <ArrowUpOutlined /> {Math.abs(trend)}% so với kỳ trước
                </div>
            );
        }

        if (trend < 0) {
            return (
                <div className="stats-trend" style={{ color: '#cf1322' }}>
                    <ArrowDownOutlined /> {Math.abs(trend)}% so với kỳ trước
                </div>
            );
        }

        return (
            <div className="stats-trend" style={{ color: '#8c8c8c' }}>
                Không thay đổi so với kỳ trước
            </div>
        );
    };

    return (
        <Card className="stats-card" bordered={false}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div className="stats-header">
                    <span className="stats-title">{title}</span>
                    {icon && <span className="stats-icon" style={{ color }}>{icon}</span>}
                </div>

                <Statistic
                    value={value}
                    formatter={formatter}
                    valueStyle={{ fontSize: '24px', fontWeight: 'bold', color }}
                />

                {renderTrend()}
            </Space>
        </Card>
    );
};

export default StatsCard;