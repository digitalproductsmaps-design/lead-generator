import React from 'react';
import { ScrapingStats, AppView } from '../types';

interface DashboardProps {
  stats: ScrapingStats;
  onNavigate: (view: AppView) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ stats, onNavigate }) => {
  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Overview
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Track your daily automated outreach performance.
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            onClick={() => onNavigate(AppView.FINDER)}
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Start New Batch
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Leads Found</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalLeads}</dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Emails Sent</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.emailsSent}</dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Last Batch Run</dt>
            <dd className="mt-1 text-lg font-semibold text-gray-900">
              {stats.lastRun ? new Date(stats.lastRun).toLocaleDateString() : 'Never'}
            </dd>
          </div>
        </div>
      </div>

      {/* Simulated Automated Task Card */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Daily Auto-Scraper Configuration
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>
              The system is configured to pull 500 listings daily from random supported locations.
            </p>
          </div>
          <div className="mt-5">
            <div className="rounded-md bg-gray-50 p-4 border border-gray-200">
               <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-800">Next Scheduled Run</h3>
                    <div className="mt-2 text-sm text-gray-500">
                      <p>Tomorrow at 09:00 AM UTC</p>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};