import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Bell } from 'lucide-react';
import noticeAPI from '../services/noticeAPI';

const NoticeDisplay = () => {
  const [notices, setNotices] = useState([]);
  const [dismissedNotices, setDismissedNotices] = useState(new Set());

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    try {
      const data = await noticeAPI.getBannerMarqueeNotices();
      setNotices(data);
    } catch (error) {
      console.error('Failed to load notices:', error);
    }
  };

  const handleDismiss = async (noticeId) => {
    try {
      await noticeAPI.markAsRead(noticeId);
      setDismissedNotices(prev => new Set([...prev, noticeId]));
    } catch (error) {
      console.error('Failed to mark notice as read:', error);
    }
  };

  const visibleNotices = notices.filter(notice => !dismissedNotices.has(notice._id));
  const bannerNotices = visibleNotices.filter(notice => notice.type === 'banner');
  const marqueeNotices = visibleNotices.filter(notice => notice.type === 'marquee');

  if (visibleNotices.length === 0) return null;

  return (
    <div className="relative">
      {/* Banner Notices */}
      {bannerNotices.map((notice) => (
        <div
          key={notice._id}
          className="relative bg-blue-600 text-white"
        >
          <div className="max-w-7xl mx-auto py-2 sm:py-3 px-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center flex-wrap relative">
              <div className="flex items-center justify-center flex-1 text-center pr-8 sm:pr-0">
                <span className="flex p-1.5 sm:p-2 rounded-lg bg-blue-800 mr-2 sm:mr-3 flex-shrink-0">
                  <AlertCircle className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </span>
                <div className="font-medium min-w-0">
                  <span className="block sm:inline font-semibold text-sm sm:text-base">{notice.title}</span>
                  <span className="block sm:inline sm:ml-2 text-sm sm:text-base">{notice.content}</span>
                </div>
              </div>
              <div className="absolute right-3 sm:right-0 top-1/2 transform -translate-y-1/2">
                <button
                  type="button"
                  onClick={() => handleDismiss(notice._id)}
                  className="flex p-1.5 sm:p-2 rounded-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-white"
                >
                  <X className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Marquee Notices */}
      {marqueeNotices.length > 0 && (
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="relative py-1.5 sm:py-2 px-3 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 flex-shrink-0 mr-2 sm:mr-3" />
              <div className="flex-1 overflow-hidden">
                <div className="marquee-container">
                  <div className="marquee-content">
                    {marqueeNotices.map((notice, index) => (
                      <span key={notice._id} className="text-yellow-800 whitespace-nowrap text-sm sm:text-base">
                        <span className="font-semibold">{notice.title}:</span> {notice.content}
                        {index < marqueeNotices.length - 1 && <span className="mx-4 sm:mx-8">•</span>}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Marquee CSS */}
      <style>
        {`
          .marquee-container {
            overflow: hidden;
            white-space: nowrap;
            width: 100%;
          }
          
          .marquee-content {
            display: inline-block;
            animation: marquee 25s linear infinite;
            white-space: nowrap;
            min-width: 100%;
          }
          
          @keyframes marquee {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
          
          .marquee-container:hover .marquee-content {
            animation-play-state: paused;
          }
        `}
      </style>
    </div>
  );
};

export default NoticeDisplay; 