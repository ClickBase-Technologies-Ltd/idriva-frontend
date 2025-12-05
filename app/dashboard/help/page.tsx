// app/dashboard/help/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faQuestionCircle, 
  faBook, 
  faUserCircle, 
  faCog,
  faBriefcase,
  faGraduationCap,
  faUsers,
  faEnvelope,
  faPhone,
  faMessage,
  faChevronDown,
  faChevronUp,
  faExternalLinkAlt,
  faSpinner,
  faCheck,
  faTimes,
  faPaperPlane
} from '@fortawesome/free-solid-svg-icons';
import Sidebar from '@/components/Sidebar';
import HeaderLoggedIn from '@/components/HeaderLoggedIn';
import RightbarRecruiters from "@/components/Rightbar";
import api from '@/lib/api';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: 'general' | 'account' | 'jobs' | 'learning' | 'community' | 'technical';
  views: number;
  helpful: number;
  not_helpful: number;
}

interface HelpArticle {
  id: number;
  title: string;
  content: string;
  category: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  author: {
    name: string;
    role: string;
    avatar?: string;
  };
}

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  attachments?: File[];
}

export default function HelpCenterPage() {
  const [activeTab, setActiveTab] = useState<'faq' | 'articles' | 'contact' | 'resources'>('faq');
  const [searchQuery, setSearchQuery] = useState('');
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [filteredFaqs, setFilteredFaqs] = useState<FAQ[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<HelpArticle[]>([]);
  const [expandedFaqId, setExpandedFaqId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [helpfulFeedback, setHelpfulFeedback] = useState<Record<number, boolean>>({});
  
  const [contactForm, setContactForm] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    category: 'general',
    message: '',
    priority: 'medium',
    attachments: []
  });

  const contactFormRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    { id: 'all', name: 'All Categories', icon: faQuestionCircle, color: 'bg-blue-100 text-blue-600' },
    { id: 'general', name: 'General', icon: faQuestionCircle, color: 'bg-gray-100 text-gray-600' },
    { id: 'account', name: 'Account & Profile', icon: faUserCircle, color: 'bg-purple-100 text-purple-600' },
    { id: 'jobs', name: 'Jobs & Applications', icon: faBriefcase, color: 'bg-green-100 text-green-600' },
    { id: 'learning', name: 'Learning & Courses', icon: faGraduationCap, color: 'bg-amber-100 text-amber-600' },
    { id: 'community', name: 'Community & Networking', icon: faUsers, color: 'bg-pink-100 text-pink-600' },
    { id: 'technical', name: 'Technical Support', icon: faCog, color: 'bg-red-100 text-red-600' },
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-700' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-700' },
    { value: 'high', label: 'High', color: 'bg-red-100 text-red-700' },
  ];

  const quickLinks = [
    { title: 'How to apply for jobs', category: 'jobs', icon: faBriefcase },
    { title: 'Update your profile', category: 'account', icon: faUserCircle },
    { title: 'Connect with other professionals', category: 'community', icon: faUsers },
    { title: 'Access learning courses', category: 'learning', icon: faGraduationCap },
    { title: 'Reset your password', category: 'account', icon: faCog },
    { title: 'Report inappropriate content', category: 'general', icon: faQuestionCircle },
  ];

  const resources = [
    { title: 'Community Guidelines', description: 'Learn about our community standards and policies', url: '#', icon: faUsers },
    { title: 'Privacy Policy', description: 'Understand how we protect your data and privacy', url: '#', icon: faCog },
    { title: 'Terms of Service', description: 'Read our terms and conditions of use', url: '#', icon: faBook },
    { title: 'Safety Center', description: 'Resources for staying safe on our platform', url: '#', icon: faQuestionCircle },
  ];

  useEffect(() => {
    fetchHelpData();
  }, []);

  useEffect(() => {
    filterContent();
  }, [searchQuery, selectedCategory, faqs, articles]);

  const fetchHelpData = async () => {
    try {
      setLoading(true);
      
      // Fetch FAQs
      const faqResponse = await api.get('/help/faqs');
      if (faqResponse.data.success) {
        setFaqs(faqResponse.data.data);
      }
      
      // Fetch articles
      const articlesResponse = await api.get('/help/articles');
      if (articlesResponse.data.success) {
        setArticles(articlesResponse.data.data);
      }
      
    } catch (error) {
      console.error('Error fetching help data:', error);
      // Load mock data if API fails
      setFaqs(mockFaqs);
      setArticles(mockArticles);
    } finally {
      setLoading(false);
    }
  };

  const filterContent = () => {
    // Filter FAQs
    let filtered = faqs;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(faq => faq.category === selectedCategory);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(faq => 
        faq.question.toLowerCase().includes(query) || 
        faq.answer.toLowerCase().includes(query)
      );
    }
    
    setFilteredFaqs(filtered);
    
    // Filter Articles
    let filteredArticlesList = articles;
    
    if (selectedCategory !== 'all') {
      filteredArticlesList = filteredArticlesList.filter(article => article.category === selectedCategory);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredArticlesList = filteredArticlesList.filter(article => 
        article.title.toLowerCase().includes(query) || 
        article.content.toLowerCase().includes(query) ||
        article.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    setFilteredArticles(filteredArticlesList);
  };

  const handleFaqToggle = (id: number) => {
    setExpandedFaqId(expandedFaqId === id ? null : id);
  };

  const handleHelpfulFeedback = async (faqId: number, isHelpful: boolean) => {
    try {
      setHelpfulFeedback(prev => ({ ...prev, [faqId]: isHelpful }));
      
      await api.post(`/help/faqs/${faqId}/feedback`, { helpful: isHelpful });
      
      // Update local state
      setFaqs(prev => prev.map(faq => {
        if (faq.id === faqId) {
          return {
            ...faq,
            helpful: isHelpful ? faq.helpful + 1 : faq.helpful,
            not_helpful: !isHelpful ? faq.not_helpful + 1 : faq.not_helpful
          };
        }
        return faq;
      }));
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setHelpfulFeedback(prev => ({ ...prev, [faqId]: undefined }));
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setSubmitError('');
      
      const formData = new FormData();
      formData.append('name', contactForm.name);
      formData.append('email', contactForm.email);
      formData.append('subject', contactForm.subject);
      formData.append('category', contactForm.category);
      formData.append('message', contactForm.message);
      formData.append('priority', contactForm.priority);
      
      if (contactForm.attachments) {
        contactForm.attachments.forEach(file => {
          formData.append('attachments[]', file);
        });
      }
      
      const response = await api.post('/help/contact', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        setSubmitSuccess(true);
        setContactForm({
          name: '',
          email: '',
          subject: '',
          category: 'general',
          message: '',
          priority: 'medium',
          attachments: []
        });
        
        setTimeout(() => setSubmitSuccess(false), 5000);
      } else {
        setSubmitError(response.data.message || 'Failed to submit your request');
      }
      
    } catch (error: any) {
      console.error('Error submitting contact form:', error);
      setSubmitError(error.response?.data?.message || 'Failed to submit your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setContactForm(prev => ({
        ...prev,
        attachments: [...(prev.attachments || []), ...newFiles]
      }));
    }
  };

  const removeAttachment = (index: number) => {
    setContactForm(prev => ({
      ...prev,
      attachments: prev.attachments?.filter((_, i) => i !== index)
    }));
  };

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.id === category);
    return cat ? cat.icon : faQuestionCircle;
  };

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.id === category);
    return cat ? cat.color : 'bg-gray-100 text-gray-600';
  };

  if (loading) {
    return (
      <>
        <HeaderLoggedIn />
        <div className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white pt-16">
          <div className="max-w-[1360px] mx-auto px-4 lg:px-6 flex gap-6 mt-[-70px] min-h-screen">
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading help center...</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <HeaderLoggedIn />
      <div className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white pt-16">
        <div className="max-w-[1360px] mx-auto px-4 lg:px-6 flex gap-6 mt-[-70px]">
          {/* LEFT SIDEBAR */}
          <aside className="w-[280px] hidden lg:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-hide">
            <Sidebar />
          </aside>

          {/* MAIN CONTENT */}
          <main className="flex-1 space-y-6 mt-6 max-h-[calc(100vh-4rem)] overflow-y-auto scrollbar-hide">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 md:p-8 text-white">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">Help Center</h1>
                  <p className="text-blue-100 max-w-2xl">
                    Get help with your account, find answers to frequently asked questions, and learn how to make the most of our platform.
                  </p>
                </div>
                <div className="mt-4 md:mt-0">
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{faqs.length}</div>
                      <div className="text-sm text-blue-200">FAQs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{articles.length}</div>
                      <div className="text-sm text-blue-200">Articles</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">24/7</div>
                      <div className="text-sm text-blue-200">Support</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Search Bar */}
              <div className="mt-6 max-w-2xl">
                <div className="relative">
                  <FontAwesomeIcon 
                    icon={faSearch} 
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400"
                  />
                  <input
                    type="text"
                    placeholder="Search for help topics, articles, or FAQs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent placeholder-white/70 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setActiveTab('faq')}
                  className={`flex-1 py-4 text-center font-medium transition ${
                    activeTab === 'faq'
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                  }`}
                >
                  <FontAwesomeIcon icon={faQuestionCircle} className="mr-2" />
                  FAQs
                </button>
                <button
                  onClick={() => setActiveTab('articles')}
                  className={`flex-1 py-4 text-center font-medium transition ${
                    activeTab === 'articles'
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                  }`}
                >
                  <FontAwesomeIcon icon={faBook} className="mr-2" />
                  Articles
                </button>
                <button
                  onClick={() => setActiveTab('contact')}
                  className={`flex-1 py-4 text-center font-medium transition ${
                    activeTab === 'contact'
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                  }`}
                >
                  <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
                  Contact Support
                </button>
                <button
                  onClick={() => setActiveTab('resources')}
                  className={`flex-1 py-4 text-center font-medium transition ${
                    activeTab === 'resources'
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                  }`}
                >
                  <FontAwesomeIcon icon={faCog} className="mr-2" />
                  Resources
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* Category Filters */}
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2">
                    {categories.map(category => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition flex items-center ${
                          selectedCategory === category.id
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        <FontAwesomeIcon icon={category.icon} className="mr-2" />
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* FAQs Tab */}
                {activeTab === 'faq' && (
                  <div className="space-y-4">
                    {filteredFaqs.length === 0 ? (
                      <div className="text-center py-8">
                        <FontAwesomeIcon icon={faQuestionCircle} className="text-4xl text-gray-300 dark:text-gray-600 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          No FAQs found
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          {searchQuery 
                            ? 'No FAQs match your search. Try different keywords.'
                            : 'No FAQs available for this category.'}
                        </p>
                      </div>
                    ) : (
                      filteredFaqs.map(faq => (
                        <div 
                          key={faq.id}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                        >
                          <button
                            onClick={() => handleFaqToggle(faq.id)}
                            className="w-full p-4 text-left flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-750 transition"
                          >
                            <div className="flex items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${getCategoryColor(faq.category)}`}>
                                <FontAwesomeIcon icon={getCategoryIcon(faq.category)} />
                              </div>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {faq.question}
                              </span>
                            </div>
                            <FontAwesomeIcon 
                              icon={expandedFaqId === faq.id ? faChevronUp : faChevronDown} 
                              className="text-gray-400"
                            />
                          </button>
                          
                          {expandedFaqId === faq.id && (
                            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
                              <div className="prose prose-gray dark:prose-invert max-w-none">
                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                                  {faq.answer}
                                </p>
                              </div>
                              
                              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {faq.views} views • {faq.helpful} found this helpful
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-500 dark:text-gray-400">Was this helpful?</span>
                                  <button
                                    onClick={() => handleHelpfulFeedback(faq.id, true)}
                                    disabled={helpfulFeedback[faq.id] !== undefined}
                                    className={`px-3 py-1 rounded text-sm font-medium flex items-center ${
                                      helpfulFeedback[faq.id] === true
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                  >
                                    <FontAwesomeIcon icon={faCheck} className="mr-1" />
                                    Yes
                                  </button>
                                  <button
                                    onClick={() => handleHelpfulFeedback(faq.id, false)}
                                    disabled={helpfulFeedback[faq.id] !== undefined}
                                    className={`px-3 py-1 rounded text-sm font-medium flex items-center ${
                                      helpfulFeedback[faq.id] === false
                                        ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                  >
                                    <FontAwesomeIcon icon={faTimes} className="mr-1" />
                                    No
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Articles Tab */}
                {activeTab === 'articles' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredArticles.length === 0 ? (
                      <div className="col-span-2 text-center py-8">
                        <FontAwesomeIcon icon={faBook} className="text-4xl text-gray-300 dark:text-gray-600 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          No articles found
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          {searchQuery 
                            ? 'No articles match your search. Try different keywords.'
                            : 'No articles available for this category.'}
                        </p>
                      </div>
                    ) : (
                      filteredArticles.map(article => (
                        <div 
                          key={article.id}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-lg transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(article.category)}`}>
                              {article.category.charAt(0).toUpperCase() + article.category.slice(1)}
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(article.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                            {article.title}
                          </h3>
                          
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                            {article.content.substring(0, 150)}...
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center mr-2">
                                <FontAwesomeIcon icon={faUserCircle} className="text-gray-500" />
                              </div>
                              <div>
                                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                  {article.author.name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {article.author.role}
                                </div>
                              </div>
                            </div>
                            
                            <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium flex items-center">
                              Read more
                              <FontAwesomeIcon icon={faExternalLinkAlt} className="ml-1 text-xs" />
                            </button>
                          </div>
                          
                          {article.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                              {article.tags.map(tag => (
                                <span 
                                  key={tag}
                                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Contact Support Tab */}
                {activeTab === 'contact' && (
                  <div ref={contactFormRef}>
                    <div className="max-w-2xl mx-auto">
                      {submitSuccess ? (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                            <FontAwesomeIcon icon={faCheck} className="text-2xl text-green-600 dark:text-green-400" />
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            Message Sent Successfully!
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-4">
                            We've received your message and our support team will get back to you within 24 hours.
                          </p>
                          <button
                            onClick={() => setSubmitSuccess(false)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                          >
                            Send another message
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleContactSubmit} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Your Name *
                              </label>
                              <input
                                type="text"
                                required
                                value={contactForm.name}
                                onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800"
                                placeholder="John Doe"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Email Address *
                              </label>
                              <input
                                type="email"
                                required
                                value={contactForm.email}
                                onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800"
                                placeholder="john@example.com"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Subject *
                            </label>
                            <input
                              type="text"
                              required
                              value={contactForm.subject}
                              onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800"
                              placeholder="Brief description of your issue"
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Category *
                              </label>
                              <select
                                value={contactForm.category}
                                onChange={(e) => setContactForm({...contactForm, category: e.target.value})}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800"
                              >
                                {categories.slice(1).map(category => (
                                  <option key={category.id} value={category.id}>
                                    {category.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Priority *
                              </label>
                              <div className="flex space-x-2">
                                {priorities.map(priority => (
                                  <button
                                    key={priority.value}
                                    type="button"
                                    onClick={() => setContactForm({...contactForm, priority: priority.value as any})}
                                    className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium ${
                                      contactForm.priority === priority.value
                                        ? priority.color + ' border-2 border-blue-500'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                  >
                                    {priority.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Message *
                            </label>
                            <textarea
                              required
                              rows={6}
                              value={contactForm.message}
                              onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 resize-none"
                              placeholder="Please provide detailed information about your issue..."
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Attachments (Optional)
                            </label>
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
                              <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                multiple
                                className="hidden"
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              />
                              <FontAwesomeIcon icon={faPaperPlane} className="text-3xl text-gray-400 mb-3" />
                              <p className="text-gray-600 dark:text-gray-400 mb-2">
                                Drag & drop files here or click to browse
                              </p>
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium"
                              >
                                Browse Files
                              </button>
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                Max file size: 10MB. Supported formats: PDF, DOC, JPG, PNG
                              </p>
                            </div>
                            
                            {contactForm.attachments && contactForm.attachments.length > 0 && (
                              <div className="mt-4 space-y-2">
                                {contactForm.attachments.map((file, index) => (
                                  <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-750 p-3 rounded-lg">
                                    <div className="flex items-center">
                                      <FontAwesomeIcon icon={faPaperPlane} className="text-gray-400 mr-3" />
                                      <div>
                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                          {file.name}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeAttachment(index)}
                                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                                    >
                                      <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {submitError && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                              <div className="flex items-center">
                                <FontAwesomeIcon icon={faTimes} className="text-red-600 dark:text-red-400 mr-2" />
                                <div className="text-red-600 dark:text-red-400 font-medium">{submitError}</div>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
                              Our team typically responds within 24 hours
                            </div>
                            
                            <button
                              type="submit"
                              disabled={submitting}
                              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed font-medium flex items-center"
                            >
                              {submitting ? (
                                <>
                                  <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />
                                  Send Message
                                </>
                              )}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                )}

                {/* Resources Tab */}
                {activeTab === 'resources' && (
                  <div className="space-y-8">
                    {/* Quick Links */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Links</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {quickLinks.map((link, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setSelectedCategory(link.category);
                              setActiveTab('faq');
                              contactFormRef.current?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-left hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center mb-2">
                              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                                <FontAwesomeIcon icon={link.icon} className="text-blue-600 dark:text-blue-400" />
                              </div>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {link.title}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Get help with {link.title.toLowerCase()}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Important Resources */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Important Resources</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {resources.map((resource, index) => (
                          <div 
                            key={index}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center mb-3">
                              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-4">
                                <FontAwesomeIcon icon={resource.icon} className="text-gray-600 dark:text-gray-400 text-lg" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                  {resource.title}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {resource.description}
                                </p>
                              </div>
                            </div>
                            <a
                              href={resource.url}
                              className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                            >
                              View resource
                              <FontAwesomeIcon icon={faExternalLinkAlt} className="ml-1 text-xs" />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Contact Information */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Other Ways to Contact Us</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <FontAwesomeIcon icon={faEnvelope} className="text-blue-600 dark:text-blue-400 text-xl" />
                          </div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-1">Email</h4>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">support@idriva.ng</p>
                          <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">Response within 24 hours</p>
                        </div>
                        
                        <div className="text-center">
                          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                            <FontAwesomeIcon icon={faMessage} className="text-green-600 dark:text-green-400 text-xl" />
                          </div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-1">Live Chat</h4>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">Available 9AM-5PM WAT</p>
                          <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">Mon-Fri</p>
                        </div>
                        
                        <div className="text-center">
                          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                            <FontAwesomeIcon icon={faPhone} className="text-purple-600 dark:text-purple-400 text-xl" />
                          </div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-1">Phone</h4>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">+234 (701) 123-4567</p>
                          <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">9AM-5PM EST, Mon-Fri</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>

          {/* RIGHT SIDEBAR */}
          {/* <aside className="w-[320px] hidden xl:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden scrollbar-hide">
            <RightbarRecruiters />
          </aside> */}
        </div>
      </div>
    </>
  );
}

// Mock data for demonstration
const mockFaqs: FAQ[] = [
  {
    id: 1,
    question: 'How do I apply for a job?',
    answer: 'To apply for a job:\n1. Navigate to the Jobs page\n2. Browse available job listings\n3. Click on a job to view details\n4. Click "Apply Now"\n5. Upload your resume and cover letter\n6. Submit your application\n\nYou\'ll receive a confirmation email and can track your application status in your dashboard.',
    category: 'jobs',
    views: 1250,
    helpful: 980,
    not_helpful: 45
  },
  {
    id: 2,
    question: 'How can I update my profile information?',
    answer: 'You can update your profile by:\n1. Clicking on your profile picture in the top right\n2. Selecting "Edit Profile"\n3. Updating your information in the form\n4. Clicking "Save Changes"\n\nMake sure to keep your profile updated to attract more opportunities!',
    category: 'account',
    views: 890,
    helpful: 750,
    not_helpful: 32
  },
  {
    id: 3,
    question: 'How do I reset my password?',
    answer: 'If you forgot your password:\n1. Go to the login page\n2. Click "Forgot Password"\n3. Enter your email address\n4. Check your email for reset instructions\n5. Follow the link to create a new password\n\nIf you don\'t receive the email, check your spam folder or contact support.',
    category: 'account',
    views: 1560,
    helpful: 1420,
    not_helpful: 28
  },
  {
    id: 4,
    question: 'How do I access learning courses?',
    answer: 'To access learning courses:\n1. Navigate to the Learning section\n2. Browse available courses\n3. Click on a course to view details\n4. Click "Enroll" to start the course\n5. Complete lessons and quizzes\n6. Earn certificates upon completion\n\nAll progress is saved automatically.',
    category: 'learning',
    views: 720,
    helpful: 680,
    not_helpful: 15
  },
  {
    id: 5,
    question: 'How can I connect with other professionals?',
    answer: 'You can connect with professionals by:\n1. Browsing the "People You May Know" section\n2. Visiting user profiles\n3. Clicking the "Follow" or "Connect" button\n4. Sending direct messages to connections\n5. Joining community groups\n6. Participating in discussions\n\nBuilding your network helps you discover more opportunities!',
    category: 'community',
    views: 940,
    helpful: 820,
    not_helpful: 38
  }
];

const mockArticles: HelpArticle[] = [
  {
    id: 1,
    title: 'Creating an Effective Professional Profile',
    content: 'Learn how to create a professional profile that stands out to recruiters and helps you get more job opportunities. This guide covers profile optimization, skills highlighting, and best practices.',
    category: 'account',
    tags: ['profile', 'optimization', 'recruiters'],
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    author: {
      name: 'Sarah Johnson',
      role: 'Career Coach'
    }
  },
  {
    id: 2,
    title: 'Job Application Best Practices',
    content: 'Discover the best practices for submitting job applications that get noticed. Learn about resume formatting, cover letter tips, and follow-up strategies.',
    category: 'jobs',
    tags: ['applications', 'resume', 'cover-letter'],
    created_at: '2024-01-10T14:20:00Z',
    updated_at: '2024-01-10T14:20:00Z',
    author: {
      name: 'Michael Chen',
      role: 'HR Manager'
    }
  },
  {
    id: 3,
    title: 'Maximizing Your Learning Experience',
    content: 'Get the most out of our learning platform with these tips and strategies for effective online learning and skill development.',
    category: 'learning',
    tags: ['learning', 'courses', 'skills'],
    created_at: '2024-01-05T09:15:00Z',
    updated_at: '2024-01-05T09:15:00Z',
    author: {
      name: 'Dr. Emily Wilson',
      role: 'Learning Specialist'
    }
  }
];