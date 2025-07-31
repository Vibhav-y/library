import React, { useState, useEffect } from 'react';
import { documentAPI, categoryAPI } from '../services/api';
import { FileText, Search, ChevronDown, ChevronRight, Folder, FolderOpen, Eye, X, Star, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [categoryTree, setCategoryTree] = useState([]);
  const [categorizedDocuments, setCategorizedDocuments] = useState({});
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [userFavorites, setUserFavorites] = useState(new Set());
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [mobileViewerError, setMobileViewerError] = useState(false);
  
  const { user } = useAuth();

  // Utility function to detect mobile devices
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
  };

  // Utility function to detect Android specifically
  const isAndroidDevice = () => {
    return /Android/i.test(navigator.userAgent);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (categories.length > 0 && documents.length > 0) {
      organizeCategoriesAndDocuments();
    }
  }, [categories, documents, searchTerm]);

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

  const loadData = async () => {
    try {
      const [docsResponse, categoriesResponse] = await Promise.all([
        documentAPI.getAll(),
        categoryAPI.getTree(),
      ]);
      
      setDocuments(docsResponse);
      setCategories(categoriesResponse);
      
      // Load user favorites if student
      if (user?.role === 'student') {
        loadUserFavorites();
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserFavorites = async () => {
    try {
      const favorites = await documentAPI.getFavorites();
      const favoriteIds = new Set(favorites.map(doc => doc._id));
      setUserFavorites(favoriteIds);
    } catch (error) {
      console.error('Error loading user favorites:', error);
    }
  };

  const organizeCategoriesAndDocuments = () => {
    if (!searchTerm) {
      // No search term - show all documents grouped by category
      const docsByCategory = {};
      const uncategorizedDocs = [];

      documents.forEach(doc => {
        if (doc.category && doc.category._id) {
          if (!docsByCategory[doc.category._id]) {
            docsByCategory[doc.category._id] = [];
          }
          docsByCategory[doc.category._id].push(doc);
        } else {
          uncategorizedDocs.push(doc);
        }
      });

      if (uncategorizedDocs.length > 0) {
        docsByCategory['uncategorized'] = uncategorizedDocs;
      }

      setCategorizedDocuments(docsByCategory);
      setCategoryTree(categories);
      return;
    }

    // Search in both documents and categories
    const searchLower = searchTerm.toLowerCase();
    
    // Filter documents by title
    const matchingDocs = documents.filter(doc =>
      doc.title.toLowerCase().includes(searchLower)
    );

    // Filter categories by name (including nested categories)
    const matchingCategoryIds = new Set();
    const checkCategory = (cat) => {
      if (cat.name.toLowerCase().includes(searchLower)) {
        matchingCategoryIds.add(cat._id);
        // Also add parent categories to show hierarchy
        if (cat.parentCategory) {
          matchingCategoryIds.add(cat.parentCategory);
        }
      }
      if (cat.subcategories) {
        cat.subcategories.forEach(checkCategory);
      }
    };
    categories.forEach(checkCategory);

    // Get documents from matching categories
    const docsFromMatchingCategories = documents.filter(doc => 
      doc.category && matchingCategoryIds.has(doc.category._id)
    );

    // Combine matching documents and documents from matching categories
    const allMatchingDocs = [...new Set([...matchingDocs, ...docsFromMatchingCategories])];

    // Group documents by category
    const docsByCategory = {};
    const uncategorizedDocs = [];

    allMatchingDocs.forEach(doc => {
      if (doc.category && doc.category._id) {
        if (!docsByCategory[doc.category._id]) {
          docsByCategory[doc.category._id] = [];
        }
        docsByCategory[doc.category._id].push(doc);
      } else {
        uncategorizedDocs.push(doc);
      }
    });

    // Add uncategorized documents if any match the search
    const matchingUncategorized = documents.filter(doc => 
      !doc.category && doc.title.toLowerCase().includes(searchLower)
    );
    if (matchingUncategorized.length > 0) {
      docsByCategory['uncategorized'] = matchingUncategorized;
    }

    // Filter category tree to only show categories that have matching documents or match the search
    const filterCategoryTree = (cats) => {
      return cats.filter(cat => {
        const hasMatchingDocs = docsByCategory[cat._id] && docsByCategory[cat._id].length > 0;
        const matchesSearch = cat.name.toLowerCase().includes(searchLower);
        const hasMatchingSubcategories = cat.subcategories && filterCategoryTree(cat.subcategories).length > 0;
        
        if (hasMatchingDocs || matchesSearch || hasMatchingSubcategories) {
          // Filter subcategories recursively
          if (cat.subcategories) {
            cat.subcategories = filterCategoryTree(cat.subcategories);
          }
          return true;
        }
        return false;
      });
    };

    const filteredCategoryTree = filterCategoryTree([...categories]);

    setCategorizedDocuments(docsByCategory);
    setCategoryTree(filteredCategoryTree);
  };

  const toggleCategory = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleViewDocument = async (document) => {
    setSelectedDocument(document);
    setViewerLoading(true);
    setMobileViewerError(false); // Reset error state
    
    try {
      // For Supabase, we can use the stored public URL directly
      // But we still get the download URL for consistency and any future URL updates
      const downloadData = await documentAPI.getDownloadUrl(document._id);
      document.downloadUrl = downloadData.downloadUrl;
      setSelectedDocument({...document});
    } catch (error) {
      console.error('Error getting download URL:', error);
      // Fallback to stored URL if API call fails
      document.downloadUrl = document.fileUrl;
      setSelectedDocument({...document});
    } finally {
      setViewerLoading(false);
    }
  };

  const toggleFavorite = async (documentId, event) => {
    event.stopPropagation(); // Prevent triggering parent click events
    
    try {
      if (userFavorites.has(documentId)) {
        await documentAPI.removeFromFavorites(documentId);
        setUserFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(documentId);
          return newSet;
        });
      } else {
        await documentAPI.addToFavorites(documentId);
        setUserFavorites(prev => new Set([...prev, documentId]));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleDeleteDocument = async (documentId, documentTitle, event) => {
    event.stopPropagation(); // Prevent triggering parent click events
    
    if (!window.confirm(`Are you sure you want to delete "${documentTitle}"?\n\nThis action cannot be undone and will remove the document from all users' favorites.`)) {
      return;
    }

    setDeleteLoading(documentId);
    
    try {
      await documentAPI.delete(documentId);
      
      // Update local state to remove the deleted document
      setDocuments(prev => prev.filter(doc => doc._id !== documentId));
      
      // Remove from favorites if it was favorited
      setUserFavorites(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
      
      // Close viewer if the deleted document was being viewed
      if (selectedDocument && selectedDocument._id === documentId) {
        setSelectedDocument(null);
      }
      
    } catch (error) {
      console.error('Error deleting document:', error);
      alert(error.response?.data?.message || 'Failed to delete document. Please try again.');
    } finally {
      setDeleteLoading(null);
    }
  };

  const closeViewer = () => {
    setSelectedDocument(null);
    setMobileViewerError(false); // Reset error state
  };

  // Prevent external navigation on mobile
  useEffect(() => {
    if (selectedDocument && isMobileDevice()) {
      const handleBeforeUnload = (e) => {
        if (isAndroidDevice()) {
          e.preventDefault();
          e.returnValue = '';
          return '';
        }
      };

      const handleClick = (e) => {
        const target = e.target;
        if (target.tagName === 'A' && target.href && target.href.startsWith('http') && !target.href.includes('javascript:')) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('click', handleClick, true);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        document.removeEventListener('click', handleClick, true);
      };
    }
  }, [selectedDocument]);

  const getDocumentUrl = (document) => {
    // For Supabase documents, prefer the download URL from API
    if (document.downloadUrl) {
      return document.downloadUrl;
    }
    // Fallback to stored public URL (Supabase URLs are public)
    if (document.fileUrl) {
      return document.fileUrl;
    }
    // Legacy fallback for old documents
    if (document.filePath) {
      return documentAPI.download(document.filePath);
    }
    return '';
  };

  const getFileExtension = (document) => {
    // Get extension from fileName (for S3 documents) or filePath (for legacy)
    const filename = document.fileName || document.filePath || '';
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const renderDocumentViewer = () => {
    if (!selectedDocument) return null;

    const fileExtension = getFileExtension(selectedDocument);
    const documentUrl = getDocumentUrl(selectedDocument);

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
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
        style={{ outline: 'none' }}
      >
        <div 
          className={`bg-white rounded-lg shadow-xl w-full h-full flex flex-col ${
            isMobileDevice() 
              ? 'max-w-full max-h-full rounded-none sm:rounded-lg sm:max-w-4xl sm:max-h-[95vh]' 
              : 'max-w-6xl max-h-full'
          }`}
          style={{
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            userSelect: 'none'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-lg font-medium text-gray-900 truncate">
                  {selectedDocument.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 truncate">
                  Uploaded on {new Date(selectedDocument.createdAt).toLocaleDateString()}
                  {selectedDocument.fileSize && (
                    <span className="ml-1 sm:ml-2">
                      • {(selectedDocument.fileSize / 1024 / 1024).toFixed(1)} MB
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={closeViewer}
              className="p-2 hover:bg-gray-100 rounded-full flex-shrink-0 ml-2"
              title="Close viewer"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500" />
            </button>
          </div>

          {/* Document Content */}
          <div className="flex-1 overflow-hidden relative pdf-viewer-container">
            {viewerLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <p className="ml-3 text-gray-600">Loading document...</p>
              </div>
            ) : !documentUrl ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Document not available
                  </h3>
                  <p className="text-gray-500">
                    Unable to load document. Please try again later.
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full w-full">
                {['pdf'].includes(fileExtension) ? (
                  isMobileDevice() ? (
                    isAndroidDevice() ? (
                      // Android-specific PDF viewer with fallback
                      <div className="h-full w-full">
                        {!mobileViewerError ? (
                          <iframe
                            src={`https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(documentUrl)}`}
                            className="w-full h-full border-0"
                            title={selectedDocument.title}
                            style={{ 
                              userSelect: 'none',
                              WebkitUserSelect: 'none',
                              MozUserSelect: 'none',
                              msUserSelect: 'none'
                            }}
                            onLoad={(e) => {
                              // Hide PDF.js toolbar on Android
                              setTimeout(() => {
                                try {
                                  const iframe = e.target;
                                  if (iframe.contentDocument) {
                                    const style = iframe.contentDocument.createElement('style');
                                    style.textContent = `
                                      .toolbar { display: none !important; }
                                      .toolbarViewer { display: none !important; }
                                      .secondaryToolbar { display: none !important; }
                                      #outerContainer { padding-top: 0 !important; }
                                      #mainContainer { top: 0 !important; }
                                      #viewerContainer { top: 0 !important; }
                                      .doorHanger { display: none !important; }
                                      .loadingBar { display: none !important; }
                                    `;
                                    iframe.contentDocument.head.appendChild(style);
                                  }
                                } catch (error) {
                                  // Cross-origin restrictions - this is expected
                                }
                              }, 1000);
                            }}
                            onError={() => setMobileViewerError(true)}
                            sandbox="allow-scripts allow-same-origin"
                          />
                        ) : (
                          // Fallback for Android when PDF.js fails
                          <div className="h-full w-full flex flex-col bg-gray-50">
                            <div className="flex-1 flex items-center justify-center p-6">
                              <div className="text-center">
                                <FileText className="mx-auto h-16 w-16 text-blue-600 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                  {selectedDocument.title}
                                </h3>
                                <p className="text-gray-500 mb-4">
                                  PDF document is ready to view
                                </p>
                                <div className="w-full max-w-sm mx-auto bg-white rounded-lg border-2 border-blue-200 p-4">
                                  <div className="text-sm text-gray-600 mb-3">
                                    Document Size: {selectedDocument.fileSize ? 
                                      `${(selectedDocument.fileSize / 1024 / 1024).toFixed(1)} MB` : 
                                      'Unknown'
                                    }
                                  </div>
                                  <button
                                    onClick={() => {
                                      setMobileViewerError(false);
                                      // Try alternative viewing method
                                      setTimeout(() => {
                                        const container = document.querySelector('.pdf-viewer-container');
                                        if (container) {
                                          const fallbackIframe = document.createElement('iframe');
                                          fallbackIframe.src = `${documentUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`;
                                          fallbackIframe.className = 'w-full h-full border-0';
                                          fallbackIframe.style.cssText = `
                                            user-select: none;
                                            -webkit-user-select: none;
                                            -moz-user-select: none;
                                            -ms-user-select: none;
                                          `;
                                          fallbackIframe.onload = () => {
                                            try {
                                              fallbackIframe.contentDocument?.addEventListener('contextmenu', (e) => e.preventDefault());
                                            } catch (e) {
                                              // Cross-origin restrictions
                                            }
                                          };
                                          container.innerHTML = '';
                                          container.appendChild(fallbackIframe);
                                        }
                                      }, 100);
                                    }}
                                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                                  >
                                    Load PDF Viewer
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      // iOS and other mobile devices - use direct embedding
                      <div className="h-full w-full bg-gray-100 overflow-auto">
                        <object
                          data={`${documentUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                          type="application/pdf"
                          className="w-full h-full"
                          style={{ 
                            minHeight: '100%',
                            userSelect: 'none',
                            WebkitUserSelect: 'none',
                            MozUserSelect: 'none',
                            msUserSelect: 'none'
                          }}
                        >
                          <embed
                            src={`${documentUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                            type="application/pdf"
                            className="w-full h-full"
                            style={{ 
                              minHeight: '100%',
                              userSelect: 'none',
                              WebkitUserSelect: 'none',
                              MozUserSelect: 'none',
                              msUserSelect: 'none'
                            }}
                          />
                          {/* Fallback iframe for iOS */}
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
                          />
                        </object>
                      </div>
                    )
                  ) : (
                    // Desktop PDF viewer
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
                  )
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
                        This file type ({fileExtension}) cannot be previewed in the browser.
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

  const highlightText = (text, searchTerm) => {
    if (!searchTerm) return text;
    
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === searchTerm.toLowerCase() ? 
        <span key={index} className="bg-yellow-200 font-semibold">{part}</span> : 
        part
    );
  };

  const renderCategory = (category, level = 0) => {
    const isExpanded = expandedCategories.has(category._id);
    const hasDocuments = categorizedDocuments[category._id] && categorizedDocuments[category._id].length > 0;
    const hasSubcategories = category.subcategories && category.subcategories.length > 0;
    const hasContent = hasDocuments || hasSubcategories;
    const matchesSearch = searchTerm && category.name.toLowerCase().includes(searchTerm.toLowerCase());

    return (
      <div key={category._id} className="border-l-2 border-gray-200">
        <div 
          className={`flex items-center py-2 px-3 sm:px-4 hover:bg-gray-50 cursor-pointer ${
            matchesSearch ? 'bg-yellow-50' : 
            level === 0 ? 'bg-gray-100' : level === 1 ? 'bg-gray-50' : 'bg-white'
          }`}
          style={{ paddingLeft: `${12 + level * 16}px` }}
          onClick={() => hasContent && toggleCategory(category._id)}
        >
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {hasContent ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500 flex-shrink-0" />
              )
            ) : (
              <div className="w-4 h-4 flex-shrink-0" />
            )}
            
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0" />
            ) : (
              <Folder className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 flex-shrink-0" />
            )}
            
            <span className={`font-medium text-sm sm:text-base truncate ${
              level === 0 ? 'text-gray-900' : level === 1 ? 'text-gray-800' : 'text-gray-700'
            }`}>
              {highlightText(category.name, searchTerm)}
            </span>
          </div>
          
          {hasDocuments && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0">
              {categorizedDocuments[category._id].length}
            </span>
          )}
        </div>

        {isExpanded && hasContent && (
          <div className="ml-4">
            {/* Render documents for this category */}
            {hasDocuments && (
              <div className="space-y-1 mb-2">
                {categorizedDocuments[category._id].map((document) => (
                  <div 
                    key={document._id} 
                    className="flex items-center justify-between py-2 px-3 sm:px-4 hover:bg-blue-50 rounded-md mx-1 sm:mx-2"
                    style={{ paddingLeft: `${12 + (level + 1) * 16}px` }}
                  >
                    <div 
                      className={`flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0 ${
                        user?.role === 'student' ? 'cursor-pointer hover:bg-blue-100 rounded-md p-1 -m-1 transition-colors' : ''
                      }`}
                      onClick={user?.role === 'student' ? () => handleViewDocument(document) : undefined}
                      title={user?.role === 'student' ? 'Click to view document' : ''}
                    >
                      <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs sm:text-sm font-medium truncate ${
                          user?.role === 'student' ? 'text-blue-700 hover:text-blue-800' : 'text-blue-600'
                        }`}>
                          {highlightText(document.title, searchTerm)}
                        </p>
                        <p className="text-xs text-gray-500 hidden sm:block">
                          {new Date(document.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                      {user?.role === 'student' && (
                        <button
                          onClick={(e) => toggleFavorite(document._id, e)}
                          className="p-1 hover:bg-gray-100 rounded-full"
                          title={userFavorites.has(document._id) ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <Star 
                            className={`h-3 w-3 sm:h-4 sm:w-4 ${
                              userFavorites.has(document._id) 
                                ? 'text-yellow-500 fill-yellow-500' 
                                : 'text-gray-400 hover:text-yellow-500'
                            }`}
                          />
                        </button>
                      )}
                      {(user?.role === 'admin' || user?.role === 'superadmin') && (
                        <>
                          <button
                            onClick={() => handleViewDocument(document)}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">View</span>
                          </button>
                          <button
                            onClick={(e) => handleDeleteDocument(document._id, document.title, e)}
                            disabled={deleteLoading === document._id}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete document"
                          >
                            {deleteLoading === document._id ? (
                              <div className="h-3 w-3 animate-spin rounded-full border border-red-700 border-t-transparent mr-1"></div>
                            ) : (
                              <Trash2 className="h-3 w-3 mr-1" />
                            )}
                            <span className="hidden sm:inline">
                              {deleteLoading === document._id ? 'Deleting...' : 'Delete'}
                            </span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Render subcategories */}
            {hasSubcategories && (
              <div>
                {category.subcategories.map(subcategory => 
                  renderCategory(subcategory, level + 1)
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };



  const renderUncategorizedDocuments = () => {
    const uncategorizedDocs = categorizedDocuments['uncategorized'];
    if (!uncategorizedDocs || uncategorizedDocs.length === 0) return null;

    const isExpanded = expandedCategories.has('uncategorized');

    return (
      <div className="border-l-2 border-gray-200">
        <div 
          className="flex items-center py-2 px-3 sm:px-4 hover:bg-gray-50 cursor-pointer bg-gray-100"
          onClick={() => toggleCategory('uncategorized')}
        >
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500 flex-shrink-0" />
            )}
            
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 flex-shrink-0" />
            ) : (
              <Folder className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 flex-shrink-0" />
            )}
            
            <span className="font-medium text-sm sm:text-base text-gray-900 truncate">
              Uncategorized
            </span>
          </div>
          
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 flex-shrink-0">
            {uncategorizedDocs.length}
          </span>
        </div>

        {isExpanded && (
          <div className="ml-4 space-y-1 mb-2">
            {uncategorizedDocs.map((document) => (
              <div 
                key={document._id} 
                className="flex items-center justify-between py-2 px-3 sm:px-4 hover:bg-blue-50 rounded-md mx-1 sm:mx-2"
                style={{ paddingLeft: '32px' }}
              >
                <div 
                  className={`flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0 ${
                    user?.role === 'student' ? 'cursor-pointer hover:bg-blue-100 rounded-md p-1 -m-1 transition-colors' : ''
                  }`}
                  onClick={user?.role === 'student' ? () => handleViewDocument(document) : undefined}
                  title={user?.role === 'student' ? 'Click to view document' : ''}
                >
                  <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs sm:text-sm font-medium truncate ${
                      user?.role === 'student' ? 'text-blue-700 hover:text-blue-800' : 'text-blue-600'
                    }`}>
                      {highlightText(document.title, searchTerm)}
                    </p>
                    <p className="text-xs text-gray-500 hidden sm:block">
                      {new Date(document.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                  {user?.role === 'student' && (
                    <button
                      onClick={(e) => toggleFavorite(document._id, e)}
                      className="p-1 hover:bg-gray-100 rounded-full"
                      title={userFavorites.has(document._id) ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star 
                        className={`h-3 w-3 sm:h-4 sm:w-4 ${
                          userFavorites.has(document._id) 
                            ? 'text-yellow-500 fill-yellow-500' 
                            : 'text-gray-400 hover:text-yellow-500'
                        }`}
                      />
                    </button>
                  )}
                  {(user?.role === 'admin' || user?.role === 'superadmin') && (
                    <>
                      <button
                        onClick={() => handleViewDocument(document)}
                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">View</span>
                      </button>
                      <button
                        onClick={(e) => handleDeleteDocument(document._id, document.title, e)}
                        disabled={deleteLoading === document._id}
                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete document"
                      >
                        {deleteLoading === document._id ? (
                          <div className="h-3 w-3 animate-spin rounded-full border border-red-700 border-t-transparent mr-1"></div>
                        ) : (
                          <Trash2 className="h-3 w-3 mr-1" />
                        )}
                        <span className="hidden sm:inline">
                          {deleteLoading === document._id ? 'Deleting...' : 'Delete'}
                        </span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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

  const getTotalMatchingDocuments = () => {
    if (!searchTerm) return documents.length;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Documents matching by title
    const matchingDocs = documents.filter(doc =>
      doc.title.toLowerCase().includes(searchLower)
    );

    // Documents from matching categories
    const matchingCategoryIds = new Set();
    const checkCategory = (cat) => {
      if (cat.name.toLowerCase().includes(searchLower)) {
        matchingCategoryIds.add(cat._id);
      }
      if (cat.subcategories) {
        cat.subcategories.forEach(checkCategory);
      }
    };
    categories.forEach(checkCategory);

    const docsFromMatchingCategories = documents.filter(doc => 
      doc.category && matchingCategoryIds.has(doc.category._id)
    );

    // Combine and deduplicate
    const allMatchingDocs = [...new Set([...matchingDocs, ...docsFromMatchingCategories])];
    return allMatchingDocs.length;
  };

  const totalDocuments = getTotalMatchingDocuments();

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      {/* <div className="relative bg-white/70 backdrop-blur-md shadow-2xl rounded-3xl border border-white/30 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/60"></div>
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
        <div className="relative px-6 py-8 sm:p-10">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg mr-4">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Document Library
              </h3>
              <p className="mt-2 text-base sm:text-lg text-gray-600">
                Browse and view documents organized by categories. Click on categories to expand and view documents.
              </p>
            </div>
          </div>
        </div>
      </div> */}

      {/* Search Bar */}
      <div className="relative bg-white/70 backdrop-blur-md shadow-xl rounded-2xl border border-white/30 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-white/80 to-white/60 rounded-2xl"></div>
        <div className="relative px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search documents and categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-4 py-3 text-sm border-0 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-300 placeholder:text-gray-400"
              />
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/60 rounded-lg transition-all duration-200"
                title="Clear search"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="relative bg-white/60 backdrop-blur-sm shadow-lg rounded-2xl border border-white/30">
        <div className="absolute inset-0 bg-gradient-to-r from-white/70 to-white/50 rounded-2xl"></div>
        <div className="relative px-6 py-4 sm:px-8 sm:py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center">
            <div className="h-3 w-3 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mr-3"></div>
            <p className="text-base font-semibold text-gray-700">
              {searchTerm ? 
                `Found ${totalDocuments} documents matching "${searchTerm}"` : 
                `${totalDocuments} documents available`
              }
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setExpandedCategories(new Set())}
              className="text-sm font-medium text-gray-600 hover:text-blue-600 px-4 py-2 rounded-xl hover:bg-white/60 transition-all duration-200"
            >
              Collapse All
            </button>
            <button
              onClick={() => {
                const allIds = new Set();
                const addIds = (cats) => {
                  cats.forEach(cat => {
                    if (categorizedDocuments[cat._id] || cat.subcategories?.length > 0) {
                      allIds.add(cat._id);
                    }
                    if (cat.subcategories) {
                      addIds(cat.subcategories);
                    }
                  });
                };
                addIds(categoryTree);
                if (categorizedDocuments['uncategorized']) {
                  allIds.add('uncategorized');
                }
                setExpandedCategories(allIds);
              }}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 px-4 py-2 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all duration-200"
            >
              Expand All
            </button>
          </div>
        </div>
      </div>

      {/* Category Tree */}
      <div className="relative bg-white/70 backdrop-blur-md shadow-2xl overflow-hidden rounded-3xl border border-white/30">
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/60"></div>
        {categoryTree.length > 0 || categorizedDocuments['uncategorized'] ? (
          <div className="relative divide-y divide-white/40">
            {categoryTree.map(category => renderCategory(category))}
            {renderUncategorizedDocuments()}
          </div>
        ) : (
          <div className="relative text-center py-16">
            <div className="h-20 w-20 mx-auto rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-6 shadow-lg">
              <FileText className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No documents found</h3>
            <p className="text-base text-gray-600 max-w-md mx-auto">
              {searchTerm
                ? 'Try adjusting your search criteria to find what you\'re looking for.'
                : 'No documents have been uploaded yet. Check back later or contact your administrator.'}
            </p>
          </div>
        )}
      </div>

      {/* Document Viewer Modal */}
      {renderDocumentViewer()}
    </div>
  );
};

export default Documents; 