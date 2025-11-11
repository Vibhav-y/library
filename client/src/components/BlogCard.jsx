import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const BlogCard = ({blog}) => {

  const {title, description, category, image, _id} = blog;
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '100px',
        threshold: 0.1
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  return (
    <div 
      ref={cardRef}
      onClick={()=>navigate(`/blog/${_id}`)} 
      className={`modern-card cursor-pointer ${isVisible ? 'lazy-visible' : 'lazy-hidden'}`}
    >
      {!isVisible ? (
        <div className="space-y-3 p-4">
          <div className="skeleton w-full h-48" />
          <div className="skeleton w-20 h-6 rounded-full" />
          <div className="skeleton w-3/4 h-5" />
          <div className="skeleton w-1/2 h-4" />
        </div>
      ) : (
        <>
          <img 
            className='aspect-video w-full object-cover' 
            src={image} 
            alt={title}
            loading="lazy"
          />
          <div className='p-5'>
            <span className='px-3 py-1.5 inline-block bg-gradient-to-r from-indigo-50 to-violet-50 rounded-full text-indigo-700 text-xs font-semibold border border-indigo-100'>
              {category}
            </span>
            <h5 className='mt-3 mb-2 font-semibold text-gray-900 text-lg'>{title}</h5>
            <p className='mb-3 text-sm text-gray-600 line-clamp-2'>
              {(() => {
                // Strip HTML tags for preview
                const plain = description.replace(/<[^>]+>/g, '')
                const maxLen = 120
                return plain.length > maxLen ? plain.slice(0, maxLen) + '...' : plain
              })()}
            </p>
            <div className='text-xs text-gray-500 mt-2'>
              By <span className='font-semibold text-indigo-700'>{blog.username || blog.author || 'Unknown'}</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default BlogCard
