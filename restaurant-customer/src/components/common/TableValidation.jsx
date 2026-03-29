// src/components/common/TableValidation.jsx
import React from 'react';
import { useTable } from '../../hooks/useTable';
import { Result, Button } from 'antd-mobile';

const TableValidation = ({ children }) => {
    const { loading, error, tableInfo } = useTable();

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loader"></div>
                <p>Đang xác thực thông tin bàn...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-screen">
                <Result
                    status="error"
                    title="Lỗi xác thực"
                    description={error}
                />
                <Button
                    color="primary"
                    onClick={() => window.location.href = '/'}
                >
                    Thử lại
                </Button>
            </div>
        );
    }

    if (!tableInfo) {
        return (
            <div className="error-screen">
                <Result
                    status="info"
                    title="Không tìm thấy bàn"
                    description="Vui lòng quét mã QR tại bàn để đặt món"
                />
            </div>
        );
    }

    return children;
};

export default TableValidation;