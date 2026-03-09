import React, { useState, useEffect } from 'react';

const ImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    loadAllImages();
  }, []);

  const loadAllImages = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/upload/images');
      const data = await response.json();
      setUploadedImages(data.images || []);
    } catch (error) {
      console.error('Lỗi tải danh sách ảnh:', error);
    }
  };

  const handleUpload = async (file) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('http://localhost:5000/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        showMessage(`Upload thành công: ${file.name}`, 'success');
        loadAllImages();
      } else {
        throw new Error(data.error || 'Upload thất bại');
      }
    } catch (error) {
      showMessage(`Upload thất bại: ${error.message}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      showMessage('Đã copy URL vào clipboard!', 'success');
    } catch (error) {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showMessage('Đã copy URL vào clipboard!', 'success');
    }
  };

  const showMessage = (text, type) => {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 4px;
      color: white;
      font-weight: 500;
      z-index: 9999;
      animation: slideIn 0.3s ease;
      ${type === 'success' ? 'background: #52c41a;' : 'background: #ff4d4f;'}
    `;
    messageDiv.textContent = text;
    document.body.appendChild(messageDiv);
    setTimeout(() => messageDiv.remove(), 3000);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleUpload(file);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleUpload(file);
    }
  };

  const styles = {
    container: {
      padding: '24px',
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    },
    card: {
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      padding: '24px'
    },
    title: {
      textAlign: 'center',
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#1890ff',
      marginBottom: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px'
    },
    uploadSection: {
      marginBottom: '24px',
      padding: '16px',
      border: '1px solid #f0f0f0',
      borderRadius: '8px',
      background: '#fafafa'
    },
    dropZone: {
      border: `2px dashed ${dragOver ? '#1890ff' : '#d9d9d9'}`,
      borderRadius: '8px',
      padding: '40px',
      textAlign: 'center',
      background: dragOver ? '#e6f7ff' : 'white',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    uploadIcon: {
      fontSize: '48px',
      color: '#1890ff',
      marginBottom: '16px'
    },
    uploadTitle: {
      fontSize: '18px',
      fontWeight: '500',
      margin: '0 0 8px 0'
    },
    uploadDesc: {
      color: '#666',
      fontSize: '14px'
    },
    button: {
      background: '#1890ff',
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px'
    },
    buttonLarge: {
      padding: '12px 24px',
      fontSize: '16px',
      marginTop: '16px'
    },
    buttonSuccess: {
      background: '#52c41a'
    },
    buttonDisabled: {
      background: '#d9d9d9',
      cursor: 'not-allowed'
    },
    gallery: {
      marginTop: '24px'
    },
    galleryTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      marginBottom: '16px'
    },
    imageGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '16px'
    },
    imageCard: {
      border: '1px solid #f0f0f0',
      borderRadius: '8px',
      overflow: 'hidden',
      background: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      transition: 'transform 0.2s ease'
    },
    imageContainer: {
      height: '200px',
      overflow: 'hidden',
      position: 'relative'
    },
    image: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    },
    imageInfo: {
      padding: '12px'
    },
    filename: {
      fontWeight: '500',
      fontSize: '14px',
      marginBottom: '4px',
      wordBreak: 'break-all'
    },
    filesize: {
      color: '#666',
      fontSize: '12px',
      marginBottom: '8px'
    },
    urlInput: {
      width: '100%',
      padding: '6px',
      border: '1px solid #d9d9d9',
      borderRadius: '4px',
      fontSize: '11px',
      marginBottom: '8px'
    },
    modal: {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modalImage: {
      maxWidth: '90%',
      maxHeight: '90%',
      borderRadius: '8px'
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      color: '#666'
    },
    instructions: {
      marginTop: '24px',
      padding: '16px',
      background: '#f6f8fa',
      borderRadius: '8px',
      border: '1px solid #e1e4e8'
    },
    instructionsTitle: {
      fontSize: '16px',
      fontWeight: 'bold',
      marginBottom: '12px'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>
          📷 Upload Ảnh Poster Phim
        </h1>

        <div style={styles.uploadSection}>
          <h3>Upload Ảnh Mới</h3>
          <div
            style={styles.dropZone}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('fileInput').click()}
          >
            <div style={styles.uploadIcon}>📁</div>
            <h4 style={styles.uploadTitle}>
              Kéo thả ảnh vào đây hoặc click để chọn
            </h4>
            <p style={styles.uploadDesc}>
              Hỗ trợ: JPG, PNG, GIF - Tối đa 5MB
            </p>
          </div>

          <input
            id="fileInput"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />

          <div style={{ textAlign: 'center' }}>
            <button
              style={{
                ...styles.button,
                ...styles.buttonLarge,
                ...(uploading ? styles.buttonDisabled : {})
              }}
              disabled={uploading}
              onClick={() => document.getElementById('fileInput').click()}
            >
              {uploading ? '⏳ Đang upload...' : '📤 Chọn file từ máy tính'}
            </button>
          </div>
        </div>

        <div style={styles.gallery}>
          <h3 style={styles.galleryTitle}>
            Thư viện ảnh đã upload ({uploadedImages.length})
          </h3>

          {uploadedImages.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📷</div>
              <h4>Chưa có ảnh nào được upload</h4>
              <p>Upload ảnh đầu tiên để bắt đầu sử dụng</p>
            </div>
          ) : (
            <div style={styles.imageGrid}>
              {uploadedImages.map((image, index) => (
                <div key={index} style={styles.imageCard}>
                  <div style={styles.imageContainer}>
                    <img
                      src={image.url}
                      alt={image.filename}
                      style={styles.image}
                      onClick={() => setSelectedImage(image.url)}
                    />
                  </div>
                  <div style={styles.imageInfo}>
                    <div style={styles.filename} title={image.filename}>
                      {image.filename}
                    </div>
                    <div style={styles.filesize}>
                      {formatFileSize(image.size)}
                    </div>
                    <input
                      style={styles.urlInput}
                      value={image.url}
                      readOnly
                    />
                    <button
                      style={{ ...styles.button, ...styles.buttonSuccess }}
                      onClick={() => copyToClipboard(image.url)}
                    >
                      📋 Copy URL
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.instructions}>
          <h4 style={styles.instructionsTitle}>Hướng dẫn sử dụng</h4>
          <ol style={{ paddingLeft: '20px', margin: 0 }}>
            <li>Upload ảnh bằng cách kéo thả hoặc click chọn file</li>
            <li>Sau khi upload thành công, copy URL của ảnh</li>
            <li>Paste URL vào trường "poster" trong database</li>
            <li>Ảnh sẽ hiển thị trên website của bạn</li>
          </ol>
        </div>
      </div>

      {selectedImage && (
        <div 
          style={styles.modal}
          onClick={() => setSelectedImage(null)}
        >
          <img 
            src={selectedImage} 
            alt="Preview"
            style={styles.modalImage}
          />
        </div>
      )}

      <style>
        {`
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          
          .image-card:hover {
            transform: translateY(-2px);
          }
          
          @media (max-width: 768px) {
            .image-grid {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    </div>
  );
};

export default ImageUpload;