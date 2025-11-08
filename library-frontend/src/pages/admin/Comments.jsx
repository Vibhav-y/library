/*
 * Copyright (c) 2025 Yash Kushwaha
 * Licensed under the MIT License. See LICENSE file for details.
 */

import React, { useEffect, useState } from 'react'
import { comments_data } from '../../assets/assets';
import CommentTableItem from '../../components/admin/CommentTableItem';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';

// Group comments by blog and build thread structure
const groupedComments = (comments = [], filter = 'All') => {
  const map = new Map()
  const commentMap = new Map() // Map to track all comments by ID

  // First pass: Initialize all comments in the map
  comments.forEach(c => {
  if (filter === 'Approved' && !c.isApproved) return
  if (filter === 'Not Approved' && c.isApproved) return
  if (filter === 'Flagged' && !c.isFlagged) return

    commentMap.set(String(c._id), { ...c, children: [] })
  })

  // Second pass: Build reply structure
  const processed = new Set() // Track processed comments to avoid duplicates
  comments.forEach(c => {
    if (filter === 'Approved' && !c.isApproved) return
    if (filter === 'Not Approved' && c.isApproved) return
    if (processed.has(String(c._id))) return

    const comment = commentMap.get(String(c._id))
    if (!comment) return

    if (c.parent) {
      const parentComment = commentMap.get(String(c.parent))
      if (parentComment) {
        parentComment.children.push(comment)
        processed.add(String(c._id))
        return
      }
    }
    
    // Root level comment - add to blog group
    const blog = c.blog || { _id: 'unknown', title: 'Unknown', image: '' }
    const key = (blog && blog._id) || 'unknown'
    if (!map.has(key)) map.set(key, { blog, items: [] })
    map.get(key).items.push(comment)
    processed.add(String(c._id))
  })

  // Sort each blog's comments and their children by date
  const sortByDate = (items) => {
    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    items.forEach(item => {
      if (item.children?.length > 0) {
        sortByDate(item.children)
      }
    })
  }

  const groups = Array.from(map.values())
  groups.forEach(group => sortByDate(group.items))
  
  return groups
}

