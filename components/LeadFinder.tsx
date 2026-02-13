import React, { useState } from 'react';
import { TARGET_CITIES, TARGET_NICHES, BusinessLead } from '../types';
import { findLocalBusinesses, generateOutreachEmail } from '../services/gemini';

interface LeadFinderProps {
  onLeadsFound: (leads: BusinessLead[]) => void;
  totalEmailsSent: number;
}

export const LeadFinder: React.FC<LeadFinderProps> = ({ onLeadsFound, totalEmailsSent }) => {
  const [isSearching, setIsSearching] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedNiche, setSelectedNiche] = useState(TARGET_NICHES[0]);
  const [selectedCity, setSelectedCity] = useState(TARGET_CITIES[0]);
  const [currentLeads, setCurrentLeads] = useState<BusinessLead[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Selection & Bulk Actions State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Helper to pick random item
  const pickRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const handleRunDailyBatch = async () => {
    setIsSearching(true);
    setStatusMessage(`Initiating search for ${selectedNiche} in ${selectedCity}...`);
    setCurrentLeads([]);
    setSelectedIds(new Set());

    try {
      // 1. Find leads via Gemini Maps
      const rawLeads = await findLocalBusinesses(selectedNiche, selectedCity);
      
      setStatusMessage(`Found ${rawLeads.length} potential listings. Filtering for website absence...`);

      // 2. Convert to BusinessLead objects
      const newLeads: BusinessLead[] = rawLeads.map((lead) => ({
        id: crypto.randomUUID(),
        name: lead.name!,
        address: lead.address!,
        phone: lead.phone!,
        website: lead.website!,
        niche: selectedNiche,
        location: selectedCity,
        status: 'PENDING',
        foundAt: new Date().toISOString()
      }));

      setCurrentLeads(newLeads);
      setStatusMessage('Analysis complete. Review leads below.');
    } catch (error) {
      console.error(error);
      setStatusMessage('Error occurred during search. Please check your API key.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleRandomize = () => {
      setSelectedNiche(pickRandom(TARGET_NICHES));
      setSelectedCity(pickRandom(TARGET_CITIES));
  }

  // Individual Actions
  const handleGenerateEmail = async (lead: BusinessLead) => {
    setProcessingId(lead.id);
    try {
      const emailContent = await generateOutreachEmail(lead.name, lead.niche);
      const updatedLead = { ...lead, status: 'GENERATED' as const, generatedEmail: emailContent };
      
      // Update local state
      setCurrentLeads(prev => prev.map(l => l.id === lead.id ? updatedLead : l));
      return updatedLead;
    } catch (e) {
      console.error("Failed to generate email for", lead.name);
      return null;
    } finally {
      setProcessingId(null);
    }
  };

  const handleSendEmail = (lead: BusinessLead) => {
    if (!lead.generatedEmail) return null;
    
    // Simulate sending
    const updatedLead = { ...lead, status: 'CONTACTED' as const };
    setCurrentLeads(prev => prev.map(l => l.id === lead.id ? updatedLead : l));
    
    // Persist to main app history
    onLeadsFound([updatedLead]);
    return updatedLead;
  };

  // Selection Logic
  const toggleSelectAll = () => {
      if (selectedIds.size === currentLeads.length && currentLeads.length > 0) {
          setSelectedIds(new Set());
      } else {
          setSelectedIds(new Set(currentLeads.map(l => l.id)));
      }
  };

  const toggleSelect = (id: string) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedIds(newSet);
  };

  // Bulk Handlers
  const handleBulkGenerate = async () => {
      setIsBulkProcessing(true);
      const ids = Array.from(selectedIds);
      let count = 0;
      
      for (const id of ids) {
          // Use currentLeads to find metadata, but status check ensures we process valid ones
          const leadToProcess = currentLeads.find(l => l.id === id);
          if (!leadToProcess || leadToProcess.status !== 'PENDING') continue;

          setStatusMessage(`Generating email for ${leadToProcess.name} (${++count}/${ids.length})...`);
          
          try {
             // We call api directly here or reuse helper logic but without the UI state conflict
             const emailContent = await generateOutreachEmail(leadToProcess.name, leadToProcess.niche);
             
             // Functional update to ensure we don't overwrite other parallel updates
             setCurrentLeads(prevLeads => prevLeads.map(l => 
                l.id === id 
                ? { ...l, status: 'GENERATED', generatedEmail: emailContent }
                : l
             ));
          } catch(e) {
             console.error(e);
          }
      }
      
      setStatusMessage(`Bulk generation complete.`);
      setIsBulkProcessing(false);
  };

  const handleBulkSend = async () => {
      setIsBulkProcessing(true);
      const ids = Array.from(selectedIds);
      const sentLeads: BusinessLead[] = [];
      let count = 0;

      for (const id of ids) {
          // Snapshot of lead at start of process is sufficient for this check
          const lead = currentLeads.find(l => l.id === id);
          if (lead && lead.status === 'GENERATED') {
             setStatusMessage(`Sending email to ${lead.name} (${++count}/${ids.length})...`);
             // Small delay to simulate sending
             await new Promise(r => setTimeout(r, 200));
             
             const updatedLead = { ...lead, status: 'CONTACTED' as const };
             sentLeads.push(updatedLead);
             
             setCurrentLeads(prev => prev.map(l => l.id === id ? updatedLead : l));
          }
      }
      
      if (sentLeads.length > 0) {
          onLeadsFound(sentLeads);
      }
      
      setStatusMessage(`Bulk send complete. Sent ${sentLeads.length} emails.`);
      setIsBulkProcessing(false);
  };

  return (
    <div className="space-y-6">
       {/* Global Stats Counter */}
      <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg shadow-lg p-6 text-white flex justify-between items-center">
        <div>
            <h2 className="text-xl font-bold">Outreach Command Center</h2>
            <p className="text-indigo-100 text-sm">Find leads, generate copy, and scale your outreach.</p>
        </div>
        <div className="text-right">
             <div className="text-3xl font-bold">{totalEmailsSent}</div>
             <div className="text-xs text-indigo-200 uppercase tracking-wider font-semibold">Total Emails Sent</div>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Manual Batch Trigger
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Select a target niche and location, or randomize to simulate the daily automated bot.</p>
          </div>
          
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3 items-end">
            <div>
              <label htmlFor="niche" className="block text-sm font-medium text-gray-700">Target Niche</label>
              <select
                id="niche"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                value={selectedNiche}
                onChange={(e) => setSelectedNiche(e.target.value)}
              >
                {TARGET_NICHES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">Location</label>
              <select
                id="city"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
              >
                {TARGET_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="flex space-x-2">
                 <button
                    onClick={handleRandomize}
                    className="flex-1 bg-gray-100 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none"
                    disabled={isSearching || isBulkProcessing}
                  >
                    Randomize
                  </button>
                  <button
                    onClick={handleRunDailyBatch}
                    disabled={isSearching || isBulkProcessing}
                    className="flex-1 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {isSearching ? 'Scraping...' : 'Find Leads'}
                  </button>
            </div>
          </div>
          
          {statusMessage && (
            <div className="mt-4 text-sm text-indigo-600 font-medium animate-pulse">
              {statusMessage}
            </div>
          )}
        </div>
      </div>

      {/* Results List */}
      {currentLeads.length > 0 && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
           {/* Bulk Actions Toolbar */}
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between sm:px-6 sticky top-0 z-10">
                <div className="flex items-center">
                    <input
                        id="select-all"
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={currentLeads.length > 0 && selectedIds.size === currentLeads.length}
                        onChange={toggleSelectAll}
                    />
                    <label htmlFor="select-all" className="ml-2 block text-sm text-gray-700">
                        Select All ({currentLeads.length})
                    </label>
                    <span className="ml-4 text-sm text-gray-500">
                        {selectedIds.size} selected
                    </span>
                </div>
                <div className="flex space-x-2">
                     <button
                        onClick={handleBulkGenerate}
                        disabled={selectedIds.size === 0 || isBulkProcessing}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none disabled:opacity-50"
                     >
                        Generate Emails
                     </button>
                     <button
                        onClick={handleBulkSend}
                        disabled={selectedIds.size === 0 || isBulkProcessing}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
                     >
                        Send Emails
                     </button>
                </div>
          </div>

          <ul className="divide-y divide-gray-200">
            {currentLeads.map((lead) => (
              <li key={lead.id} className={`block hover:bg-gray-50 transition duration-150 ease-in-out ${selectedIds.has(lead.id) ? 'bg-indigo-50' : ''}`}>
                <div className="px-4 py-4 sm:px-6 flex items-start">
                  <div className="mr-4 mt-1">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={selectedIds.has(lead.id)}
                        onChange={() => toggleSelect(lead.id)}
                      />
                  </div>
                  <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-indigo-600 truncate">
                          {lead.name}
                        </div>
                        <div className="ml-2 flex-shrink-0 flex">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            lead.website === 'None' || lead.website === 'N/A' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {lead.website === 'None' || lead.website === 'N/A' ? 'No Website Detected' : 'Has Website'}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500 mr-6">
                             📍 {lead.address}
                          </p>
                          <p className="flex items-center text-sm text-gray-500">
                             📞 {lead.phone}
                          </p>
                        </div>
                      </div>
                      
                      {/* Action Area */}
                      <div className="mt-4 border-t border-gray-100 pt-4">
                        {lead.status === 'PENDING' && (
                            <button
                                onClick={() => handleGenerateEmail(lead)}
                                disabled={processingId === lead.id || isBulkProcessing}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none disabled:opacity-50"
                            >
                                {processingId === lead.id ? 'Generating...' : 'Generate Outreach Email'}
                            </button>
                        )}
                        
                        {lead.status !== 'PENDING' && lead.generatedEmail && (
                            <div className="space-y-3">
                                <div className="bg-white p-3 rounded text-sm text-gray-700 whitespace-pre-wrap border border-gray-200 shadow-sm">
                                    {lead.generatedEmail}
                                </div>
                                <div className="flex justify-end">
                                    {lead.status === 'CONTACTED' ? (
                                        <span className="flex items-center text-sm text-green-600 font-medium">
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            Sent
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => handleSendEmail(lead)}
                                            disabled={isBulkProcessing}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none disabled:opacity-50"
                                        >
                                            Send Email
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                      </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};