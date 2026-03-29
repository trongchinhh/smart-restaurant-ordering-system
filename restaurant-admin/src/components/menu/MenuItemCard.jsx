import React from 'react';
import { Card, Tag, Space, Button, Tooltip, Image } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { UPLOAD_URL } from '../../services/config';
import './MenuItemCard.scss';

const MenuItemCard = ({ item, onEdit, onDelete, onView, canEdit, canDelete }) => {
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value);
    };

    const getStatusColor = (status) => {
        const colors = {
            available: 'success',
            unavailable: 'default',
            sold_out: 'error'
        };
        return colors[status] || 'default';
    };

    const getStatusText = (status) => {
        const texts = {
            available: 'Còn món',
            unavailable: 'Hết món',
            sold_out: 'Tạm hết'
        };
        return texts[status] || status;
    };

    return (
        <Card
            className="menu-item-card"
            cover={
                <div className="item-image">
                    <Image
                        src={item.image_url ? `${UPLOAD_URL}/${item.image_url}` : '/placeholder-food.jpg'}
                        alt={item.name}
                        fallback="/placeholder-food.jpg"
                    />
                    {item.discount_price && (
                        <div className="discount-badge">
                            -{Math.round((1 - item.discount_price / item.price) * 100)}%
                        </div>
                    )}
                </div>
            }
            actions={[
                <Tooltip title="Xem chi tiết">
                    <EyeOutlined key="view" onClick={() => onView(item)} />
                </Tooltip>,
                canEdit && (
                    <Tooltip title="Chỉnh sửa">
                        <EditOutlined key="edit" onClick={() => onEdit(item)} />
                    </Tooltip>
                ),
                canDelete && (
                    <Tooltip title="Xóa">
                        <DeleteOutlined key="delete" onClick={() => onDelete(item)} />
                    </Tooltip>
                )
            ].filter(Boolean)}
        >
            <Card.Meta
                title={
                    <div className="item-title">
                        <span>{item.name}</span>
                        <Tag color={getStatusColor(item.status)}>
                            {getStatusText(item.status)}
                        </Tag>
                    </div>
                }
                description={
                    <div className="item-details">
                        <div className="item-category">
                            <Tag color="blue">{item.category?.name}</Tag>
                        </div>
                        <div className="item-price">
                            {item.discount_price ? (
                                <>
                                    <span className="original-price">{formatCurrency(item.price)}</span>
                                    <span className="discount-price">{formatCurrency(item.discount_price)}</span>
                                </>
                            ) : (
                                <span className="price">{formatCurrency(item.price)}</span>
                            )}
                        </div>
                        <div className="item-time">
                            <span>⏱️ {item.preparation_time} phút</span>
                        </div>
                        {item.is_recommended && <Tag color="gold">Gợi ý</Tag>}
                        {item.is_new && <Tag color="green">Mới</Tag>}
                    </div>
                }
            />
        </Card>
    );
};

export default MenuItemCard;