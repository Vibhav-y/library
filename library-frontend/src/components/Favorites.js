import React, { useState, useEffect } from 'react';
import { documentAPI } from '../services/api';
import { FileText, Search, Eye, Star, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Favorites = () => {
  const [favoriteDocuments, setFavoriteDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [userFavorites, setUserFavorites] = useState(new Set());
  
  const { user } = useAuth();

  useEffect(() => {
    loadFavorites();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [favoriteDocuments, searchTerm]);

  // Disable keyboard shortcuts when viewer is open
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (selectedDocument) {
        // Disable Ctrl+S (Save), Ctrl+P (Print), F12 (DevTools)
        if (e.ctrlKey && (e.key === 's' || e.key === 'p')) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    if (selectedDocument) {
      document.addEventListener('keydown', handleGlobalKeyDown, true);
      // Disable right-click context menu
      document.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown, true);
      document.removeEventListener('contextmenu', (e) => e.preventDefault());
    };
  }, [selectedDocument]);

  const loadFavorites = async () => {
    try {
      const favorites = await documentAPI.getFavorites();
      setFavoriteDocuments(favorites);
      
      // Set user favorites for star display
      const favoriteIds = new Set(favorites.map(doc => doc._id));
      setUserFavorites(favoriteIds);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDocuments = () => {
    if (!searchTerm) {
      setFilteredDocuments(favoriteDocuments);
      return;
    }

    const filtered = favoriteDocuments.filter(doc =>
      doc.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDocuments(filtered);
  };

  const toggleFavorite = async (documentId, event) => {
    event.stopPropagation();
    
    try {
      await documentAPI.removeFromFavorites(documentId);
      
      // Remove from local state
      setFavoriteDocuments(prev => prev.filter(doc => doc._id !== documentId));
      setUserFavorites(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    } catch (error) {
      console.error('Error removing from favorites:', error);
    }
  };

  const handleViewDocument = async (document) => {
    setViewerLoading(true);
    setSelectedDocument(document);
    setViewerLoading(false);
  };

  const closeViewer = () => {
    setSelectedDocument(null);
  };

  const getDocumentUrl = (filePath) => {
    return documentAPI.download(filePath);
  };

  const getFileExtension = (filePath) => {
    // Extract filename from path and get extension
    const filename = filePath.split(/[\\/]/).pop(); // Handle both forward and back slashes
    return filename.split('.').pop().toLowerCase();
  };

  const highlightText = (text, searchTerm) => {
    if (!searchTerm) return text;
    
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === searchTerm.toLowerCase() ? 
        <span key={index} className="bg-yellow-200 font-semibold">{part}</span> : 
        part
    );
  };

  const renderDocumentViewer = () => {
    if (!selectedDocument) return null;

    const fileExtension = getFileExtension(selectedDocument.filePath);
    const documentUrl = getDocumentUrl(selectedDocument.filePath);

    // Disable keyboard shortcuts for print/save
    const handleKeyDown = (e) => {
      if (e.ctrlKey && (e.key === 's' || e.key === 'p')) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
        style={{ outline: 'none' }}
      >
        <div 
          className="bg-white rounded-lg shadow-xl w-full h-full max-w-6xl max-h-full flex flex-col"
          style={{
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            userSelect: 'none'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedDocument.title}
                </h3>
                <p className="text-sm text-gray-500">
                  Uploaded on {new Date(selectedDocument.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button
              onClick={closeViewer}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          {/* Document Content */}
          <div className="flex-1 overflow-hidden">
            {viewerLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="h-full w-full">
                {['pdf'].includes(fileExtension) ? (
                  <iframe
                    src={`${documentUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                    className="w-full h-full border-0"
                    title={selectedDocument.title}
                    style={{ 
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none'
                    }}
                    onLoad={(e) => {
                      // Disable right-click context menu
                      e.target.contentDocument?.addEventListener('contextmenu', (event) => {
                        event.preventDefault();
                      });
                      // Disable keyboard shortcuts
                      e.target.contentDocument?.addEventListener('keydown', (event) => {
                        if (event.ctrlKey && (event.key === 's' || event.key === 'p')) {
                          event.preventDefault();
                        }
                      });
                    }}
                  />
                ) : ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension) ? (
                  <div className="h-full flex items-center justify-center bg-gray-50 overflow-auto">
                    <img
                      src={documentUrl}
                      alt={selectedDocument.title}
                      className="max-w-full max-h-full object-contain"
                      style={{ 
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        MozUserSelect: 'none',
                        msUserSelect: 'none'
                      }}
                      onContextMenu={(e) => e.preventDefault()}
                      draggable={false}
                    />
                  </div>
                ) : ['txt', 'md', 'csv'].includes(fileExtension) ? (
                  <iframe
                    src={documentUrl}
                    className="w-full h-full border-0"
                    title={selectedDocument.title}
                    style={{ 
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none'
                    }}
                    onLoad={(e) => {
                      // Disable right-click context menu
                      e.target.contentDocument?.addEventListener('contextmenu', (event) => {
                        event.preventDefault();
                      });
                      // Disable keyboard shortcuts
                      e.target.contentDocument?.addEventListener('keydown', (event) => {
                        if (event.ctrlKey && (event.key === 's' || event.key === 'p')) {
                          event.preventDefault();
                        }
                      });
                    }}
                  />
                ) : ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileExtension) ? (
                  <iframe
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(documentUrl)}&embedded=true&chrome=false&dov=1`}
                    className="w-full h-full border-0"
                    title={selectedDocument.title}
                    style={{ 
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none'
                    }}
                    onLoad={(e) => {
                      // Disable right-click context menu
                      e.target.contentDocument?.addEventListener('contextmenu', (event) => {
                        event.preventDefault();
                      });
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Preview not available
                      </h3>
                      <p className="text-gray-500">
                        This file type ({fileExtension}) cannot be previewed directly.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center space-x-3">
            <Star className="h-6 w-6 text-yellow-500" />
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                My Favorite Documents
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Your starred documents for quick access. Click the star to remove from favorites.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Search Favorite Documents
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="Search your favorite documents..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-3 sm:px-6">
          <p className="text-sm text-gray-700">
            {searchTerm ? 
              `Found ${filteredDocuments.length} favorite documents matching "${searchTerm}"` : 
              `${filteredDocuments.length} favorite documents`
            }
          </p>
        </div>
      </div>

      {/* Favorites List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {filteredDocuments.length > 0 ? (
          <div className="p-4 space-y-3">
            {filteredDocuments.map((document) => (
              <div 
                key={document._id} 
                className="flex items-center justify-between py-4 px-4 hover:bg-blue-50 rounded-md border border-gray-200 transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <FileText className="h-6 w-6 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-medium text-blue-600 truncate">
                      {highlightText(document.title, searchTerm)}
                    </p>
                    <div className="flex items-center space-x-3 text-sm text-gray-500 mt-1">
                      <span className="flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(document.createdAt).toLocaleDateString()}
                      </span>
                      {document.category && (
                        <>
                          <span>•</span>
                          <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                            {document.category.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={(e) => toggleFavorite(document._id, e)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title="Remove from favorites"
                  >
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  </button>
                  <button
                    onClick={() => handleViewDocument(document)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Document
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Star className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No favorite documents</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm
                ? 'No favorite documents match your search criteria.'
                : 'Start adding documents to your favorites by clicking the star icon in the Documents page.'}
            </p>
          </div>
        )}
      </div>

      {/* Document Viewer Modal */}
      {renderDocumentViewer()}
    </div>
  );
};

export default Favorites; 