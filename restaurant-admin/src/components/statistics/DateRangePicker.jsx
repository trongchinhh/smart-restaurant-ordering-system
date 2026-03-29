import React from 'react';
import { DatePicker, Space, Select } from 'antd';
import moment from 'moment';

const { RangePicker } = DatePicker;
const { Option } = Select;

const DateRangePicker = ({ value, onChange, onPresetChange }) => {
    const handlePresetChange = (preset) => {
        let startDate, endDate;
        const today = moment();

        switch (preset) {
            case 'today':
                startDate = today.startOf('day');
                endDate = today.endOf('day');
                break;
            case 'yesterday':
                startDate = moment().subtract(1, 'days').startOf('day');
                endDate = moment().subtract(1, 'days').endOf('day');
                break;
            case 'thisWeek':
                startDate = today.startOf('week');
                endDate = today.endOf('week');
                break;
            case 'lastWeek':
                startDate = moment().subtract(1, 'weeks').startOf('week');
                endDate = moment().subtract(1, 'weeks').endOf('week');
                break;
            case 'thisMonth':
                startDate = today.startOf('month');
                endDate = today.endOf('month');
                break;
            case 'lastMonth':
                startDate = moment().subtract(1, 'months').startOf('month');
                endDate = moment().subtract(1, 'months').endOf('month');
                break;
            case 'thisYear':
                startDate = today.startOf('year');
                endDate = today.endOf('year');
                break;
            default:
                return;
        }

        onChange([startDate, endDate]);
        if (onPresetChange) onPresetChange(preset);
    };

    return (
        <Space>
            <Select
                placeholder="Chọn khoảng thời gian"
                style={{ width: 180 }}
                onChange={handlePresetChange}
                allowClear
            >
                <Option value="today">Hôm nay</Option>
                <Option value="yesterday">Hôm qua</Option>
                <Option value="thisWeek">Tuần này</Option>
                <Option value="lastWeek">Tuần trước</Option>
                <Option value="thisMonth">Tháng này</Option>
                <Option value="lastMonth">Tháng trước</Option>
                <Option value="thisYear">Năm nay</Option>
            </Select>

            <RangePicker
                value={value}
                onChange={onChange}
                format="DD/MM/YYYY"
                allowClear
                style={{ width: 300 }}
            />
        </Space>
    );
};

export default DateRangePicker;