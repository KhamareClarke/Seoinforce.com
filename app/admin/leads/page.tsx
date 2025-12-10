'use client';

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Trash2, Eye, Mail, Phone, Globe, Calendar } from "lucide-react";

interface Lead {
  name: string;
  email: string;
  phone: string;
  domain?: string;
  formType: 'audit' | 'booking';
  timestamp: string;
  userAgent: string;
  referrer: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<'all' | 'audit' | 'booking'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const storedLeads = localStorage.getItem('seoinforce_leads');
    if (storedLeads) {
      setLeads(JSON.parse(storedLeads));
    }
  }, []);

  const filteredLeads = leads.filter(lead => {
    const matchesFilter = filter === 'all' || lead.formType === filter;
    const matchesSearch = searchTerm === '' || 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.domain && lead.domain.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const exportToCSV = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Domain', 'Type', 'Date', 'Referrer'].join(','),
      ...filteredLeads.map(lead => [
        lead.name,
        lead.email,
        lead.phone,
        lead.domain || '',
        lead.formType,
        new Date(lead.timestamp).toLocaleString(),
        lead.referrer
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seoinforce-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearAllLeads = () => {
    if (confirm('Are you sure you want to clear all leads? This action cannot be undone.')) {
      localStorage.removeItem('seoinforce_leads');
      setLeads([]);
    }
  };

  const deleteLead = (index: number) => {
    if (confirm('Are you sure you want to delete this lead?')) {
      const newLeads = leads.filter((_, i) => i !== index);
      setLeads(newLeads);
      localStorage.setItem('seoinforce_leads', JSON.stringify(newLeads));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-black to-[#C0C0C0]/10 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-[#ffd700] to-yellow-400 bg-clip-text text-transparent">
              SEOInForce Leads Dashboard
            </h1>
            <p className="text-[#C0C0C0] mt-2">
              View and manage collected lead information
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={exportToCSV}
              className="bg-yellow-500 text-slate-900 hover:bg-yellow-400"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              onClick={clearAllLeads}
              variant="outline"
              className="border-red-400 text-red-400 hover:bg-red-400/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex gap-2">
            <Button
              onClick={() => setFilter('all')}
              variant={filter === 'all' ? 'default' : 'outline'}
              className={filter === 'all' ? 'bg-yellow-500 text-slate-900' : 'border-yellow-400 text-yellow-400'}
            >
              All ({leads.length})
            </Button>
            <Button
              onClick={() => setFilter('audit')}
              variant={filter === 'audit' ? 'default' : 'outline'}
              className={filter === 'audit' ? 'bg-yellow-500 text-slate-900' : 'border-yellow-400 text-yellow-400'}
            >
              Audits ({leads.filter(l => l.formType === 'audit').length})
            </Button>
            <Button
              onClick={() => setFilter('booking')}
              variant={filter === 'booking' ? 'default' : 'outline'}
              className={filter === 'booking' ? 'bg-yellow-500 text-slate-900' : 'border-yellow-400 text-yellow-400'}
            >
              Bookings ({leads.filter(l => l.formType === 'booking').length})
            </Button>
          </div>
          <input
            type="text"
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-gradient-to-b from-[#0b0b0b] via-[#1a1a1a] to-[#e5e5e5]/10 border border-[#d9d9d9]/30 text-white placeholder:text-[#C0C0C0] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 bg-gradient-to-b from-[#181818] via-[#232323] to-[#e5e5e5]/10 border-2 border-yellow-400/30">
            <div className="text-2xl font-bold text-yellow-400">{leads.length}</div>
            <div className="text-[#C0C0C0] text-sm">Total Leads</div>
          </Card>
          <Card className="p-4 bg-gradient-to-b from-[#181818] via-[#232323] to-[#e5e5e5]/10 border-2 border-yellow-400/30">
            <div className="text-2xl font-bold text-yellow-400">{leads.filter(l => l.formType === 'audit').length}</div>
            <div className="text-[#C0C0C0] text-sm">Audit Requests</div>
          </Card>
          <Card className="p-4 bg-gradient-to-b from-[#181818] via-[#232323] to-[#e5e5e5]/10 border-2 border-yellow-400/30">
            <div className="text-2xl font-bold text-yellow-400">{leads.filter(l => l.formType === 'booking').length}</div>
            <div className="text-[#C0C0C0] text-sm">Consultation Bookings</div>
          </Card>
          <Card className="p-4 bg-gradient-to-b from-[#181818] via-[#232323] to-[#e5e5e5]/10 border-2 border-yellow-400/30">
            <div className="text-2xl font-bold text-yellow-400">
              {leads.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length}
            </div>
            <div className="text-[#C0C0C0] text-sm">Today's Leads</div>
          </Card>
        </div>

        {/* Leads List */}
        <div className="space-y-4">
          {filteredLeads.length === 0 ? (
            <Card className="p-8 text-center bg-gradient-to-b from-[#181818] via-[#232323] to-[#e5e5e5]/10 border-2 border-yellow-400/30">
              <div className="text-[#C0C0C0] text-lg">No leads found</div>
              <div className="text-[#C0C0C0] text-sm mt-2">
                {searchTerm ? 'Try adjusting your search terms' : 'Leads will appear here when users submit forms'}
              </div>
            </Card>
          ) : (
            filteredLeads.map((lead, index) => (
              <Card key={index} className="p-6 bg-gradient-to-b from-[#181818] via-[#232323] to-[#e5e5e5]/10 border-2 border-yellow-400/30">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-white">{lead.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        lead.formType === 'audit' 
                          ? 'bg-blue-500/20 text-blue-400' 
                          : 'bg-green-500/20 text-green-400'
                      }`}>
                        {lead.formType === 'audit' ? 'Audit Request' : 'Consultation Booking'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-[#C0C0C0]">
                        <Mail className="h-4 w-4 text-yellow-400" />
                        <span>{lead.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#C0C0C0]">
                        <Phone className="h-4 w-4 text-yellow-400" />
                        <span>{lead.phone}</span>
                      </div>
                      {lead.domain && (
                        <div className="flex items-center gap-2 text-[#C0C0C0]">
                          <Globe className="h-4 w-4 text-yellow-400" />
                          <span>{lead.domain}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-[#C0C0C0]">
                        <Calendar className="h-4 w-4 text-yellow-400" />
                        <span>{new Date(lead.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    {lead.referrer && (
                      <div className="mt-2 text-xs text-[#C0C0C0]">
                        Referrer: {lead.referrer}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => window.open(`mailto:${lead.email}`, '_blank')}
                      variant="outline"
                      size="sm"
                      className="border-yellow-400 text-yellow-400 hover:bg-yellow-400/10"
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => window.open(`tel:${lead.phone}`, '_blank')}
                      variant="outline"
                      size="sm"
                      className="border-yellow-400 text-yellow-400 hover:bg-yellow-400/10"
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => deleteLead(index)}
                      variant="outline"
                      size="sm"
                      className="border-red-400 text-red-400 hover:bg-red-400/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
