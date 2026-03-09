import React, { useState } from 'react';
import { Upload, Button, message, Image } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';

const MoviePosterUpload = ({ movieId, currentPoster, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handleUpload = async (file) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('poster', file);

    try {
      const response = await fetch(
        `http://localhost:5000/api/upload/movies/${movieId}/poster`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();
      
      if (response.ok) {
        message.success('Upload poster thành công!');
        if (onSuccess) {
          onSuccess(data.poster);
        }
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Lỗi upload:', error);
      message.error('Upload thất bại: ' + error.message);
    } finally {
      setLoading(false);
    }

    return false;
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/upload/movies/${movieId}/poster`,
        { method: 'DELETE' }
      );
      
      if (response.ok) {
        message.success('Đã xóa poster thành công!');
        if (onSuccess) {
          onSuccess(null);
        }
      }
    } catch (error) {
      message.error('Lỗi khi xóa poster');
    }
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `http://localhost:5000${path}`;
  };

  return (
    <div style={{ textAlign: 'center' }}>
      {currentPoster ? (
        <div>
          <Image
            width={200}
            height={280}
            style={{ objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }}
            src={getImageUrl(currentPoster)}
          />
          <div>
            <Button
              icon={<DeleteOutlined />}
              danger
              onClick={handleDelete}
              style={{ marginTop: '10px', marginRight: '10px' }}
            >
              Xóa poster
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ 
          border: '2px dashed #d9d9d9', 
          borderRadius: '8px', 
          padding: '40px', 
          width: '200px', 
          height: '280px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 10px'
        }}>
          <p style={{ color: '#999' }}>Chưa có poster</p>
        </div>
      )}

      <Upload
        beforeUpload={handleUpload}
        showUploadList={false}
        accept="image/*"
        disabled={loading}
      >
        <Button
          type="primary"
          icon={<UploadOutlined />}
          loading={loading}
          style={{ marginTop: '10px' }}
        >
          {currentPoster ? 'Thay đổi poster' : 'Upload poster'}
        </Button>
      </Upload>

      <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
        Chỉ chấp nhận file ảnh (JPG, PNG, GIF) - Tối đa 5MB
      </p>
    </div>
  );
};

export default MoviePosterUpload;