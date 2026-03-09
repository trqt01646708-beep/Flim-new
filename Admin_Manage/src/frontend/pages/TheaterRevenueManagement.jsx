import React, { useState, useEffect } from 'react';
import { DatePicker, Card, Statistic, Row, Col, Table, message, Radio, Space } from 'antd';
import { DollarOutlined, ShoppingOutlined, TeamOutlined, CalendarOutlined } from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import moment from 'moment';

const { RangePicker } = DatePicker;

const TheaterRevenueManagement = () => {
  const [loading, setLoading] = useState(false);
  const [revenueData, setRevenueData] = useState(null);
  const [movieRevenue, setMovieRevenue] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [viewMode, setViewMode] = useState('day'); // 'day' hoặc 'month'
  const [selectedDate, setSelectedDate] = useState(moment());
  const [selectedMonths, setSelectedMonths] = useState([moment(), moment()]);

  const token = localStorage.getItem('admin_token');

  const fetchRevenueData = async () => {
    setLoading(true);
    try {
      let startDate, endDate;
      
      if (viewMode === 'day') {
        startDate = selectedDate.format('YYYY-MM-DD');
        endDate = selectedDate.format('YYYY-MM-DD');
      } else {
        const sortedMonths = [...selectedMonths].sort((a, b) => a.valueOf() - b.valueOf());
        startDate = sortedMonths[0].startOf('month').format('YYYY-MM-DD');
        endDate = sortedMonths[sortedMonths.length - 1].endOf('month').format('YYYY-MM-DD');
      }

      const [revenueRes, movieRes, chartRes] = await Promise.all([
        fetch(`http://localhost:5001/api/admin/revenue/theater?start_date=${startDate}&end_date=${endDate}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`http://localhost:5001/api/admin/revenue/theater/by-movie?start_date=${startDate}&end_date=${endDate}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`http://localhost:5001/api/admin/revenue/theater/by-date?start_date=${startDate}&end_date=${endDate}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const revenueDataRes = await revenueRes.json();
      const movieDataRes = await movieRes.json();
      const chartDataRes = await chartRes.json();

      setRevenueData(revenueDataRes);
      setMovieRevenue(movieDataRes);
      setChartData(chartDataRes);
    } catch (error) {
      console.error('Lỗi lấy dữ liệu doanh thu:', error);
      message.error('Không thể tải dữ liệu doanh thu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenueData();
  }, [viewMode, selectedDate, selectedMonths]);

  const handleViewModeChange = (e) => {
    setViewMode(e.target.value);
  };

  const handleDateChange = (date) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleMonthChange = (dates) => {
    if (dates && dates.length > 0) {
      setSelectedMonths(dates);
    }
  };

  const movieColumns = [
    {
      title: 'Xếp hạng',
      key: 'rank',
      width: 80,
      render: (text, record, index) => index + 1
    },
    {
      title: 'Tên phim',
      dataIndex: 'movie_title',
      key: 'movie_title',
    },
    {
      title: 'Số vé bán',
      dataIndex: 'total_tickets',
      key: 'total_tickets',
      align: 'right',
      render: (val) => (val || 0).toLocaleString('vi-VN')
    },
    {
      title: 'Số booking',
      dataIndex: 'total_bookings',
      key: 'total_bookings',
      align: 'right',
      render: (val) => (val || 0).toLocaleString('vi-VN')
    },
    {
      title: 'Doanh thu',
      dataIndex: 'total_revenue',
      key: 'total_revenue',
      align: 'right',
      render: (val) => `${parseFloat(val || 0).toLocaleString('vi-VN')} đ`
    }
  ];

  const getViewText = () => {
    if (viewMode === 'day') {
      return `Ngày ${selectedDate.format('DD/MM/YYYY')}`;
    } else {
      if (selectedMonths.length === 1) {
        return `Tháng ${selectedMonths[0].format('MM/YYYY')}`;
      }
      const sortedMonths = [...selectedMonths].sort((a, b) => a.valueOf() - b.valueOf());
      return `Từ ${sortedMonths[0].format('MM/YYYY')} đến ${sortedMonths[sortedMonths.length - 1].format('MM/YYYY')}`;
    }
  };

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Card style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>Báo cáo doanh thu rạp</h2>
      </Card>
      
      <Card style={{ marginBottom: '24px' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <div style={{ marginBottom: '12px', fontWeight: '500', fontSize: '15px' }}>
              <CalendarOutlined /> Chế độ xem:
            </div>
            <Radio.Group value={viewMode} onChange={handleViewModeChange} size="large">
              <Radio.Button value="day">Theo ngày</Radio.Button>
              <Radio.Button value="month">Theo tháng</Radio.Button>
            </Radio.Group>
          </div>

          {viewMode === 'day' ? (
            <div>
              <div style={{ marginBottom: '8px', fontWeight: '500' }}>
                Chọn ngày xem báo cáo:
              </div>
              <DatePicker
                value={selectedDate}
                onChange={handleDateChange}
                format="DD/MM/YYYY"
                placeholder="Chọn ngày"
                style={{ width: '300px' }}
                size="large"
              />
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '8px', fontWeight: '500' }}>
                Chọn tháng xem báo cáo:
              </div>
              <RangePicker
                value={selectedMonths}
                onChange={handleMonthChange}
                picker="month"
                format="MM/YYYY"
                placeholder={['Tháng bắt đầu', 'Tháng kết thúc']}
                style={{ width: '350px' }}
                size="large"
              />
            </div>
          )}

          <div style={{ color: '#1890ff', fontSize: '14px', fontWeight: '500' }}>
            📊 Đang xem: {getViewText()}
          </div>
        </Space>
      </Card>

      {revenueData && (
        <>
          <Row gutter={16} style={{ marginBottom: '24px' }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Tổng doanh thu"
                  value={parseFloat(revenueData.total_revenue || 0)}
                  prefix={<DollarOutlined />}
                  suffix="đ"
                  valueStyle={{ color: '#3f8600', fontSize: '24px' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Tổng số vé"
                  value={revenueData.total_tickets || 0}
                  prefix={<ShoppingOutlined />}
                  valueStyle={{ fontSize: '24px' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Số booking"
                  value={revenueData.total_bookings || 0}
                  prefix={<TeamOutlined />}
                  valueStyle={{ fontSize: '24px' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Vé VIP / Standard"
                  value={`${revenueData.vip_tickets || 0} / ${revenueData.standard_tickets || 0}`}
                  valueStyle={{ fontSize: '20px' }}
                />
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#888' }}>
                  <div>VIP: {parseFloat(revenueData.vip_revenue || 0).toLocaleString('vi-VN')} đ</div>
                  <div>Standard: {parseFloat(revenueData.standard_revenue || 0).toLocaleString('vi-VN')} đ</div>
                </div>
              </Card>
            </Col>
          </Row>

          {viewMode === 'month' && chartData.length > 0 && (
            <Card title="Biểu đồ doanh thu theo ngày" style={{ marginBottom: '24px' }}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => moment(date).format('DD/MM')}
                  />
                  <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip 
                    formatter={(value) => `${parseFloat(value).toLocaleString('vi-VN')} đ`}
                    labelFormatter={(date) => moment(date).format('DD/MM/YYYY')}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#1890ff" 
                    name="Doanh thu"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          <Card title="Doanh thu theo phim">
            <Table
              dataSource={movieRevenue}
              columns={movieColumns}
              rowKey="movie_id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default TheaterRevenueManagement;