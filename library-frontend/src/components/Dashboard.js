import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { documentAPI, userAPI, thoughtAPI, libraryAPI } from '../services/api';
import { FileText, Users, FolderOpen, Upload, Calendar, Activity, Star, Lightbulb } from 'lucide-react';
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
  const [thoughtOfTheDay, setThoughtOfTheDay] = useState(null);
  const [libraryInfo, setLibraryInfo] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const promises = [
        userAPI.getDashboard(),
        documentAPI.getAll(),
        thoughtAPI.getTodaysThought()
      ];
      
      // Add favorites count for students
      if (user?.role === 'student') {
        promises.push(documentAPI.getFavoritesCount());
      }
      
      const responses = await Promise.all(promises);
      const dashboardData = responses[0];
      const docsResponse = responses[1];
      const thoughtResponse = responses[2];
      const favoritesResponse = user?.role === 'student' ? responses[3] : null;
      
      setDocuments(docsResponse);
      setThoughtOfTheDay(thoughtResponse);
      // fetch current library contact info (for Contact Us)
      try {
        const lib = await libraryAPI.getCurrent();
        setLibraryInfo(lib);
      } catch {}
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="space-y-6 lg:space-y-8 p-6">
        {/* Welcome Section */}
        <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 overflow-hidden shadow-2xl rounded-2xl transform hover:scale-[1.02] transition-all duration-300">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-2xl blur-xl"></div>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
          </div>
          <div className="relative px-6 py-8 sm:p-10">
            <div className="flex items-start sm:items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/30">
                  {user?.role === 'student' ? (
                    <Lightbulb className="h-6 w-6 sm:h-8 sm:w-8 text-white drop-shadow-md" />
                  ) : (
                    <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-white drop-shadow-md" />
                  )}
                </div>
              </div>
              <div className="ml-4 sm:ml-6 min-w-0 flex-1">
                <h3 className="text-xl sm:text-3xl font-bold text-white drop-shadow-md">
                  Welcome back, {user?.name || user?.email}!
                </h3>
                {user?.role === 'student' ? (
                  <div className="mt-2">
                    <div className="flex items-center mb-2">
                      <span className="text-sm font-medium text-white/70 uppercase tracking-wider">Thought of the Day</span>
                    </div>
                    {thoughtOfTheDay ? (
                      <div className="space-y-1">
                        <p className="text-base sm:text-lg text-white/95 drop-shadow-sm italic">
                          "{thoughtOfTheDay.thought}"
                        </p>
                        {thoughtOfTheDay.author && (
                          <p className="text-sm text-white/80 drop-shadow-sm">
                            — {thoughtOfTheDay.author}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-base sm:text-lg text-white/90 drop-shadow-sm italic">
                        "Every day is a new opportunity to learn something amazing!"
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-base sm:text-lg text-white/90 drop-shadow-sm">
                    You are logged in as <span className="font-semibold capitalize">{user?.role}</span>. Here's what's happening in your library today.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {statCards.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((item, index) => (
              <div 
                key={item.name} 
                className="group relative bg-white/80 backdrop-blur-sm overflow-hidden shadow-xl rounded-2xl border border-white/20 hover:shadow-2xl hover:scale-105 transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent"></div>
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-2xl"></div>
                <div className="relative p-4 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-2xl ${item.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white drop-shadow-sm" />
                      </div>
                    </div>
                    <div className="ml-4 sm:ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm sm:text-base font-semibold text-gray-600 truncate">
                          {item.name}
                        </dt>
                        <dd className="text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
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
        <div className="relative bg-white/70 backdrop-blur-md shadow-2xl rounded-3xl border border-white/30 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/30"></div>
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
          <div className="relative px-6 py-8 sm:p-10">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8 flex items-center">
              <div className="h-2 w-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mr-3"></div>
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {quickActions.map((action, index) => (
                <Link
                  key={action.name}
                  to={action.href}
                  className="group relative bg-white/60 backdrop-blur-sm p-6 sm:p-8 focus-within:ring-4 focus-within:ring-blue-500/20 rounded-2xl border border-white/40 hover:border-white/60 hover:shadow-2xl hover:scale-105 transition-all duration-300 hover:bg-white/80"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent rounded-2xl"></div>
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-2xl"></div>
                  <div className="relative">
                    <div className="mb-4">
                      <span className={`rounded-2xl inline-flex p-4 ${action.color} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <action.icon className="h-6 w-6 sm:h-7 sm:w-7" />
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                        {action.name}
                      </h3>
                      <p className="mt-2 text-sm sm:text-base text-gray-600">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

      {/* Contact Us Card */}
      {libraryInfo && (
        <div className="relative bg-white/70 backdrop-blur-md shadow-2xl rounded-3xl border border-white/30 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/30"></div>
          <div className="relative px-6 py-8 sm:p-10">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8 flex items-center">
              <div className="h-2 w-2 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full mr-3"></div>
              Contact Us
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-600">Library</div>
                <div className="text-lg font-semibold text-gray-900">{libraryInfo.name} <span className="text-gray-500 text-sm">{libraryInfo.handle}</span></div>
              </div>
              {libraryInfo.contact?.email && (
                <div>
                  <div className="text-sm text-gray-600">Email</div>
                  <div className="text-lg font-semibold text-gray-900">{libraryInfo.contact.email}</div>
                </div>
              )}
              {libraryInfo.contact?.phone && (
                <div>
                  <div className="text-sm text-gray-600">Phone</div>
                  <div className="text-lg font-semibold text-gray-900">{libraryInfo.contact.phone}</div>
                </div>
              )}
              {libraryInfo.contact?.website && (
                <div>
                  <div className="text-sm text-gray-600">Website</div>
                  <div>
                    <a href={libraryInfo.contact.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                      {libraryInfo.contact.website}
                    </a>
                  </div>
                </div>
              )}
              {libraryInfo.contact?.address && (
                <div className="sm:col-span-2">
                  <div className="text-sm text-gray-600">Address</div>
                  <div className="text-lg font-semibold text-gray-900">{libraryInfo.contact.address}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

        {/* Recent Documents */}
        <div className="relative bg-white/70 backdrop-blur-md shadow-2xl rounded-3xl border border-white/30 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/30"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/10 to-blue-400/10 rounded-full blur-3xl"></div>
          <div className="relative px-6 py-8 sm:p-10">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8 flex items-center">
              <div className="h-2 w-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mr-3"></div>
              Recent Documents
            </h3>
            {stats.recentDocuments.length > 0 ? (
              <div className="space-y-4">
                {stats.recentDocuments.map((doc, index) => (
                  <div 
                    key={doc._id} 
                    className="group relative bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 p-4 sm:p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/50 to-transparent rounded-2xl"></div>
                    <div className="relative flex items-center space-x-4 sm:space-x-6">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-lg font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors duration-300">
                          {doc.title}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                          {doc.category?.name || 'Uncategorized'}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-xs sm:text-sm text-gray-500 hidden sm:flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg font-medium">
                  No documents available yet.
                </p>
              </div>
            )}
            <div className="mt-8">
              <Link
                to="/documents"
                className="group relative w-full flex justify-center items-center px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative">View all documents</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 