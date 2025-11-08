import { useEffect, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { assets } from '../assets/assets';
import Navbar from '../components/Navbar'
import Moment from 'moment'
import Footer from '../components/Footer'
import Loader from '../components/Loader'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'
import ChatWidget from '../components/ChatWidget'

const Blog = () => {
  const { id } = useParams()
  const location = useLocation()
  const { axios, user, navigate } = useAppContext()

  const [data, setData] = useState(null)
  const [comments, setComments] = useState([]) // nested tree
  const [content, setContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportComment, setReportComment] = useState(null)
  const [reportReason, setReportReason] = useState('')

  const handleReport = async () => {
    if (!reportReason.trim()) {
      toast.error('Please provide a reason for reporting')
      return
    }
    try {
      const { data } = await axios.post('/api/blog/flag-comment', {
        id: reportComment._id,
        reason: reportReason
      })
      if (data.success) {
        toast.success('Comment reported for review')
        setShowReportModal(false)
        setReportComment(null)
        setReportReason('')
        // Refresh comments to show updated state
        fetchComments()
      } else toast.error(data.message)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const fetchBlogData = async () => {
    try {
      const { data } = await axios.get(`/api/blog/${id}`)
      if (data.success) setData(data.blog)
      else toast.error(data.message)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const fetchComments = async () => {
    try {
      const { data } = await axios.post('/api/blog/comments', { blogId: id })
      if (data.success) setComments(data.comments || [])
      else toast.error(data.message)
    } catch (err) {
      toast.error(err.message)
    }
  }

  useEffect(() => {
    fetchBlogData()
    fetchComments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const submitTopLevel = async (e) => {
    e.preventDefault()
    if (!user) return setShowLoginPrompt(true)
    try {
      const payload = { blog: id, content, isAnonymous }
      const { data } = await axios.post('/api/blog/add-comment', payload)
      if (data.success) {
        toast.success(data.message)
        setContent('')
        setIsAnonymous(false)
        fetchComments()
      } else toast.error(data.message)
    } catch (err) {
      toast.error(err.message)
    }
  }

  // Recursive comment node
  const CommentNode = ({ node, depth = 0 }) => {
    const [showReply, setShowReply] = useState(false)
    const [replyText, setReplyText] = useState('')
    const [replyAnon, setReplyAnon] = useState(false)

    const handleReply = async () => {
      if (!user) return setShowLoginPrompt(true)
      if (!replyText.trim()) return toast.error('Reply cannot be empty')
      try {
        const payload = { blog: id, content: replyText, isAnonymous: replyAnon, parentId: node._id }
        const { data } = await axios.post('/api/blog/add-comment', payload)
        if (data.success) {
          toast.success(data.message)
          setReplyText('')
          setShowReply(false)
          fetchComments()
        } else toast.error(data.message)
      } catch (err) {
        toast.error(err.message)
      }
    }

    const handleReport = async () => {
      try {
        const { data } = await axios.post('/api/blog/flag-comment', { id: reportComment._id, reason: reportReason })
        if (data.success) {
          toast.success('Comment reported for review')
          setShowReportModal(false)
          setReportComment(null)
          setReportReason('')
        } else toast.error(data.message)
      } catch (err) {
        toast.error(err.message)
      }
    }

    return (
      <div className='flex flex-col' style={{ marginLeft: depth * 18 }}>
        <div className='flex gap-4 items-start'>
          <div className='w-12 flex-shrink-0 text-center'>
            <img src={assets.user_icon} className='w-10 h-10 rounded-full border' alt='avatar' />
          </div>

          <div className='flex-1'>
            <div className='bg-white border rounded p-3 shadow-sm'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <p className='font-medium'>{node.displayName || node.name || 'Anonymous'}</p>
                  <span className='text-xs text-gray-400'>{Moment(node.createdAt).fromNow()}</span>
                </div>
                <div className='text-sm text-gray-400 flex items-center gap-3'>
                  <button onClick={() => setShowReply(s => !s)} className='hover:text-primary'>{showReply ? 'Cancel' : 'Reply'}</button>
                  <button onClick={() => { setReportComment(node); setShowReportModal(true); }} className='hover:text-red-500'>Report</button>
                </div>
              </div>

              <p className='text-sm text-gray-700 mt-2 whitespace-pre-wrap'>{node.content}</p>
            </div>

            

            

            {showReply && (
              <div className='mt-3 ml-2 max-w-lg'>
                <textarea value={replyText} onChange={e => setReplyText(e.target.value)} className='w-full p-2 border rounded mb-2' rows={3} />
                <div className='flex items-center gap-3'>
                  <label className='text-sm flex items-center gap-2'><input type='checkbox' checked={replyAnon} onChange={e => setReplyAnon(e.target.checked)} /> Post anonymously</label>
                  <div className='ml-auto'>
                    <button onClick={() => setShowReply(false)} className='px-3 py-1 border rounded mr-2'>Cancel</button>
                    <button onClick={handleReply} className='px-3 py-1 bg-primary text-white rounded'>Reply</button>
                  </div>
                </div>
              </div>
            )}

            {node.children && node.children.length > 0 && (
              <div className='mt-4 border-l-2 border-gray-100 pl-4'>
                {node.children.map(child => <CommentNode key={child._id} node={child} depth={depth + 1} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return data ? (
    <div className='relative'>
      <img className='absolute -top-50 -z-1 opacity-50' src={assets.gradientBackground} alt='' />
      <Navbar />

      <div className='text-center mt-20 text-gray-600'>
        <p className='text-primary py-4 font-medium'>Published on {Moment(data.createdAt).format('MMMM Do YYYY')}</p>
        <h1 className='text-2xl sm:text-5xl font-semibold max-w-2xl mx-auto text-gray-800'>{data.title}</h1>
        <h2 className='my-5 max-w-lg truncate mx-auto'>{data.subTitle}</h2>
      </div>

      <div className='mx-5 max-w-5xl md:mx-auto my-10 mt-6'>
        <img className='rounded-3xl mb-5' src={data.image} alt='' />

        <div className='rich-text max-w-3xl mx-auto' dangerouslySetInnerHTML={{ __html: data.description }}></div>

          {/* Comments */}
        <div className='mt-14 mb-10 max-w-3xl mx-auto'>
          <div className='flex items-center justify-between mb-4'>
            <p className='font-semibold'>Comments <span className='text-sm text-gray-500'>({comments.reduce((acc, c) => acc + 1 + (c.children ? flattenCount(c.children) : 0), 0)})</span></p>
          </div>

          <div className='flex flex-col gap-4'>
            {comments && comments.length === 0 && (
              <div className='text-center py-8'>
                <img src={assets.richTextPlaceholder || assets.gradientBackground} className='mx-auto mb-4 w-40 opacity-60' alt='no comments' />
                <p className='text-lg font-medium'>No comment yet</p>
                <p className='text-sm text-gray-500 mt-2'>Be the first to share your thoughts.</p>
              </div>
            )}
            {comments.map(root => <CommentNode key={root._id} node={root} depth={0} />)}
          </div>

          {showReportModal && reportComment && (
            <div className='fixed inset-0 z-50 flex items-center justify-center'>
              <div className='absolute inset-0 bg-black/40' onClick={() => setShowReportModal(false)}></div>
              <div className='bg-white p-6 rounded shadow-lg z-10 max-w-md w-full'>
                <h3 className='text-lg font-semibold mb-3'>Report Comment</h3>
                <p className='mb-4'>Please provide a reason for reporting this comment:</p>
                <textarea value={reportReason} onChange={e => setReportReason(e.target.value)} className='w-full p-2 border rounded mb-4' rows={3} placeholder='Reason for reporting...' required />
                <div className='flex justify-end gap-2'>
                  <button className='px-4 py-2 border rounded' onClick={() => setShowReportModal(false)}>Cancel</button>
                  <button className='px-4 py-2 bg-red-500 text-white rounded' onClick={handleReport} disabled={!reportReason.trim()}>Report</button>
                </div>

                {/* Chat assistant widget removed from modal — rendered globally for the page */}
              </div>
            </div>
          )}
        </div>

        {/* Add top-level comment */}        {/* Add top-level comment */}
        <div className='max-w-3xl mx-auto'>
          <p className='font-semibold mb-4'>Add your comment</p>
          <form className='flex flex-col items-start gap-4 max-w-lg' onSubmit={submitTopLevel}>
            <textarea onFocus={() => { if (!user) setShowLoginPrompt(true) }} value={content} onChange={e => setContent(e.target.value)} className='w-full p-2 border border-gray-300 rounded outline-none h-48' required placeholder='Comment' />

            <div className='flex items-center gap-2'>
              <input id='anonymous' type='checkbox' checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} />
              <label htmlFor='anonymous' className='text-sm'>Post anonymously</label>
            </div>

            <button className='bg-primary text-white rounded p-2 px-8 hover:scale-102 transition-all cursor-pointer' type='submit'>Submit</button>
          </form>

          {/* Login prompt modal */}
          {showLoginPrompt && (
            <div className='fixed inset-0 z-50 flex items-center justify-center'>
              <div className='absolute inset-0 bg-black/40' onClick={() => setShowLoginPrompt(false)}></div>
              <div className='bg-white p-6 rounded shadow-lg z-10 max-w-sm'>
                <h3 className='text-lg font-semibold mb-3'>Login required</h3>
                <p className='mb-4'>You must be logged in to write a comment.</p>
                <div className='flex justify-end gap-2'>
                  <button className='px-4 py-2 border rounded' onClick={() => setShowLoginPrompt(false)}>Cancel</button>
                  <button className='px-4 py-2 bg-primary text-white rounded' onClick={() => { setShowLoginPrompt(false); navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`) }}>Login</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Share Buttons */}
        <div className='my-24 max-w-3xl mx-auto'>
          <p className='font-semibold my-4'>Share this article on Social Media</p>
          <div className='flex'>
            <img src={assets.facebook_icon} width={50} alt='' />
            <img src={assets.twitter_icon} width={50} alt='' />
            <img src={assets.googleplus_icon_icon} width={50} alt='' />
          </div>
        </div>
      </div>

  <Footer />
  {/* Chat assistant widget (floating) */}
  <ChatWidget blogId={id} blogTitle={data.title} />
    </div>
  ) : <Loader />
}

// Utility to count nested children for display
function flattenCount(children) {
  let c = 0
  for (const ch of children) {
    c += 1
    if (ch.children && ch.children.length) c += flattenCount(ch.children)
  }
  return c
}

export default Blog

