
import React from 'react'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'
import { FaReply, FaAngleDown, FaAngleRight, FaUserSecret } from 'react-icons/fa'

// Clean, single-responsibility comment row used in admin comments list.
const CommentTableItem = ({ comment, fetchComments, selected, onToggle, depth = 0, collapsed = false, onToggleCollapse, onViewFlag }) => {
  const { axios } = useAppContext()

  const toggleApproval = async () => {
    try {
      const { data } = await axios.post(`/api/admin/toggle-comment-approval/${comment._id}`)
      if (data.success) {
        toast.success(data.message)
        fetchComments()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const deleteComment = async () => {
    const confirmDel = window.confirm('Delete this comment?')
    if (!confirmDel) return
    try {
      const { data } = await axios.post('/api/admin/delete-comments', { ids: [comment._id] })
      if (data.success) {
        toast.success(data.message)
        fetchComments()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const unflagComment = async () => {
    try {
      const { data } = await axios.post('/api/admin/unflag-comment', { id: comment._id })
      if (data.success) {
        toast.success(data.message)
        fetchComments()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const hasChildren = comment.children?.length > 0

  return (
    <div className='relative flex items-start gap-2 p-2' style={{ marginLeft: `${depth * 32}px` }}>
      {/* Vertical and horizontal thread lines for visual nesting */}
      {depth > 0 && <div className='absolute left-0 top-0 bottom-0 w-px bg-gray-200 -ml-4' />}
      {depth > 0 && <div className='absolute left-0 top-1/2 w-4 h-px bg-gray-200 -ml-4' />}

      <div className='w-6 flex-shrink-0'>
        <input type='checkbox' checked={!!selected} onChange={() => onToggle(comment._id)} />
      </div>

      <div className='flex-grow'>
        <div className='flex items-start gap-3'>
          <div className='flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400'>
            {(!comment.realName && !comment.displayName) ? <FaUserSecret /> : (comment.realName || comment.displayName || 'A')[0]}
          </div>

          <div className='flex-grow'>
            <div className='flex items-center gap-2'>
              <div className='text-gray-900 font-medium'>
                {comment.displayName || comment.realName || 'Anonymous'}
              </div>

              {hasChildren && (
                <button onClick={() => onToggleCollapse(comment._id)} className='p-1 text-gray-500 hover:text-gray-700'>
                  {collapsed ? <FaAngleRight /> : <FaAngleDown />} <span className='text-xs ml-1'>{comment.children.length}</span>
                </button>
              )}
            </div>

            {comment.parent && (
              <div className='text-xs text-gray-500 mb-1 flex items-center gap-1'>
                <FaReply className='rotate-180' />
                <span>Reply to {comment.parentDisplayName || comment.parentName || 'Anonymous'}</span>
                {comment.parentContent && <span className='opacity-75'>- "{comment.parentContent}"</span>}
              </div>
            )}

            <div className='text-gray-700 whitespace-pre-wrap'>{comment.content}</div>

            <div className='mt-2 flex items-center gap-4 text-sm'>
              <button onClick={toggleApproval} className={`${comment.isApproved ? 'text-green-600' : 'text-yellow-600'}`}>
                {comment.isApproved ? 'Approved' : 'Not Approved'}
              </button>
              <button onClick={deleteComment} className='text-red-600'>Delete</button>
              {comment.isFlagged && (
                <div className='flex items-center gap-2'>
                  <span className='text-sm text-red-600 font-medium'>Flagged</span>
                  {comment.flagReason && <span className='text-xs text-gray-500'>- {comment.flagReason}</span>}
                  <button onClick={() => onViewFlag && onViewFlag(comment)} className='text-xs ml-2 px-2 py-1 border rounded text-gray-700'>View</button>
                  <button onClick={unflagComment} className='text-xs ml-2 px-2 py-1 border rounded text-gray-700'>Unflag</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CommentTableItem