const Comments = () => {
  const [comments, setComments] = useState([]);
  const [filter, setFilter] = useState('All');

  const {axios} = useAppContext()
  const [selectedIds, setSelectedIds] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 6 // number of blog groups per page
  const [openGroups, setOpenGroups] = useState({})
  const [collapsedThreads, setCollapsedThreads] = useState({})
  const [showFlaggedModal, setShowFlaggedModal] = useState(false)
  const [flaggedModalComment, setFlaggedModalComment] = useState(null)

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      return [...prev, id]
    })
  }

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return
    const confirmDel = window.confirm(`Delete ${selectedIds.length} selected comment(s)?`)
    if (!confirmDel) return
    try {
      const {data} = await axios.post('/api/admin/delete-comments', {ids: selectedIds})
      if (data.success) {
        toast.success(data.message)
        setSelectedIds([])
        fetchComments()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  // Persist open/closed state for groups in localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('admin_comments_open_groups')
      if (raw) setOpenGroups(JSON.parse(raw))
    } catch (e) {
      // ignore parse errors
    }
  }, [])

  const toggleGroupOpen = (blogId) => {
    setOpenGroups(prev => {
      const next = {...prev, [blogId]: !prev[blogId]}
      try { localStorage.setItem('admin_comments_open_groups', JSON.stringify(next)) } catch(e){}
      return next
    })
  }

  const fetchComments = async () => {
    try {
      const {data} = await axios.get('/api/admin/comments')
      data.success ? setComments(data.comments) : toast.error(data.message)
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    fetchComments();
  }, [])
  
  return (
    <div className='flex-1 pt-5 px-5 sm:pt-12 sm:pl-16 bg-blue-50/50'>
      <div className='flex justify-between items-center max-w-3xl'>
        <h1>Comments</h1>
        <div className='flex gap-4'>
          <button onClick={()=> setFilter("All")} className={`shadow-custom-sm border rounded-full px-4 py-1 cursor-pointer text-xs ${filter === 'All' ? 'text-primary' : 'text-gray-700'}`}>All</button>
          <button onClick={()=> setFilter("Approved")} className={`shadow-custom-sm border rounded-full px-4 py-1 cursor-pointer text-xs ${filter === 'Approved' ? 'text-primary' : 'text-gray-700'}`}>Approved</button>
          <button onClick={()=> setFilter("Not Approved")} className={`shadow-custom-sm border rounded-full px-4 py-1 cursor-pointer text-xs ${filter === 'Not Approved' ? 'text-primary' : 'text-gray-700'}`}>Not Approved</button>
          <button onClick={()=> setFilter("Flagged")} className={`shadow-custom-sm border rounded-full px-4 py-1 cursor-pointer text-xs ${filter === 'Flagged' ? 'text-primary' : 'text-gray-700'}`}>Flagged</button>
        </div>
      </div>

      <div className='relative h-4/5 max-w-3xl overflow-x-auto mt-4 bg-white shadow rounded-lg scrollbar-hide p-4'>
        <div className='flex justify-between items-center mb-4'>
          <div>
            <label className='inline-flex items-center gap-2'>
              <input type='checkbox' checked={(() => {
                // all visible selected?
                const groups = groupedComments(comments, filter)
                const start = (currentPage - 1) * pageSize
                const pageGroups = groups.slice(start, start + pageSize)
                const visibleIds = pageGroups.flatMap(g => g.items.map(c => c._id))
                return visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id))
              })()} onChange={(e) => {
                const groups = groupedComments(comments, filter)
                const start = (currentPage - 1) * pageSize
                const pageGroups = groups.slice(start, start + pageSize)
                const visibleIds = pageGroups.flatMap(g => g.items.map(c => c._id))
                if (e.target.checked) {
                  setSelectedIds(prev => Array.from(new Set([...prev, ...visibleIds])))
                } else {
                  setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)))
                }
              }} />
              <span className='text-sm'>Select visible</span>
            </label>
          </div>
          <div>
            <button onClick={deleteSelected} disabled={selectedIds.length === 0} className={`shadow-custom-sm border rounded-full px-4 py-1 cursor-pointer text-xs ${selectedIds.length === 0 ? 'opacity-50 cursor-not-allowed' : 'text-red-600'}`}>Delete selected</button>
          </div>
        </div>

        {/* Group comments by blog and paginate groups */}
        {(() => {
          const groups = groupedComments(comments, filter)
          const totalPages = Math.max(1, Math.ceil(groups.length / pageSize))
          const start = (currentPage - 1) * pageSize
          const pageGroups = groups.slice(start, start + pageSize)

          return (
            <div>
              {pageGroups.map(group => {
                const blogId = (group.blog && group.blog._id) || `unknown-${group.blog.title}`
                const open = openGroups[blogId] !== false // default true
                const groupIds = group.items.map(c => c._id)
                const groupAllSelected = groupIds.length > 0 && groupIds.every(id => selectedIds.includes(id))
                // count flagged comments (including nested)
                const countFlaggedInNode = (node) => {
                  let count = node.isFlagged ? 1 : 0
                  if (node.children && node.children.length) {
                    node.children.forEach(ch => { count += countFlaggedInNode(ch) })
                  }
                  return count
                }
                const flaggedCount = group.items.reduce((acc, it) => acc + countFlaggedInNode(it), 0)
                return (
                  <div key={blogId} className='mb-6 border rounded p-4'>
                    <div className='flex items-center justify-between gap-4'>
                      <div className='flex items-center gap-4'>
                        <button onClick={() => toggleGroupOpen(blogId)} className='w-8 h-8 rounded-full border flex items-center justify-center text-lg select-none'>
                          {open ? '−' : '+'}
                        </button>
                        <img src={group.blog.image} className='w-16 h-16 rounded' alt='' />
                        <div>
                          <div className='font-medium'>{group.blog.title}</div>
                          <div className='text-sm text-gray-500'>{group.items.length} comment(s)</div>
                          {flaggedCount > 0 && (
                            <div className='inline-block mt-1'>
                              <span className='inline-flex items-center gap-2 bg-red-50 text-red-700 text-xs px-2 py-0.5 rounded'>
                                <strong className='text-xs'>{flaggedCount}</strong>
                                <span>flagged</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className='flex items-center gap-4'>
                        <label className='inline-flex items-center gap-2 text-sm'>
                          <input type='checkbox' checked={groupAllSelected} onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds(prev => Array.from(new Set([...prev, ...groupIds])))
                            } else {
                              setSelectedIds(prev => prev.filter(id => !groupIds.includes(id)))
                            }
                          }} />
                          <span>Select group</span>
                        </label>
                      </div>
                    </div>

                    {open && (
                      <div className='mt-4'>
                        <div className='relative'>
                          <table className='w-full text-sm text-gray-500'>
                            <thead className='text-xs text-gray-700 text-left uppercase bg-white sticky top-0'>
                              <tr>
                                <th className='px-2 py-2'>Select</th>
                                <th className='px-6 py-2'>Comment</th>
                                <th className='px-6 py-2'>Actions</th>
                              </tr>
                            </thead>
                            <tbody className='relative'>
                              {/* Recursive render function for comment tree */}
                              {(function renderComments(comments, depth = 0) {
                                return comments.map(comment => (
                                  <React.Fragment key={comment._id}>
                                    <tr className='relative group'>
                                      <td colSpan="3" className='p-0'>
                                        <div className={`relative transition-all duration-200 hover:bg-gray-50`}>
                                          <CommentTableItem 
                                            comment={comment} 
                                            fetchComments={fetchComments} 
                                            selected={selectedIds.includes(comment._id)} 
                                            onToggle={toggleSelect}
                                            depth={depth}
                                            collapsed={collapsedThreads[comment._id]}
                                            onToggleCollapse={(id) => {
                                              setCollapsedThreads(prev => ({
                                                ...prev,
                                                [id]: !prev[id]
                                              }))
                                            }}
                                            onViewFlag={(c) => { setFlaggedModalComment(c); setShowFlaggedModal(true) }}
                                          />
                                        </div>
                                      </td>
                                    </tr>
                                    {comment.children?.length > 0 && !collapsedThreads[comment._id] && (
                                      <tr>
                                        <td colSpan="3" className='p-0'>
                                          <div className='relative'>
                                            {renderComments(comment.children, depth + 1)}
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                ))
                              })(group.items)}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

      
              {/* Flagged comment modal */}
              {showFlaggedModal && flaggedModalComment && (
                <div className='fixed inset-0 z-50 flex items-center justify-center'>
                  <div className='absolute inset-0 bg-black/40' onClick={() => { setShowFlaggedModal(false); setFlaggedModalComment(null) }}></div>
                  <div className='bg-white p-6 rounded shadow-lg z-10 max-w-2xl w-full mx-4'>
                    <div className='flex items-start justify-between gap-4'>
                      <div>
                        <h3 className='text-lg font-semibold mb-1'>Flagged Comment</h3>
                        <div className='text-sm text-gray-500 mb-2'>Comment by: <span className='font-medium'>{flaggedModalComment.displayName || flaggedModalComment.realName || 'Anonymous'}</span></div>
                        <div className='text-sm text-gray-500 mb-2'>On blog: <span className='font-medium'>{(flaggedModalComment.blog && flaggedModalComment.blog.title) || 'Unknown'}</span></div>
                        <div className='mb-4 text-gray-700 whitespace-pre-wrap'>{flaggedModalComment.content}</div>
                        {flaggedModalComment.flagReason && (
                          <div className='mb-4 p-3 bg-red-50 rounded border-l-4 border-red-300'>
                            <div className='text-xs text-red-700 font-medium'>Reported reason</div>
                            <div className='text-sm text-gray-700 mt-1'>{flaggedModalComment.flagReason}</div>
                          </div>
                        )}
                      </div>
                      <div className='flex flex-col items-end gap-2'>
                        <button onClick={() => { setShowFlaggedModal(false); setFlaggedModalComment(null) }} className='px-3 py-1 border rounded'>Close</button>
                        <button onClick={async () => {
                          try {
                            const { data } = await axios.post('/api/admin/unflag-comment', { id: flaggedModalComment._id })
                            if (data.success) {
                              toast.success(data.message)
                              setShowFlaggedModal(false)
                              setFlaggedModalComment(null)
                              fetchComments()
                            } else toast.error(data.message)
                          } catch (err) { toast.error(err.message) }
                        }} className='px-3 py-1 bg-primary text-white rounded'>Unflag</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Pagination controls */}
              <div className='flex justify-center gap-2 mt-4'>
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className='px-3 py-1 border rounded'>Prev</button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button key={i} onClick={() => setCurrentPage(i + 1)} className={`px-3 py-1 border rounded ${currentPage === i + 1 ? 'bg-primary text-white' : ''}`}>{i + 1}</button>
                ))}
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className='px-3 py-1 border rounded'>Next</button>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}

export default Comments
