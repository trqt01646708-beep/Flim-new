import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const TheaterContext = createContext();

export const useTheater = () => {
  const context = useContext(TheaterContext);
  if (!context) {
    throw new Error('useTheater must be used within TheaterProvider');
  }
  return context;
};

export const TheaterProvider = ({ children }) => {
  const [selectedTheaterId, setSelectedTheaterId] = useState(null);
  const [selectedTheater, setSelectedTheater] = useState(null);
  const [selectedProvince, setSelectedProvince] = useState(null);

  // Load theater from localStorage on mount
  useEffect(() => {
    const savedTheaterId = localStorage.getItem('selectedTheaterId');
    if (savedTheaterId) {
      const theaterId = parseInt(savedTheaterId);
      setSelectedTheaterId(theaterId);
      
      // Fetch theater details
      axios.get(`http://localhost:5000/api/theaters/${theaterId}`)
        .then(res => {
          setSelectedTheater(res.data);
          setSelectedProvince(res.data.province_id);
        })
        .catch(err => console.error('Lỗi tải theater:', err));
    }
  }, []);

  // Listen for theater changes from other components
  useEffect(() => {
    const handleTheaterChange = () => {
      const savedTheaterId = localStorage.getItem('selectedTheaterId');
      if (savedTheaterId) {
        const theaterId = parseInt(savedTheaterId);
        setSelectedTheaterId(theaterId);
        
        axios.get(`http://localhost:5000/api/theaters/${theaterId}`)
          .then(res => {
            setSelectedTheater(res.data);
            setSelectedProvince(res.data.province_id);
          })
          .catch(err => console.error('Lỗi tải theater:', err));
      } else {
        setSelectedTheaterId(null);
        setSelectedTheater(null);
        setSelectedProvince(null);
      }
    };

    window.addEventListener('theaterChanged', handleTheaterChange);
    return () => window.removeEventListener('theaterChanged', handleTheaterChange);
  }, []);

  const updateTheater = (theaterId, theaterData = null) => {
    setSelectedTheaterId(theaterId);
    setSelectedTheater(theaterData);
    
    if (theaterId) {
      localStorage.setItem('selectedTheaterId', theaterId);
      
      if (theaterData) {
        setSelectedProvince(theaterData.province_id);
      } else {
        // Fetch theater details if not provided
        axios.get(`http://localhost:5000/api/theaters/${theaterId}`)
          .then(res => {
            setSelectedTheater(res.data);
            setSelectedProvince(res.data.province_id);
          })
          .catch(err => console.error('Lỗi tải theater:', err));
      }
    } else {
      localStorage.removeItem('selectedTheaterId');
      setSelectedProvince(null);
    }
    
    window.dispatchEvent(new Event('theaterChanged'));
  };

  const clearTheater = () => {
    setSelectedTheaterId(null);
    setSelectedTheater(null);
    setSelectedProvince(null);
    localStorage.removeItem('selectedTheaterId');
    window.dispatchEvent(new Event('theaterChanged'));
  };

  return (
    <TheaterContext.Provider value={{ 
      selectedTheaterId, 
      selectedTheater,
      selectedProvince,
      updateTheater,
      clearTheater
    }}>
      {children}
    </TheaterContext.Provider>
  );
};

export default TheaterContext;