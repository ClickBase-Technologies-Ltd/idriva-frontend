'use client';
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faImage,
  faVideo,
  faFileAlt,
  faPaperPlane,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import api from '@/lib/api';
import Image from 'next/image';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  profile_picture?: string;
}

interface CreatePostBoxProps {
  user: User;
  onPostCreated: (post: any) => void;
  onError: (error: string) => void;
}

export default function CreatePostBox({ user, onPostCreated, onError }: CreatePostBoxProps) {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [openModal, setOpenModal] = useState(false);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) {
      setPreview(null);
      setSelectedFile(null);
      return;
    }

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
      const formData = new FormData();
      formData.append('userId', user.id);
      formData.append('title', text.substring(0, 100));
      formData.append('body', text);
      formData.append('status', 'published');

      if (selectedFile) {
        formData.append('image', selectedFile);
      }

      const response = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.status !== 201) {
        throw new Error(response.data.message || 'Failed to create post');
      }

      const post = response.data.post || response.data;
      onPostCreated(post);

      setText('');
      setPreview(null);
      setSelectedFile(null);
      setOpenModal(false);

    } catch (error: any) {
      console.error('Error creating post:', error);
      if (error.response?.data?.message) onError(error.response.data.message);
      else if (error.response?.data?.errors) {
        const firstError = Object.values(error.response.data.errors)[0] as string[];
        onError(firstError[0]);
      } else onError(error.message || 'Failed to create post.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* ================= SMALL LINKEDIN BOX ================= */}
      <div
        onClick={() => setOpenModal(true)}
        className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition"
      >
        <div className="flex items-start space-x-3">

          <Image
            src={
              user?.profile_picture
                ? `${process.env.NEXT_PUBLIC_FILE_URL}/${user.profile_picture}`
                : '/avatar.png'
            }
            alt="User"
            width={48}
            height={48}
            className="w-12 h-12 rounded-full object-cover"
          />

          <div className="flex-1 border border-gray-300 dark:border-gray-700 p-3 rounded-full text-sm text-gray-600 dark:text-gray-300">
            Start a post...
          </div>
        </div>
      </div>

      {/* ================= LINKEDIN MODAL ================= */}
      {openModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">

          <div className="bg-white dark:bg-gray-800 w-full max-w-xl rounded-xl shadow-xl p-5 relative">

            <button
              onClick={() => setOpenModal(false)}
              className="absolute right-4 top-4 text-gray-600 dark:text-gray-300 hover:text-black"
            >
              <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
            </button>

            {/* Header */}
            <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
              Create a post
            </h2>

            {/* User */}
            <div className="flex items-center space-x-3 mb-4">
              <Image
                src={
                  user?.profile_picture
                    ? `${process.env.NEXT_PUBLIC_FILE_URL}/${user.profile_picture}`
                    : '/avatar.png'
                }
                alt="User"
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500">{user.role}</p>
              </div>
            </div>

            {/* Textarea */}
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (error) setError('');
              }}
              className="w-full h-40 border border-gray-300 dark:border-gray-700 p-3 rounded-lg resize-none text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="What do you want to talk about?"
              disabled={isLoading}
            ></textarea>

            {/* Error */}
            {error && (
              <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Preview */}
            {preview && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 dark:text-gray-300 mb-1">Preview:</p>
                <img src={preview} className="w-40 h-auto rounded-lg border" />
              </div>
            )}

            {/* Media Buttons */}
            <div className="flex space-x-5 mt-4 text-sm items-center border-t pt-4 dark:border-gray-700">

              <label className="cursor-pointer flex items-center gap-2 text-[#0A66C2] hover:opacity-80">
                <FontAwesomeIcon icon={faImage} className="w-5 h-5" />
                Photo
                <input type="file" className="hidden" accept="image/*" onChange={onFile} />
              </label>

              <label className="cursor-pointer flex items-center gap-2 text-[#0A66C2] hover:opacity-80">
                <FontAwesomeIcon icon={faVideo} className="w-5 h-5" />
                Video
                <input type="file" className="hidden" accept="video/*" onChange={onFile} />
              </label>

              <label className="cursor-pointer flex items-center gap-2 text-[#0A66C2] hover:opacity-80">
                <FontAwesomeIcon icon={faFileAlt} className="w-5 h-5" />
                Document
                <input type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={onFile} />
              </label>
            </div>

            {/* Post Button */}
            <button
              onClick={handleSubmit}
              disabled={isLoading || !text.trim()}
              className="w-full mt-5 bg-[#0A66C2] text-white py-2 rounded-full text-sm hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {isLoading ? 'Posting...' : 'Post'}
            </button>

          </div>
        </div>
      )}
    </>
  );
}
