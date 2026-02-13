import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { LeadFinder } from './components/LeadFinder';
import { History } from './components/History';
import { AppView, BusinessLead, ScrapingStats } from './types';
import { hasApiKey } from './services/gemini';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [history, setHistory] = useState<BusinessLead[]>([]);
  const [stats, setStats] = useState<ScrapingStats>({
    totalLeads: 0,
    emailsSent: 0,
    lastRun: null,
  });
  const [apiKeyValid, setApiKeyValid] = useState(true);

  useEffect(() => {
    // Check API Key existence on mount
    if (!hasApiKey()) {
      setApiKeyValid(false);
    }

    // Load from local storage
    const savedHistory = localStorage.getItem('localLeadHistory');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setHistory(parsed);
        
        // Recalculate stats
        const sent = parsed.filter((l: BusinessLead) => l.status === 'CONTACTED').length;
        setStats({
          totalLeads: parsed.length,
          emailsSent: sent,
          lastRun: parsed.length > 0 ? parsed[parsed.length - 1].foundAt : null
        });
      } catch (e) {
        console.error("Failed to parse history");
      }
    }
  }, []);

  const handleLeadsFound = (newContactedLeads: BusinessLead[]) => {
    // Filter out duplicates based on ID
    const updatedHistory = [...history];
    
    newContactedLeads.forEach(lead => {
        const exists = updatedHistory.find(h => h.id === lead.id);
        if(!exists) {
            updatedHistory.push(lead);
        } else {
            // update status
            const index = updatedHistory.findIndex(h => h.id === lead.id);
            updatedHistory[index] = lead;
        }
    });

    // Sort by date desc
    updatedHistory.sort((a, b) => new Date(b.foundAt).getTime() - new Date(a.foundAt).getTime());

    setHistory(updatedHistory);
    localStorage.setItem('localLeadHistory', JSON.stringify(updatedHistory));

    const sent = updatedHistory.filter(l => l.status === 'CONTACTED').length;
    setStats({
        totalLeads: updatedHistory.length,
        emailsSent: sent,
        lastRun: new Date().toISOString()
    });
  };

  if (!apiKeyValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Configuration Error</h2>
            <p className="mt-2 text-sm text-gray-600">
                The environment variable <code>API_KEY</code> is missing. 
                Please restart the container or environment with a valid Google GenAI API Key.
            </p>
        </div>
      </div>
    );
  }

  return (
    <Layout currentView={currentView} setView={setCurrentView}>
      {currentView === AppView.DASHBOARD && (
        <Dashboard stats={stats} onNavigate={setCurrentView} />
      )}
      {currentView === AppView.FINDER && (
        <LeadFinder 
          onLeadsFound={handleLeadsFound} 
          totalEmailsSent={stats.emailsSent}
        />
      )}
      {currentView === AppView.HISTORY && (
        <History history={history} />
      )}
    </Layout>
  );
};

export default App;