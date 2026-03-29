import React from 'react';
import { Card, Table, Tag, Progress, Space } from 'antd';
import { UPLOAD_URL } from '../../services/config';
import './ProductStats.scss';

const ProductStats = ({ data }) => {

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value || 0);
    };

    const bestSellingColumns = [
        {
            title: 'Món ăn',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <Space>
                    <img
                        src={record.image_url ? `${UPLOAD_URL}${record.image_url}` : '/placeholder-food.jpg'}
                        //alt={text}
                        className="product-image"
                    />
                    <span>{text}</span>
                </Space>
            )
        },
        {
            title: 'Danh mục',
            dataIndex: ['category', 'name'],
            key: 'category',
            render: (text) => <Tag>{text}</Tag>
        },
        {
            title: 'Số lượng bán',
            dataIndex: 'total_quantity',
            key: 'total_quantity',
            sorter: (a, b) => a.total_quantity - b.total_quantity,
            render: (value, record) => (
                <Space direction="vertical" size={0}>
                    <span>{value}</span>
                    <Progress
                        percent={Math.round((value / data?.bestSelling?.[0]?.total_quantity) * 100)}
                        size="small"
                        showInfo={false}
                        strokeColor="#52c41a"
                    />
                </Space>
            )
        },
        {
            title: 'Doanh thu',
            dataIndex: 'total_revenue',
            key: 'total_revenue',
            sorter: (a, b) => a.total_revenue - b.total_revenue,
            render: (value) => formatCurrency(value)
        },
        {
            title: 'Số đơn',
            dataIndex: 'order_count',
            key: 'order_count',
            render: (value) => value
        }
    ];

    const categoryColumns = [
        {
            title: 'Danh mục',
            dataIndex: 'category_name',
            key: 'category_name',
            render: (text) => <strong>{text}</strong>
        },
        {
            title: 'Số lượng bán',
            dataIndex: 'total_quantity',
            key: 'total_quantity',
            render: (value) => value
        },
        {
            title: 'Doanh thu',
            dataIndex: 'total_revenue',
            key: 'total_revenue',
            render: (value) => formatCurrency(value)
        },
        {
            title: 'Tỷ trọng',
            key: 'percentage',
            render: (_, record) => {
                const total = (data?.categoryStats || []).reduce(
                    (sum, cat) => sum + Number(cat.total_revenue || 0),
                    0
                );

                const revenue = Number(record.total_revenue || 0);
                const percentage = total > 0 ? ((revenue / total) * 100).toFixed(1) : '0.0';

                return (
                    <Space>
                        <Progress
                            type="circle"
                            percent={Number(percentage)}
                            width={40}
                            format={() => `${percentage}%`}
                        />
                    </Space>
                );
            }
        }
    ];

    return (
        <div className="product-stats">
            <Card title="Top món ăn bán chạy" className="best-selling">
                <Table
                    columns={bestSellingColumns}
                    dataSource={data?.bestSelling || []}
                    rowKey="id"
                    pagination={false}
                />
            </Card>

            <Card title="Thống kê theo danh mục" className="category-stats">
                <Table
                    columns={categoryColumns}
                    dataSource={data?.categoryStats || []}
                    rowKey="category_id"
                    pagination={false}
                />
            </Card>
        </div>
    );
};

export default ProductStats;