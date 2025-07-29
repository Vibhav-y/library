import React, { useState, useEffect } from 'react';
import { Bell, Calendar, User, CheckCircle, Clock } from 'lucide-react';
import noticeAPI from '../services/noticeAPI';

const Notices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [readNotices, setReadNotices] = useState(new Set());

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    try {
      const data = await noticeAPI.getTabNotices();
      setNotices(data);
      
      // Track which notices are already read
      const alreadyRead = new Set();
      data.forEach(notice => {
        if (notice.readBy && notice.readBy.length > 0) {
          alreadyRead.add(notice._id);
        }
      });
      setReadNotices(alreadyRead);
    } catch (error) {
      setError('Failed to load notices');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (noticeId) => {
    try {
      await noticeAPI.markAsRead(noticeId);
      setReadNotices(prev => new Set([...prev, noticeId]));
    } catch (error) {
      console.error('Failed to mark notice as read:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority) => {
    if (priority >= 8) return 'bg-red-100 text-red-800';
    if (priority >= 5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getPriorityLabel = (priority) => {
    if (priority >= 8) return 'High';
    if (priority >= 5) return 'Medium';
    return 'Low';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Notices</h1>
          <p className="mt-1 sm:mt-2 text-sm text-gray-700">
            Important announcements and updates from the administration.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 sm:mt-8">
        {notices.length > 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {notices.map((notice) => (
                <li key={notice._id} className={`${readNotices.has(notice._id) ? 'bg-gray-50' : 'bg-white'}`}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <div className={`p-1.5 sm:p-2 rounded-full flex-shrink-0 ${readNotices.has(notice._id) ? 'bg-gray-200' : 'bg-blue-100'}`}>
                          {readNotices.has(notice._id) ? (
                            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                          ) : (
                            <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-base sm:text-lg font-medium ${readNotices.has(notice._id) ? 'text-gray-700' : 'text-gray-900'}`}>
                            {notice.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(notice.priority)}`}>
                              {getPriorityLabel(notice.priority)} Priority
                            </span>
                            {!readNotices.has(notice._id) && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <Clock className="h-3 w-3 mr-1" />
                                New
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {!readNotices.has(notice._id) && (
                        <button
                          onClick={() => handleMarkAsRead(notice._id)}
                          className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ml-2 flex-shrink-0"
                        >
                          <span className="hidden sm:inline">Mark as Read</span>
                          <span className="sm:hidden">Read</span>
                        </button>
                      )}
                    </div>
                    
                    <div className="mt-3 sm:mt-4">
                      <p className={`text-sm ${readNotices.has(notice._id) ? 'text-gray-600' : 'text-gray-800'}`}>
                        {notice.content}
                      </p>
                    </div>
                    
                    <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs sm:text-sm text-gray-500">
                      <div className="flex items-center">
                        <User className="flex-shrink-0 mr-1.5 h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="truncate">{notice.createdBy?.name || notice.createdBy?.email || 'Admin'}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="flex-shrink-0 mr-1.5 h-3 w-3 sm:h-4 sm:w-4" />
                        {formatDate(notice.createdAt)}
                      </div>
                      {notice.expiresAt && (
                        <div className="flex items-center">
                          <Clock className="flex-shrink-0 mr-1.5 h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="truncate">Expires: {formatDate(notice.expiresAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-center py-12">
            <Bell className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No notices</h3>
            <p className="mt-1 text-sm text-gray-500">
              There are no notices available at this time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notices; 