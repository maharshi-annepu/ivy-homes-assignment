import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ListingsView from './components/ListingsView';
import RentalsView from './components/RentalsView';
import ProjectsView from './components/ProjectsView';
import SavedView from './components/SavedView';
import InsightsView from './components/InsightsView';
import ListingDetailModal from './components/ListingDetailModal';
import LoginModal from './components/LoginModal';

import initialListings from './data/listings.json';
import initialRentals from './data/rentals.json';
import initialProjects from './data/projects.json';

export default function App() {
  const [activeTab, setActiveTab] = useState('listings');
  const [selectedListing, setSelectedListing] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Check URL hash on mount for deep linking to listing (Requirement #3: A page per listing, reachable by URL)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#listing-')) {
        const id = hash.replace('#listing-', '');
        const found = initialListings.find((l) => l.listing_id === id);
        if (found) {
          setSelectedListing(found);
        }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <main className="main-content">
        {activeTab === 'listings' && (
          <ListingsView
            listings={initialListings}
            onSelectListing={(listing) => setSelectedListing(listing)}
          />
        )}

        {activeTab === 'rentals' && (
          <RentalsView rentals={initialRentals} />
        )}

        {activeTab === 'projects' && (
          <ProjectsView projects={initialProjects} />
        )}

        {activeTab === 'saved' && (
          <SavedView
            onSelectListing={(listing) => setSelectedListing(listing)}
            onBrowse={() => setActiveTab('listings')}
          />
        )}

        {activeTab === 'insights' && (
          <InsightsView
            listings={initialListings}
            rentals={initialRentals}
            projects={initialProjects}
          />
        )}
      </main>

      {/* Listing Detail Modal */}
      {selectedListing && (
        <ListingDetailModal
          listing={selectedListing}
          allListings={initialListings}
          onClose={() => setSelectedListing(null)}
          onSelectListing={(newListing) => setSelectedListing(newListing)}
        />
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  );
}
