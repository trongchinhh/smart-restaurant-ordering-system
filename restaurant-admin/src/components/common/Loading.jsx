import React from 'react';
import { Spin } from 'antd';
import './Loading.scss';

const Loading = ({ fullScreen = false, tip = 'Đang tải...' }) => {
    if (fullScreen) {
        return (
            <div className="loading-fullscreen">
                <Spin size="large" tip={tip} />
            </div>
        );
    }

    return (
        <div className="loading-container">
            <Spin tip={tip} />
        </div>
    );
};

export default Loading;