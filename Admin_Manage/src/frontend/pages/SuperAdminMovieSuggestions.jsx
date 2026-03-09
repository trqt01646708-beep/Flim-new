import React, { useState, useEffect } from 'react';
import { Table, Button, message, Card, Tag, Modal, Image, Descriptions, Space, Tabs, DatePicker, Select, Radio } from 'antd';
import { CheckOutlined, CloseOutlined, EyeOutlined, HistoryOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

const { RangePicker } = DatePicker;
const { Option } = Select;

const SuperAdminMovieSuggestions = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [approveScope, setApproveScope] = useState('requester');
  
  // Filter cho lịch sử
  const [dateRange, setDateRange] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const token = localStorage.getItem('admin_token');

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5001/api/admin/suggestions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuggestions(response.data);
    } catch (error) {
      console.error('Lỗi lấy danh sách:', error);
      message.error('Không thể tải danh sách đề xuất');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const handleApprove = (id) => {
    setSelectedId(id);
    setApproveScope('requester');
    setApproveModalVisible(true);
  };

  const handleReject = (id) => {
    setSelectedId(id);
    setRejectModalVisible(true);
  };

  const confirmApprove = async () => {
    try {
      const response = await axios.put(
        `http://localhost:5001/api/admin/suggestions/${selectedId}/approve`,
        { scope: approveScope },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success('Đã phê duyệt và thêm phim vào hệ thống');
      setApproveModalVisible(false);
      setApproveScope('requester');
      fetchSuggestions();
    } catch (error) {
      console.error('Error:', error);
      message.error(error.response?.data?.error || 'Lỗi phê duyệt');
    }
  };

  const confirmReject = async () => {
    try {
      const response = await axios.put(
        `http://localhost:5001/api/admin/suggestions/${selectedId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success('Đã từ chối đề xuất');
      setRejectModalVisible(false);
      fetchSuggestions();
    } catch (error) {
      console.error('Error:', error);
      message.error(error.response?.data?.error || 'Lỗi từ chối');
    }
  };

  const showDetail = (record) => {
    setSelectedSuggestion(record);
    setDetailModalVisible(true);
  };

  // Lọc suggestions chờ duyệt
  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');

  // Lọc lịch sử
  const historySuggestions = suggestions.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) {
      return false;
    }

    if (dateRange && dateRange[0] && dateRange[1]) {
      const updatedAt = dayjs(s.updated_at || s.created_at);
      if (!updatedAt.isBetween(dateRange[0], dateRange[1], 'day', '[]')) {
        return false;
      }
    }

    return s.status === 'approved' || s.status === 'rejected';
  });

  const columns = [
    {
      title: 'Poster',
      dataIndex: 'poster',
      key: 'poster',
      width: 100,
      render: (poster) => (
        poster ? (
          <Image
            src={poster}
            alt="Poster"
            style={{ width: '60px', height: '90px', objectFit: 'cover', borderRadius: '4px' }}
          />
        ) : (
          <div style={{ width: '60px', height: '90px', background: '#f0f0f0', borderRadius: '4px' }} />
        )
      ),
    },
    {
      title: 'Tên phim',
      dataIndex: 'title',
      key: 'title',
      width: 200,
    },
    {
      title: 'Thể loại',
      dataIndex: 'genre',
      key: 'genre',
      width: 120,
    },
    {
      title: 'Đạo diễn',
      dataIndex: 'director',
      key: 'director',
      width: 150,
    },
    {
      title: 'Thời lượng',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (duration) => `${duration} phút`,
    },
    // THÊM 2 CỘT MỚI
    {
      title: 'Người gửi',
      dataIndex: 'admin_name',
      key: 'admin_name',
      width: 150,
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{name || record.admin_username || 'N/A'}</div>
          <div style={{ fontSize: 12, color: '#888' }}>@{record.admin_username}</div>
        </div>
      ),
    },
    {
      title: 'Rạp',
      dataIndex: 'theater_name',
      key: 'theater_name',
      width: 180,
      render: (theaterName, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{theaterName || 'Chưa được gán'}</div>
          {record.theater_address && (
            <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
              {record.theater_address}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Bản quyền',
      dataIndex: 'license_type',
      key: 'license_type',
      width: 120,
      render: (type) => (
        <Tag color={type === 'permanent' ? 'green' : 'blue'}>
          {type === 'permanent' ? 'Mua đứt' : 'Tạm thời'}
        </Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const statusConfig = {
          pending: { color: 'orange', text: 'Chờ duyệt' },
          approved: { color: 'green', text: 'Đã duyệt' },
          rejected: { color: 'red', text: 'Đã từ chối' },
        };
        const config = statusConfig[status] || statusConfig.pending;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Ngày gửi',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date) => new Date(date).toLocaleDateString('vi-VN'),
    },
  ];

  const pendingColumns = [
    ...columns,
    {
      title: 'Thao tác',
      key: 'action',
      fixed: 'right',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => showDetail(record)}
            size="small"
          >
            Chi tiết
          </Button>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => handleApprove(record.id)}
            size="small"
          >
            Duyệt
          </Button>
          <Button
            danger
            icon={<CloseOutlined />}
            onClick={() => handleReject(record.id)}
            size="small"
          >
            Từ chối
          </Button>
        </Space>
      ),
    },
  ];

 const historyColumns = [
  // ❌ BỎ CỘT POSTER
  {
    title: 'Tên phim',
    dataIndex: 'title',
    key: 'title',
    width: 200,
  },
  {
    title: 'Thể loại',
    dataIndex: 'genre',
    key: 'genre',
    width: 120,
  },
  {
    title: 'Đạo diễn',
    dataIndex: 'director',
    key: 'director',
    width: 150,
  },
  {
    title: 'Thời lượng',
    dataIndex: 'duration',
    key: 'duration',
    width: 100,
    render: (duration) => `${duration} phút`,
  },
  {
    title: 'Người gửi',
    dataIndex: 'admin_name',
    key: 'admin_name',
    width: 150,
    render: (name, record) => (
      <div>
        <div style={{ fontWeight: 500 }}>{name || record.admin_username || 'N/A'}</div>
        <div style={{ fontSize: 12, color: '#888' }}>@{record.admin_username}</div>
      </div>
    ),
  },
  {
    title: 'Rạp',
    dataIndex: 'theater_name',
    key: 'theater_name',
    width: 180,
    render: (theaterName, record) => (
      <div>
        <div style={{ fontWeight: 500 }}>{theaterName || 'Chưa được gán'}</div>
        {record.theater_address && (
          <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
            {record.theater_address}
          </div>
        )}
      </div>
    ),
  },
  {
    title: 'Bản quyền',
    dataIndex: 'license_type',
    key: 'license_type',
    width: 120,
    render: (type) => (
      <Tag color={type === 'permanent' ? 'green' : 'blue'}>
        {type === 'permanent' ? 'Mua đứt' : 'Tạm thời'}
      </Tag>
    ),
  },
  {
    title: 'Trạng thái',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    render: (status) => {
      const statusConfig = {
        pending: { color: 'orange', text: 'Chờ duyệt' },
        approved: { color: 'green', text: 'Đã duyệt' },
        rejected: { color: 'red', text: 'Đã từ chối' },
      };
      const config = statusConfig[status] || statusConfig.pending;
      return <Tag color={config.color}>{config.text}</Tag>;
    },
  },
  {
    title: 'Ngày gửi',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 120,
    render: (date) => new Date(date).toLocaleDateString('vi-VN'),
  },
  {
    title: 'Ngày xét duyệt',
    dataIndex: 'updated_at',
    key: 'updated_at',
    width: 150,
    render: (date) => date ? new Date(date).toLocaleString('vi-VN') : '-',
  },
  {
    title: 'Thao tác',
    key: 'action',
    fixed: 'right',
    width: 120,
    render: (_, record) => (
      <Button
        icon={<EyeOutlined />}
        onClick={() => showDetail(record)}
        size="small"
      >
        Chi tiết
      </Button>
    ),
  },
];

  const tabItems = [
    {
      key: 'pending',
      label: (
        <span>
          Chờ duyệt
          <Tag color="orange" style={{ marginLeft: 8 }}>
            {pendingSuggestions.length}
          </Tag>
        </span>
      ),
      children: (
        <Table
          columns={pendingColumns}
          dataSource={pendingSuggestions}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1500 }}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: 'history',
      label: (
        <span>
          <HistoryOutlined /> Lịch sử xét duyệt
          <Tag color="blue" style={{ marginLeft: 8 }}>
            {historySuggestions.length}
          </Tag>
        </span>
      ),
      children: (
        <>
          <Space style={{ marginBottom: 16 }} wrap>
            <RangePicker
              placeholder={['Từ ngày', 'Đến ngày']}
              onChange={(dates) => setDateRange(dates)}
              format="DD/MM/YYYY"
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 150 }}
            >
              <Option value="all">Tất cả</Option>
              <Option value="approved">Đã duyệt</Option>
              <Option value="rejected">Đã từ chối</Option>
            </Select>
            <Button onClick={() => { setDateRange(null); setStatusFilter('all'); }}>
              Reset bộ lọc
            </Button>
          </Space>
          <Table
            columns={historyColumns}
            dataSource={historySuggestions}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1500 }}
            pagination={{ pageSize: 10 }}
          />
        </>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Card
        title="Quản lý đề xuất phim"
        extra={
          <Button onClick={fetchSuggestions} loading={loading}>
            Làm mới
          </Button>
        }
      >
        <Tabs items={tabItems} />
      </Card>

      {/* Modal phê duyệt */}
      <Modal
        title="Xác nhận phê duyệt"
        open={approveModalVisible}
        onOk={confirmApprove}
        onCancel={() => {
          setApproveModalVisible(false);
          setApproveScope('requester');
        }}
        okText="Phê duyệt"
        cancelText="Hủy"
        width={520}
      >
        <div style={{ marginBottom: 20 }}>
          Bạn có chắc muốn phê duyệt phim này? Phim sẽ được thêm vào hệ thống.
        </div>
        
        <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '8px' }}>
          <div style={{ marginBottom: 12, fontWeight: 500, fontSize: 15 }}>
            Chọn phạm vi áp dụng:
          </div>
          <Radio.Group 
            value={approveScope} 
            onChange={(e) => setApproveScope(e.target.value)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Radio value="requester">
                <div>
                  <div style={{ fontWeight: 500 }}>Chỉ rạp yêu cầu</div>
                  <div style={{ color: '#666', fontSize: 13, marginTop: 4 }}>
                    Phim chỉ hiển thị ở rạp đã gửi yêu cầu này
                  </div>
                </div>
              </Radio>
              <Radio value="all">
                <div>
                  <div style={{ fontWeight: 500 }}>Tất cả các rạp</div>
                  <div style={{ color: '#ff9800', fontSize: 13, marginTop: 4 }}>
                    Phim sẽ hiển thị ở tất cả các rạp trong hệ thống
                  </div>
                </div>
              </Radio>
            </Space>
          </Radio.Group>
        </div>
      </Modal>

      {/* Modal từ chối */}
      <Modal
        title="Xác nhận từ chối"
        open={rejectModalVisible}
        onOk={confirmReject}
        onCancel={() => setRejectModalVisible(false)}
        okText="Từ chối"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        Bạn có chắc muốn từ chối đề xuất này? Poster sẽ bị xóa khỏi server.
      </Modal>

      {/* Modal chi tiết */}
      <Modal
        title="Chi tiết đề xuất phim"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedSuggestion && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              {selectedSuggestion.poster && (
                <Image
                  src={selectedSuggestion.poster}
                  alt={selectedSuggestion.title}
                  style={{ maxWidth: '300px', maxHeight: '400px', borderRadius: '8px' }}
                />
              )}
            </div>

            <Descriptions bordered column={2}>
              <Descriptions.Item label="Tên phim" span={2}>
                <strong>{selectedSuggestion.title}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Thể loại">
                {selectedSuggestion.genre}
              </Descriptions.Item>
              <Descriptions.Item label="Thời lượng">
                {selectedSuggestion.duration} phút
              </Descriptions.Item>
              <Descriptions.Item label="Đạo diễn">
                {selectedSuggestion.director}
              </Descriptions.Item>
              <Descriptions.Item label="Ngôn ngữ">
                {selectedSuggestion.language}
              </Descriptions.Item>
              <Descriptions.Item label="Diễn viên chính" span={2}>
                {selectedSuggestion.main_actors}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày khởi chiếu">
                {new Date(selectedSuggestion.release_date).toLocaleDateString('vi-VN')}
              </Descriptions.Item>
              <Descriptions.Item label="Loại bản quyền">
                <Tag color={selectedSuggestion.license_type === 'permanent' ? 'green' : 'blue'}>
                  {selectedSuggestion.license_type === 'permanent' ? 'Mua đứt' : 'Tạm thời'}
                </Tag>
              </Descriptions.Item>
              {selectedSuggestion.license_start && (
                <Descriptions.Item label="Ngày bắt đầu BQ">
                  {new Date(selectedSuggestion.license_start).toLocaleDateString('vi-VN')}
                </Descriptions.Item>
              )}
              {selectedSuggestion.license_end && (
                <Descriptions.Item label="Ngày kết thúc BQ">
                  {new Date(selectedSuggestion.license_end).toLocaleDateString('vi-VN')}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Mô tả" span={2}>
                {selectedSuggestion.description}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {selectedSuggestion.status === 'pending' && <Tag color="orange">Chờ duyệt</Tag>}
                {selectedSuggestion.status === 'approved' && <Tag color="green">Đã duyệt</Tag>}
                {selectedSuggestion.status === 'rejected' && <Tag color="red">Đã từ chối</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày gửi">
                {new Date(selectedSuggestion.created_at).toLocaleString('vi-VN')}
              </Descriptions.Item>
              {(selectedSuggestion.status === 'approved' || selectedSuggestion.status === 'rejected') && selectedSuggestion.updated_at && (
                <Descriptions.Item label="Ngày xét duyệt">
                  {new Date(selectedSuggestion.updated_at).toLocaleString('vi-VN')}
                </Descriptions.Item>
              )}
            </Descriptions>

            {selectedSuggestion.status === 'pending' && (
              <div style={{ marginTop: '24px', textAlign: 'center' }}>
                <Space size="large">
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    size="large"
                    onClick={() => {
                      setDetailModalVisible(false);
                      handleApprove(selectedSuggestion.id);
                    }}
                  >
                    Phê duyệt
                  </Button>
                  <Button
                    danger
                    icon={<CloseOutlined />}
                    size="large"
                    onClick={() => {
                      setDetailModalVisible(false);
                      handleReject(selectedSuggestion.id);
                    }}
                  >
                    Từ chối
                  </Button>
                </Space>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SuperAdminMovieSuggestions;