'use client';
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faImage,
  faVideo,
  faFileAlt,
  faPaperPlane
} from '@fortawesome/free-solid-svg-icons';
import api from '@/lib/api';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  profile_picture?: string;
}

interface CreatePostBoxProps {
  user: User;
  onPostCreated: (post: Post) => void;
  onError: (error: string) => void;
}

export default function CreatePostBox({ user, onPostCreated, onError }: CreatePostBoxProps) {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) {
      setPreview(null);
      setSelectedFile(null);
      return;
    }
    
    // Check if file is an image
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
    
    setSelectedFile(f);
  }

 const handleSubmit = async () => {
    if (!text.trim()) {
      onError('Please enter some text for your post.');
      return;
    }

    setIsLoading(true);
    onError('');

    try {
      // Create FormData to handle file upload
      const formData = new FormData();
      formData.append('userId', user.id);
      formData.append('title', text.substring(0, 100));
      formData.append('body', text);
      formData.append('status', 'published');
      
      if (selectedFile) {
        formData.append('image', selectedFile);
      }

      const response = await api.post('/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status !== 201) {
        throw new Error(response.data.message || 'Failed to create post');
      }

      const post = response.data.post || response.data;
      console.log('Post created successfully:', post);
      
      // Call the callback to add the new post to the feed
      onPostCreated(post);
      
      // Reset form
      setText('');
      setPreview(null);
      setSelectedFile(null);
      
    } catch (error: any) {
      console.error('Error creating post:', error);
      
      if (error.response?.data?.message) {
        onError(error.response.data.message);
      } else if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const firstError = Object.values(errors)[0] as string[];
        onError(firstError[0] || 'Validation error');
      } else if (error.message) {
        onError(error.message);
      } else {
        onError('Failed to create post. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
      <div className="flex items-start space-x-3">
        <img src="/avatar.png" className="w-12 h-12 rounded-full object-cover" alt="User" />
        <textarea 
          value={text} 
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError('');
          }} 
          className="w-full border border-gray-300 dark:border-gray-700 p-3 rounded-lg resize-none text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
          rows={3} 
          placeholder="Start a post..."
          disabled={isLoading}
        ></textarea>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center mt-3">
        <div className="flex space-x-4 text-sm items-center">
          {/* Photo Upload */}
          <label className={`cursor-pointer text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 relative flex items-center gap-2 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <FontAwesomeIcon icon={faImage} className="w-4 h-4" />
            Photo
            <input 
              type="file" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              accept="image/*" 
              onChange={onFile}
              disabled={isLoading}
            />
          </label>

          {/* Video Upload */}
          <label className={`cursor-pointer text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 relative flex items-center gap-2 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <FontAwesomeIcon icon={faVideo} className="w-4 h-4" />
            Video
            <input 
              type="file" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              accept="video/*" 
              onChange={onFile}
              disabled={isLoading}
            />
          </label>

          {/* Article/File Upload */}
          <label className={`cursor-pointer text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 relative flex items-center gap-2 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <FontAwesomeIcon icon={faFileAlt} className="w-4 h-4" />
            Document
            <input 
              type="file" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              accept=".pdf,.doc,.docx,.txt" 
              onChange={onFile}
              disabled={isLoading}
            />
          </label>
        </div>

        <button 
          onClick={handleSubmit}
          disabled={isLoading || !text.trim()}
          className="bg-blue-600 text-white px-5 py-2 rounded-full text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Posting...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faPaperPlane} className="w-4 h-4" />
              Post
            </>
          )}
        </button>
      </div>

      {preview && (
        <div className="mt-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Selected Image:</p>
          <img src={preview} className="w-40 h-auto rounded-lg border border-gray-300 dark:border-gray-600" alt="Preview" />
        </div>
      )}
    </div>
  );
}