import React from 'react';
import { Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const { confirm } = Modal;

export const showConfirm = ({
    title = 'Xác nhận',
    content = 'Bạn có chắc chắn muốn thực hiện hành động này?',
    okText = 'Đồng ý',
    cancelText = 'Hủy',
    onOk,
    onCancel,
    type = 'confirm'
}) => {
    const config = {
        title,
        icon: <ExclamationCircleOutlined />,
        content,
        okText,
        cancelText,
        onOk,
        onCancel
    };

    switch (type) {
        case 'info':
            Modal.info(config);
            break;
        case 'success':
            Modal.success(config);
            break;
        case 'error':
            Modal.error(config);
            break;
        case 'warning':
            Modal.warning(config);
            break;
        default:
            confirm(config);
    }
};

export const showDeleteConfirm = (props) => {
    return showConfirm({
        title: 'Xác nhận xóa',
        content: 'Bạn có chắc chắn muốn xóa? Hành động này không thể hoàn tác.',
        okText: 'Xóa',
        okButtonProps: { danger: true },
        ...props
    });
};

export default showConfirm;