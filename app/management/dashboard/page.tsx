'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PricingManagement from '@/components/PricingManagement';
import Image from 'next/image';

interface DashboardSection {
  id: string;
  title: string;
  icon: JSX.Element;
  description: string;
}

export default function ManagementDashboard() {
  const [activeSection, setActiveSection] = useState('pricing');
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sections: DashboardSection[] = [
    {
      id: 'pricing',
      title: 'Pricing',
      description: 'Manage product prices and discounts',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'inventory',
      title: 'Inventory',
      description: 'Manage your stock',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      )
    },
    {
      id: 'history',
      title: 'History',
      description: 'View your transaction history',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'customers',
      title: 'Customers',
      description: 'Manage your customer relationships',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      id: 'suppliers',
      title: 'Suppliers',
      description: 'Manage your supplier relationships',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    }
  ];

  const renderContent = () => {
    const content = {
      pricing: <PricingManagement />,
      inventory: (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-white rounded-lg shadow-sm"
        >
          <h2 className="text-2xl font-semibold mb-4">Inventory Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['Total Items', 'Low Stock', 'Out of Stock'].map((stat, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-gray-500 text-sm">{stat}</h3>
                <p className="text-2xl font-bold">0</p>
              </div>
            ))}
          </div>
        </motion.div>
      ),
      // Add other section contents...
    }[activeSection] || (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6 bg-white rounded-lg shadow-sm"
      >
        <h2 className="text-2xl font-semibold mb-4">
          {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
        </h2>
        <p>Content coming soon...</p>
      </motion.div>
    );

    return content;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <motion.div
          initial={false}
          animate={{ width: sidebarOpen ? 'auto' : '0px' }}
          className={`${isMobile ? 'fixed z-50' : ''} bg-white h-screen shadow-lg`}
        >
          <div className="w-64">
            <div className="p-4 border-b flex items-center justify-between">
              <h1 className="text-xl font-bold">Management Portal</h1>
              {isMobile && (
                <button onClick={() => setSidebarOpen(false)} className="p-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <nav className="p-4">
              <AnimatePresence>
                {sections.map((section) => (
                  <motion.button
                    key={section.id}
                    onClick={() => {
                      setActiveSection(section.id);
                      if (isMobile) setSidebarOpen(false);
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-all ${
                      activeSection === section.id
                        ? 'bg-blue-100 text-blue-600'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {section.icon}
                    <div className="text-left">
                      <span className="block font-medium">{section.title}</span>
                      <span className="text-xs text-gray-500">{section.description}</span>
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </nav>
          </div>
        </motion.div>

        <div className="flex-1">
          {isMobile && (
            <div className="p-4 bg-white shadow-sm flex items-center">
              <button onClick={() => setSidebarOpen(true)} className="p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="ml-4 text-xl font-bold">
                {sections.find(s => s.id === activeSection)?.title}
              </h1>
            </div>
          )}
          
          <motion.div 
            layout
            className="p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </div>
      </div>
    </div>
  );
} 