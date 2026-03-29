import React from 'react';
import './Loading.scss';

const Loading = ({ fullScreen = false, text = 'Đang tải...' }) => {
    if (fullScreen) {
        return (
            <div className="loading-fullscreen">
                <div className="spinner"></div>
                <span>{text}</span>
            </div>
        );
    }

    return (
        <div className="loading-container">
            <div className="spinner"></div>
            <span>{text}</span>
        </div>
    );
};

export default Loading;