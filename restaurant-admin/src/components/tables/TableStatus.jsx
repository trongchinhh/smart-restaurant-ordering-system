import React from 'react';
import { Badge, Tooltip, Popover, Button } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import './TableStatus.scss';

const TableStatus = ({ table, onStatusChange, canChangeStatus }) => {
    const getStatusConfig = (status) => {
        const configs = {
            available: {
                color: 'success',
                icon: <CheckCircleOutlined />,
                text: 'Trống',
                nextStatus: 'occupied'
            },
            occupied: {
                color: 'processing',
                icon: <ClockCircleOutlined />,
                text: 'Đang phục vụ',
                nextStatus: 'available'
            },
            reserved: {
                color: 'warning',
                icon: <ClockCircleOutlined />,
                text: 'Đã đặt',
                nextStatus: 'occupied'
            },
            cleaning: {
                color: 'default',
                icon: <CloseCircleOutlined />,
                text: 'Đang dọn',
                nextStatus: 'available'
            }
        };
        return configs[status] || configs.available;
    };

    const statusConfig = getStatusConfig(table.status);

    const statusContent = (
        <div className="status-popover">
            <h4>Chuyển trạng thái</h4>
            <div className="status-actions">
                {['available', 'occupied', 'reserved', 'cleaning'].map(status => {
                    const config = getStatusConfig(status);
                    return (
                        <Button
                            key={status}
                            type={table.status === status ? 'primary' : 'default'}
                            icon={config.icon}
                            onClick={() => onStatusChange(table.id, status)}
                            block
                            style={{ marginBottom: 8 }}
                        >
                            {config.text}
                        </Button>
                    );
                })}
            </div>
        </div>
    );

    const statusBadge = (
        <Badge
            status={statusConfig.color}
            text={statusConfig.text}
        />
    );

    if (canChangeStatus) {
        return (
            <Popover
                content={statusContent}
                title="Cập nhật trạng thái"
                trigger="click"
                placement="right"
            >
                <Tooltip title="Nhấp để thay đổi trạng thái">
                    <div className="table-status">
                        {statusBadge}
                    </div>
                </Tooltip>
            </Popover>
        );
    }

    return statusBadge;
};

export default TableStatus;