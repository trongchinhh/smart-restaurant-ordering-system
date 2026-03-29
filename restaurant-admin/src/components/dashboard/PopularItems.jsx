import React from 'react';
import { Card, Table, Tag, Avatar, Space } from 'antd';
import { UPLOAD_URL } from '../../services/config';
import './PopularItems.scss';

const PopularItems = ({ data = [], loading }) => {

    const columns = [
        {
            title: 'Món ăn',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <Space>
                    <Avatar
                        src={record.image_url ? `${UPLOAD_URL}${record.image_url}` : null}
                        shape="square"
                        size={40}
                    >
                        {text?.charAt(0) || 'M'}
                    </Avatar>
                    <span>{text}</span>
                </Space>
            )
        },
        {
            title: 'Danh mục',
            dataIndex: ['category', 'name'],
            key: 'category',
            render: (text) => <Tag color="blue">{text || 'Chưa có'}</Tag>
        },
        {
            title: 'Số lượng bán',
            dataIndex: 'total_quantity',
            key: 'total_quantity',
            sorter: (a, b) => (a.total_quantity || 0) - (b.total_quantity || 0),
            render: (value) => <strong>{value || 0}</strong>
        },
        {
            title: 'Doanh thu',
            dataIndex: 'total_revenue',
            key: 'total_revenue',
            sorter: (a, b) => (a.total_revenue || 0) - (b.total_revenue || 0),
            render: (value) =>
                new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND'
                }).format(Number(value) || 0)
        },
        {
            title: 'Số đơn',
            dataIndex: 'order_count',
            key: 'order_count',
            render: (value) => value || 0
        }
    ];

    return (
        <Card title="Món ăn bán chạy" className="popular-items">
            <Table
                columns={columns}
                dataSource={data}
                loading={loading}
                rowKey="id"
                pagination={false}
                size="small"
            />
        </Card>
    );
};

export default PopularItems;