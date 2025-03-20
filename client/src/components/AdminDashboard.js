import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [responses, setResponses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  // Add sorting state
  const [sortField, setSortField] = useState('startTime');
  const [sortDirection, setSortDirection] = useState('desc');
  const history = useHistory();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      history.push('/admin/login');
      return;
    }

    const fetchData = async () => {
      try {
        const config = {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        };

        const [responsesRes, statsRes] = await Promise.all([
          axios.get('/api/admin/responses', config),
          axios.get('/api/admin/stats', config)
        ]);

        setResponses(responsesRes.data);
        setStats(statsRes.data);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('adminToken');
          history.push('/admin/login');
        } else {
          setError('Error fetching data. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [history]);

  // Sort responses function
  const getSortedResponses = () => {
    if (!responses || responses.length === 0) return [];
    
    return [...responses].sort((a, b) => {
      let comparison = 0;
      
      switch(sortField) {
        case 'id':
          comparison = a.id.localeCompare(b.id);
          break;
        case 'startTime':
          comparison = new Date(a.startTime) - new Date(b.startTime);
          break;
        case 'answersCount':
          comparison = a.answersCount - b.answersCount;
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  // Handle sort click
  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setUploadError('');
    setUploadSuccess('');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setUploadError('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('adminToken');
      
      await axios.post('/api/admin/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      setUploadSuccess('Survey file uploaded successfully');
      setFile(null);
      document.getElementById('survey-file').value = '';
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Error uploading file');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    history.push('/admin/login');
  };

  const downloadResponse = async (id) => {
    try {
      const token = localStorage.getItem('adminToken');
      
      // Create a direct link with the token in the header
      const link = document.createElement('a');
      link.href = `/api/admin/responses/${id}`;
      link.download = `response-${id}.json`;
      
      // Create a click event
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
      });
      
      // Fetch the file with proper authorization
      const response = await fetch(`/api/admin/responses/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      link.href = url;
      link.dispatchEvent(clickEvent);
      
      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error('Download error:', err);
      alert('Error downloading response');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>Survey Admin Dashboard</h1>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </header>

      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-content">
        <section className="dashboard-section stats-section">
          <h2>Statistics</h2>
          {stats && (
            <div className="stats-container">
              <div className="stat-card">
                <div className="stat-value">{stats.totalResponses}</div>
                <div className="stat-label">Total Responses</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.totalAnswers}</div>
                <div className="stat-label">Total Answers</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.averageAnswersPerResponse.toFixed(2)}</div>
                <div className="stat-label">Avg. Answers Per Response</div>
              </div>
            </div>
          )}
        </section>

        <section className="dashboard-section upload-section">
          <h2>Upload Survey</h2>
          <form onSubmit={handleUpload} className="upload-form">
            <div className="file-input-container">
              <label htmlFor="survey-file">XML Survey File</label>
              <div className="file-input-wrapper">
                <input
                  type="file"
                  id="survey-file"
                  accept=".xml"
                  onChange={handleFileChange}
                  className="file-input"
                />
                <span className="file-name">{file ? file.name : 'No file selected'}</span>
              </div>
            </div>
            
            {uploadError && <div className="error-message">{uploadError}</div>}
            {uploadSuccess && <div className="success-message">{uploadSuccess}</div>}
            
            <button type="submit" className="upload-button">
              Upload
            </button>
          </form>
        </section>

        <section className="dashboard-section responses-section">
          <h2>Survey Responses</h2>
          {responses.length === 0 ? (
            <p className="no-data-message">No responses yet.</p>
          ) : (
            <div className="table-container">
              <table className="responses-table">
                <thead>
                  <tr>
                    <th 
                      className="sortable-header" 
                      onClick={() => handleSort('id')}
                    >
                      ID {sortField === 'id' && (
                        <span className="sort-indicator">
                          {sortDirection === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </th>
                    <th 
                      className="sortable-header"
                      onClick={() => handleSort('startTime')}
                    >
                      Date {sortField === 'startTime' && (
                        <span className="sort-indicator">
                          {sortDirection === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </th>
                    <th 
                      className="sortable-header"
                      onClick={() => handleSort('answersCount')}
                    >
                      Answers {sortField === 'answersCount' && (
                        <span className="sort-indicator">
                          {sortDirection === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedResponses().map(response => (
                    <tr key={response.id}>
                      <td className="id-cell" title={response.id}>
                        {response.id}
                      </td>
                      <td>{formatDate(response.startTime)}</td>
                      <td className="answers-cell">{response.answersCount}</td>
                      <td>
                        <button 
                          onClick={() => downloadResponse(response.id)}
                          className="download-button"
                          title="Download response data"
                        >
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;