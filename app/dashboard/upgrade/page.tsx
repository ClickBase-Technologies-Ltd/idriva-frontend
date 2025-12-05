'use client';
import { useState, useEffect } from 'react';
import Sidebar from "@/components/Sidebar";
import RightbarRecruiters from "@/components/Rightbar";
import HeaderLoggedIn from "@/components/HeaderLoggedIn";
import api from '@/lib/api';
// import { motion } from 'framer-motion';
import { motion } from 'motion/react';
import { Check, Crown, Rocket, Zap, Sparkles, Shield, Target, Globe, Users, TrendingUp, Star, Lock, BadgeCheck } from 'lucide-react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  profile_picture?: string;
  subscription?: string;
}

interface PlanFeature {
  text: string;
  included: boolean;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billing: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  badge?: string;
  features: PlanFeature[];
  mostPopular: boolean;
}

export default function SubscriptionPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData: User = JSON.parse(storedUser);
          setUser(userData);
          
          // Check current subscription
          const response = await api.get('/subscription/current');
          if (response.status === 200) {
            setSelectedPlan(response.data.plan || null);
          }
        } else {
          window.location.href = '/auth/login';
          return;
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const subscriptionPlans: SubscriptionPlan[] = [
    {
      id: 'free',
      name: 'Explorer',
      price: 0,
      billing: 'forever free',
      description: 'Perfect for getting started and exploring opportunities',
      icon: <Globe className="w-8 h-8" />,
      color: 'bg-gradient-to-r from-blue-500 to-cyan-400',
      features: [
        { text: 'Basic job search access', included: true },
        { text: 'Limited post visibility (5/day)', included: true },
        { text: 'Connect with up to 10 people/month', included: true },
        { text: 'Basic profile analytics', included: true },
        { text: 'Priority job alerts', included: false },
        { text: 'Advanced search filters', included: false },
        { text: 'Unlimited connections', included: false },
        { text: 'Profile verification badge', included: false },
        { text: 'AI-powered job matching', included: false },
        { text: 'Exclusive networking events', included: false },
      ],
      mostPopular: false
    },
    {
      id: 'basic',
      name: 'Pathfinder',
      price: 9.99,
      billing: 'per month',
      description: 'Level up your career journey with essential tools',
      icon: <Rocket className="w-8 h-8" />,
      color: 'bg-gradient-to-r from-emerald-500 to-green-400',
      badge: 'Most Value',
      features: [
        { text: 'All Explorer features', included: true },
        { text: 'Priority job alerts', included: true },
        { text: 'Advanced search filters', included: true },
        { text: 'Connect with up to 50 people/month', included: true },
        { text: 'Enhanced profile visibility', included: true },
        { text: 'Basic resume review', included: true },
        { text: 'Unlimited connections', included: false },
        { text: 'Profile verification badge', included: false },
        { text: 'AI-powered job matching', included: false },
        { text: 'Exclusive networking events', included: false },
      ],
      mostPopular: true
    },
    {
      id: 'gold',
      name: 'Trailblazer',
      price: 24.99,
      billing: 'per month',
      description: 'Stand out from the crowd with premium features',
      icon: <Crown className="w-8 h-8" />,
      color: 'bg-gradient-to-r from-amber-500 to-yellow-400',
      features: [
        { text: 'All Pathfinder features', included: true },
        { text: 'Unlimited connections', included: true },
        { text: 'Profile verification badge', included: true },
        { text: 'AI-powered job matching', included: true },
        { text: 'Direct messaging to recruiters', included: true },
        { text: 'Advanced analytics dashboard', included: true },
        { text: 'Priority customer support', included: true },
        { text: 'Custom profile themes', included: true },
        { text: 'Exclusive networking events', included: false },
        { text: '1-on-1 career coaching', included: false },
      ],
      mostPopular: false
    },
    {
      id: 'premium',
      name: 'Visionary',
      price: 49.99,
      billing: 'per month',
      description: 'Unlock the full potential of your professional network',
      icon: <Sparkles className="w-8 h-8" />,
      color: 'bg-gradient-to-r from-purple-600 to-pink-500',
      badge: 'Elite',
      features: [
        { text: 'All Trailblazer features', included: true },
        { text: 'Exclusive networking events', included: true },
        { text: '1-on-1 career coaching (monthly)', included: true },
        { text: 'Executive profile optimization', included: true },
        { text: 'Personalized job recommendations', included: true },
        { text: 'Recruiter outreach on your behalf', included: true },
        { text: 'Premium analytics with insights', included: true },
        { text: 'Early access to new features', included: true },
        { text: 'VIP support 24/7', included: true },
        { text: 'Featured profile placement', included: true },
      ],
      mostPopular: false
    }
  ];

  const handleSubscribe = async (planId: string) => {
    if (user?.subscription === planId) {
      setMessage({ type: 'success', text: `You are already on the ${planId} plan!` });
      return;
    }

    try {
      setProcessing(true);
      setMessage(null);

      const response = await api.post('/subscription/subscribe', {
        planId,
        userId: user?.id
      });

      if (response.status === 200 || response.status === 201) {
        setMessage({ type: 'success', text: `Successfully subscribed to ${planId} plan!` });
        
        // Update user subscription in state
        setUser(prev => prev ? { ...prev, subscription: planId } : null);
        
        // Update local storage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          userData.subscription = planId;
          localStorage.setItem('user', JSON.stringify(userData));
        }

        // In a real app, you would redirect to payment gateway or show payment modal
        if (planId !== 'free') {
          // Simulate payment processing
          setTimeout(() => {
            setMessage({ type: 'success', text: 'Payment processed successfully! Your subscription is now active.' });
          }, 1500);
        }
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to process subscription. Please try again.' 
      });
    } finally {
      setProcessing(false);
    }
  };

  const getPlanCardClass = (plan: SubscriptionPlan) => {
    let baseClass = "relative rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] ";
    
    if (plan.mostPopular) {
      baseClass += "border-2 border-emerald-500 bg-gradient-to-b from-emerald-50 to-white dark:from-gray-800 dark:to-gray-900 shadow-lg shadow-emerald-500/20";
    } else {
      baseClass += "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800";
    }
    
    return baseClass;
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
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading subscription plans...</p>
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
      
      <div className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-white pt-16 min-h-screen">
        <div className="max-w-[1360px] mx-auto px-4 lg:px-6 flex gap-6 mt-[-70px]">
          {/* LEFT SIDEBAR */}
          <aside className="w-[280px] hidden lg:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-hide">
            <Sidebar />
          </aside>

          {/* MAIN CONTENT */}
          <main className="flex-1 py-8">
            {/* Header */}
            <div className="text-center mb-12">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-4"
              >
                <Star className="w-4 h-4" />
                Unlock Your Full Potential
              </motion.div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-blue-700 dark:from-white dark:to-blue-400 bg-clip-text text-transparent">
                Choose Your Career Journey
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
                Upgrade your experience with features designed to accelerate your professional growth
              </p>
            </div>

            {/* Current Plan Indicator */}
            {user?.subscription && (
              <div className="max-w-4xl mx-auto mb-8">
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <BadgeCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Current Plan: {subscriptionPlans.find(p => p.id === user.subscription)?.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Next billing: {user.subscription === 'free' ? 'Never' : 'Monthly'}
                        </p>
                      </div>
                    </div>
                    <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
                      Manage Subscription
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Success/Error Message */}
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`max-w-4xl mx-auto mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}
              >
                <div className="flex items-center">
                  {message.type === 'success' ? (
                    <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mr-2" />
                  ) : (
                    <Lock className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                  )}
                  <span className={message.type === 'success' ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}>
                    {message.text}
                  </span>
                  <button 
                    onClick={() => setMessage(null)}
                    className="ml-auto text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    ×
                  </button>
                </div>
              </motion.div>
            )}

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {subscriptionPlans.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={getPlanCardClass(plan)}
                >
                  {/* Popular Badge */}
                  {plan.mostPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-emerald-500 to-green-400 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                        Most Popular
                      </div>
                    </div>
                  )}

                  {/* Plan Badge */}
                  {plan.badge && !plan.mostPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <div className={`${plan.color} text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg`}>
                        {plan.badge}
                      </div>
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="text-center mb-6">
                    <div className={`inline-flex p-3 rounded-xl ${plan.color} text-white mb-4`}>
                      {plan.icon}
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <div className="mb-2">
                      <span className="text-3xl font-bold">${plan.price}</span>
                      <span className="text-gray-500 dark:text-gray-400 ml-2">/{plan.billing}</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{plan.description}</p>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mr-3 mt-0.5" />
                        ) : (
                          <div className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0 mr-3 mt-0.5">×</div>
                        )}
                        <span className={feature.included ? '' : 'text-gray-400 dark:text-gray-600 line-through'}>
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={processing || user?.subscription === plan.id}
                    className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                      user?.subscription === plan.id
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-default'
                        : plan.mostPopular
                        ? 'bg-gradient-to-r from-emerald-500 to-green-400 text-white hover:shadow-lg hover:shadow-emerald-500/30'
                        : 'bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-800 dark:to-gray-700 text-white hover:shadow-lg'
                    } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {processing && plan.id === selectedPlan ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </span>
                    ) : user?.subscription === plan.id ? (
                      <span className="flex items-center justify-center">
                        <Check className="w-4 h-4 mr-2" />
                        Current Plan
                      </span>
                    ) : plan.price === 0 ? (
                      'Start Free'
                    ) : (
                      'Upgrade Now'
                    )}
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Comparison Table for Mobile */}
            <div className="mt-12 lg:hidden">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold">Feature Comparison</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-900">
                        <th className="p-4 text-left">Feature</th>
                        {subscriptionPlans.map(plan => (
                          <th key={plan.id} className="p-4 text-center">{plan.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {subscriptionPlans[0].features.map((_, idx) => (
                        <tr key={idx} className="border-t border-gray-200 dark:border-gray-700">
                          <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                            {subscriptionPlans[0].features[idx].text}
                          </td>
                          {subscriptionPlans.map(plan => (
                            <td key={plan.id} className="p-4 text-center">
                              {plan.features[idx].included ? (
                                <Check className="w-5 h-5 text-emerald-500 mx-auto" />
                              ) : (
                                <span className="text-gray-300 dark:text-gray-600">×</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="mt-16 max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    q: "Can I switch plans at any time?",
                    a: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately."
                  },
                  {
                    q: "What payment methods do you accept?",
                    a: "We accept all major credit cards, PayPal, and bank transfers for annual plans."
                  },
                  {
                    q: "Is there a free trial for paid plans?",
                    a: "Yes! All paid plans come with a 14-day free trial. No credit card required to start."
                  },
                  {
                    q: "Can I cancel my subscription anytime?",
                    a: "Absolutely. You can cancel anytime from your account settings. No hidden fees or penalties."
                  }
                ].map((faq, idx) => (
                  <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold mb-2">{faq.q}</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust Badges */}
            <div className="mt-12 text-center">
              <div className="flex flex-wrap items-center justify-center gap-8 text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  <span>Secure Payment</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  <span>30-Day Money Back</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>24/7 Support</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Trusted by 10,000+ Professionals</span>
                </div>
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