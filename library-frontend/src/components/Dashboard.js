import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { documentAPI, userAPI } from '../services/api';
import { FileText, Users, FolderOpen, Upload, Calendar, Activity, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDocuments: 0,
    totalCategories: 0,
    totalUsers: 0,
    recentDocuments: [],
    favoritesCount: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const promises = [
        userAPI.getDashboard(),
        documentAPI.getAll()
      ];
      
      // Add favorites count for students
      if (user?.role === 'student') {
        promises.push(documentAPI.getFavoritesCount());
      }
      
      const responses = await Promise.all(promises);
      const dashboardData = responses[0];
      const docsResponse = responses[1];
      const favoritesResponse = responses[2];
      
      setDocuments(docsResponse);
      setStats({
        totalDocuments: dashboardData.totalDocuments,
        totalCategories: dashboardData.totalCategories,
        totalUsers: dashboardData.totalUsers,
        recentDocuments: docsResponse.slice(0, 5),
        favoritesCount: favoritesResponse ? favoritesResponse.count : 0,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      name: 'View Documents',
      description: 'Browse all available documents',
      href: '/documents',
      icon: FileText,
      color: 'bg-blue-500',
    },
    ...(user?.role === 'student' ? [
      {
        name: 'Favorite Documents',
        description: 'View your starred documents',
        href: '/favorites',
        icon: Star,
        color: 'bg-yellow-500',
      },
    ] : []),
    ...(isAdmin ? [
      {
        name: 'Upload Document',
        description: 'Add new documents to the library',
        href: '/upload',
        icon: Upload,
        color: 'bg-green-500',
      },
      {
        name: 'Manage Students',
        description: 'Add, edit, or remove student accounts',
        href: '/students',
        icon: Users,
        color: 'bg-purple-500',
      },
      {
        name: 'Categories',
        description: 'Organize documents by category',
        href: '/categories',
        icon: FolderOpen,
        color: 'bg-orange-500',
      },
    ] : []),
  ];

  const statCards = [
    ...(isAdmin ? [
      {
        name: 'Total Documents',
        value: stats.totalDocuments,
        icon: FileText,
        color: 'bg-blue-500',
      },
      {
        name: 'Categories',
        value: stats.totalCategories,
        icon: FolderOpen,
        color: 'bg-green-500',
      },
      {
        name: 'Students',
        value: stats.totalUsers,
        icon: Users,
        color: 'bg-purple-500',
      },
      {
        name: 'Recent Activity',
        value: stats.recentDocuments.length,
        icon: Activity,
        color: 'bg-orange-500',
      },
    ] : []),
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Welcome Section */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-4 sm:p-6">
          <div className="flex items-start sm:items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <h3 className="text-base sm:text-lg leading-6 font-medium text-gray-900 truncate">
                Welcome back, {user?.name || user?.email}!
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                You are logged in as {user?.role}. Here's what's happening in your library today.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {statCards.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((item) => (
            <div key={item.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-3 sm:p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`h-6 w-6 sm:h-8 sm:w-8 rounded-md ${item.color} flex items-center justify-center`}>
                      <item.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                  </div>
                  <div className="ml-3 sm:ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                        {item.name}
                      </dt>
                      <dd className="text-sm sm:text-lg font-medium text-gray-900">
                        {item.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-4 sm:p-6">
          <h3 className="text-base sm:text-lg leading-6 font-medium text-gray-900 mb-3 sm:mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                to={action.href}
                className="relative group bg-white p-4 sm:p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200"
              >
                <div>
                  <span className={`rounded-lg inline-flex p-2 sm:p-3 ${action.color} text-white`}>
                    <action.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </span>
                </div>
                <div className="mt-3 sm:mt-4">
                  <h3 className="text-sm sm:text-lg font-medium text-gray-900">
                    {action.name}
                  </h3>
                  <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-500">
                    {action.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Documents */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-4 sm:p-6">
          <h3 className="text-base sm:text-lg leading-6 font-medium text-gray-900 mb-3 sm:mb-4">
            Recent Documents
          </h3>
          {stats.recentDocuments.length > 0 ? (
            <div className="flow-root">
              <ul className="-my-3 sm:-my-5 divide-y divide-gray-200">
                {stats.recentDocuments.map((doc) => (
                  <li key={doc._id} className="py-3 sm:py-4">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                          {doc.title}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {doc.category?.name || 'Uncategorized'}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-xs sm:text-sm text-gray-500 hidden sm:block">
                        <Calendar className="inline h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-6 sm:py-8 text-sm">
              No documents available yet.
            </p>
          )}
          <div className="mt-4 sm:mt-6">
            <Link
              to="/documents"
              className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-150"
            >
              View all documents
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 