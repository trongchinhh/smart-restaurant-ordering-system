import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import './Unauthorized.scss';

const Unauthorized = () => {
    const navigate = useNavigate();

    return (
        <div className="unauthorized-page">
            <Result
                status="403"
                title="403"
                subTitle="Xin lỗi, bạn không có quyền truy cập trang này."
                extra={
                    <Button type="primary" onClick={() => navigate('/dashboard')}>
                        Về trang chủ
                    </Button>
                }
            />
        </div>
    );
};

export default Unauthorized;