import React, { useState, useEffect } from 'react';
import { DatePicker, Card, Statistic, Row, Col, Table, message, Select, Tabs, Radio, Space } from 'antd';
import { DollarOutlined, ShoppingOutlined, TeamOutlined, TrophyOutlined, CalendarOutlined } from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import moment from 'moment';

const { RangePicker } = DatePicker;
const { Option } = Select;

const SuperAdminRevenueManagement = () => {
  const [loading, setLoading] = useState(false);
  const [theaters, setTheaters] = useState([]);
  const [selectedTheater, setSelectedTheater] = useState('all');
  const [revenueData, setRevenueData] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [viewMode, setViewMode] = useState('day'); // 'day' hoặc 'month'
  const [selectedDate, setSelectedDate] = useState(moment());
  const [selectedMonths, setSelectedMonths] = useState([moment(), moment()]);

  const token = localStorage.getItem('admin_token');

  const fetchTheaters = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/admin/theater/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setTheaters(data);
    } catch (error) {
      console.error('Lỗi lấy danh sách rạp:', error);
    }
  };

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

      const [revenueRes, rankingRes, chartRes] = await Promise.all([
        fetch(`http://localhost:5001/api/admin/revenue/super-admin?start_date=${startDate}&end_date=${endDate}&theater_id=${selectedTheater}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`http://localhost:5001/api/admin/revenue/ranking?start_date=${startDate}&end_date=${endDate}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`http://localhost:5001/api/admin/revenue/by-month?start_date=${startDate}&end_date=${endDate}&theater_id=${selectedTheater}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const revenueDataRes = await revenueRes.json();
      const rankingDataRes = await rankingRes.json();
      const chartDataRes = await chartRes.json();

      setRevenueData(revenueDataRes);
      setRanking(rankingDataRes.ranking || []);
      setChartData(chartDataRes);
    } catch (error) {
      console.error('Lỗi lấy dữ liệu doanh thu:', error);
      message.error('Không thể tải dữ liệu doanh thu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTheaters();
  }, []);

  useEffect(() => {
    fetchRevenueData();
  }, [viewMode, selectedDate, selectedMonths, selectedTheater]);

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

  const rankingColumns = [
    {
      title: 'Hạng',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      align: 'center',
      render: (rank) => {
        let style = { fontWeight: 'bold', fontSize: '16px' };
        if (rank === 1) return <span style={{...style, color: '#FFD700'}}>🥇 {rank}</span>;
        if (rank === 2) return <span style={{...style, color: '#C0C0C0'}}>🥈 {rank}</span>;
        if (rank === 3) return <span style={{...style, color: '#CD7F32'}}>🥉 {rank}</span>;
        return <span style={style}>{rank}</span>;
      }
    },
    {
      title: 'Tên rạp',
      dataIndex: 'theater_name',
      key: 'theater_name',
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true
    },
    {
      title: 'Tỉnh/Thành',
      dataIndex: 'province_name',
      key: 'province_name',
    },
    {
      title: 'Số vé',
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
      render: (val) => {
        const value = parseFloat(val || 0);
        return <strong style={{ color: '#3f8600' }}>{value.toLocaleString('vi-VN')} đ</strong>;
      }
    }
  ];

  const theaterDetailColumns = [
    {
      title: 'Tên rạp',
      dataIndex: 'theater_name',
      key: 'theater_name',
    },
    {
      title: 'Tỉnh/Thành',
      dataIndex: 'province_name',
      key: 'province_name',
    },
    {
      title: 'Số vé VIP',
      key: 'vip_tickets',
      align: 'right',
      render: (_, record) => {
        const vipTickets = Math.round(parseFloat(record.vip_revenue || 0) / 100000);
        return vipTickets.toLocaleString('vi-VN');
      }
    },
    {
      title: 'Doanh thu VIP',
      dataIndex: 'vip_revenue',
      key: 'vip_revenue',
      align: 'right',
      render: (val) => `${parseFloat(val || 0).toLocaleString('vi-VN')} đ`
    },
    {
      title: 'Số vé Standard',
      key: 'standard_tickets',
      align: 'right',
      render: (_, record) => {
        const stdTickets = Math.round(parseFloat(record.standard_revenue || 0) / 50000);
        return stdTickets.toLocaleString('vi-VN');
      }
    },
    {
      title: 'Doanh thu Standard',
      dataIndex: 'standard_revenue',
      key: 'standard_revenue',
      align: 'right',
      render: (val) => `${parseFloat(val || 0).toLocaleString('vi-VN')} đ`
    },
    {
      title: 'Tổng doanh thu',
      dataIndex: 'total_revenue',
      key: 'total_revenue',
      align: 'right',
      render: (val) => <strong>{parseFloat(val || 0).toLocaleString('vi-VN')} đ</strong>
    }
  ];

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Card style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>Quản lý doanh thu - Super Admin</h2>
      </Card>
      
      <Card style={{ marginBottom: '24px' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Row gutter={16}>
            <Col span={12}>
              <div style={{ marginBottom: '8px', fontWeight: '500' }}>
                Chọn rạp:
              </div>
              <Select
                value={selectedTheater}
                onChange={setSelectedTheater}
                style={{ width: '100%' }}
                size="large"
              >
                <Option value="all">Tất cả rạp</Option>
                {theaters.map(theater => (
                  <Option key={theater.id} value={theater.id}>
                    {theater.name} - {theater.province_name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: '8px', fontWeight: '500' }}>
                <CalendarOutlined /> Chế độ xem:
              </div>
              <Radio.Group value={viewMode} onChange={handleViewModeChange} size="large">
                <Radio.Button value="day">Theo ngày</Radio.Button>
                <Radio.Button value="month">Theo tháng</Radio.Button>
              </Radio.Group>
            </Col>
          </Row>

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
                Chọn khoảng tháng xem báo cáo:
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
                  value={parseFloat(revenueData.grand_total_revenue || 0)}
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
                  value={revenueData.grand_total_tickets || 0}
                  prefix={<ShoppingOutlined />}
                  valueStyle={{ fontSize: '24px' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Số booking"
                  value={revenueData.grand_total_bookings || 0}
                  prefix={<TeamOutlined />}
                  valueStyle={{ fontSize: '24px' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Số rạp"
                  value={revenueData.total_theaters || 0}
                  prefix={<TrophyOutlined />}
                  valueStyle={{ fontSize: '24px' }}
                />
              </Card>
            </Col>
          </Row>

          {viewMode === 'month' && chartData.length > 0 && (
            <Card title="Biểu đồ doanh thu theo tháng" style={{ marginBottom: '24px' }}>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                  <Tooltip 
                    formatter={(value) => `${parseFloat(value).toLocaleString('vi-VN')} đ`}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#1890ff" name="Doanh thu" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          <Tabs defaultActiveKey="1" style={{ marginBottom: '24px' }}>
            <Tabs.TabPane tab="🏆 Bảng xếp hạng" key="1">
              <Card>
                <Table
                  dataSource={ranking}
                  columns={rankingColumns}
                  rowKey="theater_id"
                  loading={loading}
                  pagination={{ pageSize: 15 }}
                  scroll={{ x: 1200 }}
                />
              </Card>
            </Tabs.TabPane>

            <Tabs.TabPane tab="📊 Chi tiết theo rạp" key="2">
              <Card>
                <Table
                  dataSource={revenueData.theaters || []}
                  columns={theaterDetailColumns}
                  rowKey="theater_id"
                  loading={loading}
                  pagination={{ pageSize: 15 }}
                  scroll={{ x: 1200 }}
                />
              </Card>
            </Tabs.TabPane>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default SuperAdminRevenueManagement;