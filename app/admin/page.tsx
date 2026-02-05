'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUserClient, signOutClient } from '@/lib/auth/client';
import { 
  Users, 
  FileText, 
  Activity, 
  AlertTriangle, 
  Ban, 
  CheckCircle, 
  XCircle, 
  Search,
  Download,
  RefreshCw,
  Settings,
  TrendingUp,
  CreditCard,
  Shield,
  LogOut,
  Eye,
  Trash2,
  Edit2,
  Save,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type TabType = 'dashboard' | 'users' | 'audits' | 'api-usage' | 'errors';

export default function AdminPanel() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  const [apiUsage, setApiUsage] = useState<any>(null);
  const [errorLogs, setErrorLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin, activeTab, currentPage]);

  const checkAdminAccess = async () => {
    try {
      const user = await getCurrentUserClient();
      
      if (!user) {
        console.log('No user found, redirecting to admin login');
        // Wait a bit before redirecting to show loading state
        setTimeout(() => {
          router.push('/admin/login');
        }, 100);
        return;
      }

      // Fetch user data with is_admin from the API
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (!response.ok) {
        console.log('Failed to fetch user data, redirecting to admin login');
        setTimeout(() => {
          router.push('/admin/login');
        }, 100);
        return;
      }

      const data = await response.json();
      const userData = data.user;

      if (!userData || !userData.is_admin) {
        console.log('User is not an admin, redirecting to dashboard');
        // Wait a bit before redirecting
        setTimeout(() => {
          router.push('/audit/dashboard');
        }, 100);
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('Error checking admin access:', error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      if (activeTab === 'dashboard') {
        const response = await fetch('/api/admin/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } else if (activeTab === 'users') {
        const response = await fetch(`/api/admin/users?page=${currentPage}&limit=50&search=${searchTerm}`);
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users || []);
        }
      } else if (activeTab === 'audits') {
        const response = await fetch(`/api/admin/audits?page=${currentPage}&limit=50`);
        if (response.ok) {
          const data = await response.json();
          setAudits(data.audits || []);
        }
      } else if (activeTab === 'api-usage') {
        const response = await fetch('/api/admin/api-usage?days=30');
        if (response.ok) {
          const data = await response.json();
          setApiUsage(data);
        }
      } else if (activeTab === 'errors') {
        const response = await fetch(`/api/admin/error-logs?page=${currentPage}&limit=50`);
        if (response.ok) {
          const data = await response.json();
          setErrorLogs(data.logs || []);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleBanUser = async (userId: string, reason: string) => {
    if (!confirm(`Are you sure you want to ban this user? Reason: ${reason || 'No reason provided'}`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'ban',
          reason,
        }),
      });

      if (response.ok) {
        loadData();
      } else {
        alert('Failed to ban user');
      }
    } catch (error) {
      console.error('Error banning user:', error);
      alert('Error banning user');
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'unban',
        }),
      });

      if (response.ok) {
        loadData();
      } else {
        alert('Failed to unban user');
      }
    } catch (error) {
      console.error('Error unbanning user:', error);
      alert('Error unbanning user');
    }
  };

  const handleUpdateUser = async (userId: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'update',
          ...editForm,
        }),
      });

      if (response.ok) {
        setEditingUser(null);
        setEditForm({});
        loadData();
      } else {
        alert('Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user');
    }
  };

  const handleResolveError = async (logId: string, resolved: boolean) => {
    try {
      const response = await fetch('/api/admin/error-logs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logId,
          resolved,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Reload data to show updated status
        await loadData();
      } else {
        console.error('Failed to resolve error:', data);
        alert(`Failed to update error log: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating error log:', error);
      alert('Error updating error log status. Please check the console for details.');
    }
  };

  const handleDeleteAudit = async (auditId: string) => {
    if (!confirm('Are you sure you want to delete this audit?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/audits?id=${auditId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadData();
      } else {
        alert('Failed to delete audit');
      }
    } catch (error) {
      console.error('Error deleting audit:', error);
      alert('Error deleting audit');
    }
  };

  const handleSignOut = async () => {
    await signOutClient();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-[#101010] via-[#181818] to-[#232323] flex items-center justify-center">
        <div className="text-center">
          <div className="text-yellow-400 text-xl mb-4">Loading admin panel...</div>
          <div className="text-[#C0C0C0] text-sm">Checking admin access...</div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-[#101010] via-[#181818] to-[#232323] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Shield className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-yellow-400 mb-2">Admin Access Required</h1>
          <p className="text-[#C0C0C0] mb-4">
            You need administrator privileges to access this page.
          </p>
          <div className="space-y-2">
            <Button
              onClick={() => router.push('/audit/dashboard')}
              className="bg-yellow-400 text-black hover:bg-yellow-500 mr-2"
            >
              Go to Dashboard
            </Button>
            <Button
              onClick={() => router.push('/sign-in')}
              variant="outline"
              className="border-yellow-400/50 text-yellow-400"
            >
              Sign In
            </Button>
            <div className="text-xs text-[#C0C0C0] mt-4 p-3 bg-black/50 rounded">
              <p className="mb-2">To get admin access, run this SQL in Supabase:</p>
              <pre className="text-left text-xs overflow-x-auto p-2 bg-black rounded">
{`UPDATE public.users 
SET is_admin = TRUE 
WHERE email = 'your-email@example.com';`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#101010] via-[#181818] to-[#232323]">
      {/* Header */}
      <header className="bg-black/80 border-b border-yellow-400/20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Shield className="h-8 w-8 text-yellow-400" />
          <div>
            <h1 className="text-2xl font-bold hero-gradient-text">Admin Panel</h1>
            <p className="text-sm text-[#C0C0C0]">SEOInForce Administration</p>
          </div>
        </div>
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-black/50 border-r border-yellow-400/20 min-h-screen p-4">
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                activeTab === 'dashboard'
                  ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30'
                  : 'text-[#C0C0C0] hover:bg-black/50'
              }`}
            >
              <TrendingUp className="h-5 w-5" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                activeTab === 'users'
                  ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30'
                  : 'text-[#C0C0C0] hover:bg-black/50'
              }`}
            >
              <Users className="h-5 w-5" />
              Users
            </button>
            <button
              onClick={() => setActiveTab('audits')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                activeTab === 'audits'
                  ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30'
                  : 'text-[#C0C0C0] hover:bg-black/50'
              }`}
            >
              <FileText className="h-5 w-5" />
              Audits
            </button>
            <button
              onClick={() => setActiveTab('api-usage')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                activeTab === 'api-usage'
                  ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30'
                  : 'text-[#C0C0C0] hover:bg-black/50'
              }`}
            >
              <Activity className="h-5 w-5" />
              API Usage
            </button>
            <button
              onClick={() => setActiveTab('errors')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                activeTab === 'errors'
                  ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30'
                  : 'text-[#C0C0C0] hover:bg-black/50'
              }`}
            >
              <AlertTriangle className="h-5 w-5" />
              Error Logs
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeTab === 'dashboard' && stats && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold hero-gradient-text">Dashboard Overview</h2>
                <Button onClick={loadData} variant="outline" className="border-yellow-400/50 text-yellow-400">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-black/90 via-[#181818]/95 to-black/90 border-2 border-yellow-400/30 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="h-6 w-6 text-yellow-400" />
                    <span className="text-xs text-[#C0C0C0]">Total Users</span>
                  </div>
                  <div className="text-3xl font-bold text-yellow-400">{stats.users?.total || 0}</div>
                  <div className="text-sm text-[#C0C0C0] mt-1">
                    {stats.users?.banned || 0} banned, {stats.users?.active || 0} active
                  </div>
                </div>

                <div className="bg-gradient-to-br from-black/90 via-[#181818]/95 to-black/90 border-2 border-yellow-400/30 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <FileText className="h-6 w-6 text-yellow-400" />
                    <span className="text-xs text-[#C0C0C0]">Total Audits</span>
                  </div>
                  <div className="text-3xl font-bold text-yellow-400">{stats.audits?.total || 0}</div>
                  <div className="text-sm text-[#C0C0C0] mt-1">
                    {stats.audits?.completed || 0} completed
                  </div>
                </div>

                <div className="bg-gradient-to-br from-black/90 via-[#181818]/95 to-black/90 border-2 border-yellow-400/30 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Activity className="h-6 w-6 text-yellow-400" />
                    <span className="text-xs text-[#C0C0C0]">API Credits (30d)</span>
                  </div>
                  <div className="text-3xl font-bold text-yellow-400">
                    {stats.apiUsage?.totalCreditsUsedLast30Days?.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-[#C0C0C0] mt-1">
                    {stats.apiUsage?.totalRequestsLast30Days || 0} requests
                  </div>
                </div>

                <div className="bg-gradient-to-br from-black/90 via-[#181818]/95 to-black/90 border-2 border-yellow-400/30 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <AlertTriangle className="h-6 w-6 text-yellow-400" />
                    <span className="text-xs text-[#C0C0C0]">Error Logs</span>
                  </div>
                  <div className="text-3xl font-bold text-yellow-400">{stats.errors?.total || 0}</div>
                  <div className="text-sm text-[#C0C0C0] mt-1">
                    {stats.errors?.unresolved || 0} unresolved
                  </div>
                </div>
              </div>

              {/* Subscription Breakdown */}
              <div className="bg-gradient-to-br from-black/90 via-[#181818]/95 to-black/90 border-2 border-yellow-400/30 rounded-xl p-6">
                <h3 className="text-xl font-bold text-yellow-400 mb-4">Subscription Breakdown</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#C0C0C0]">{stats.users?.subscriptionCounts?.free || 0}</div>
                    <div className="text-sm text-[#C0C0C0]">Free</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{stats.users?.subscriptionCounts?.starter || 0}</div>
                    <div className="text-sm text-[#C0C0C0]">Starter (£49/mo)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{stats.users?.subscriptionCounts?.growth || 0}</div>
                    <div className="text-sm text-[#C0C0C0]">Growth (£249/mo)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{stats.users?.subscriptionCounts?.empire || 0}</div>
                    <div className="text-sm text-[#C0C0C0]">Empire (£499/mo)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{stats.users?.subscriptionCounts?.brand || 0}</div>
                    <div className="text-sm text-[#C0C0C0]">Brand (£99/mo)</div>
                  </div>
                </div>
                {stats.users?.accountTypeCounts && (
                  <div className="mt-6 pt-6 border-t border-yellow-400/20">
                    <h4 className="text-sm font-semibold text-yellow-400 mb-3">Account Types</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-xl font-bold text-[#C0C0C0]">{stats.users.accountTypeCounts.personal || 0}</div>
                        <div className="text-xs text-[#C0C0C0]">Personal</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-yellow-400">{stats.users.accountTypeCounts.brand || 0}</div>
                        <div className="text-xs text-[#C0C0C0]">Brand</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Subscriptions */}
              {stats.recentSubscriptions && stats.recentSubscriptions.length > 0 && (
                <div className="bg-gradient-to-br from-black/90 via-[#181818]/95 to-black/90 border-2 border-yellow-400/30 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-yellow-400 mb-4">Recent Subscriptions (Last 30 Days)</h3>
                  <div className="space-y-2">
                    {stats.recentSubscriptions.map((sub: any) => (
                      <div key={sub.id} className="flex items-center justify-between p-3 bg-black/50 rounded-lg">
                        <div>
                          <div className="font-semibold text-white">{sub.full_name || sub.email}</div>
                          <div className="text-sm text-[#C0C0C0]">{sub.email}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-yellow-400 capitalize">{sub.plan_type}</div>
                          <div className="text-xs text-[#C0C0C0]">
                            {new Date(sub.updated_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold hero-gradient-text">User Management</h2>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-black/50 border-yellow-400/30 text-white w-64"
                  />
                  <Button onClick={loadData} variant="outline" className="border-yellow-400/50 text-yellow-400">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-black/90 via-[#181818]/95 to-black/90 border-2 border-yellow-400/30 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-black/50 border-b border-yellow-400/20">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-yellow-400">User</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-yellow-400">Plan</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-yellow-400">API Credits</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-yellow-400">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-yellow-400">Joined</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-yellow-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-yellow-400/10 hover:bg-black/30">
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-semibold text-white">{user.full_name || 'No name'}</div>
                              <div className="text-sm text-[#C0C0C0]">{user.email}</div>
                              {user.account_type === 'brand' && user.brand_name && (
                                <div className="text-xs text-yellow-400 mt-1 flex items-center gap-1">
                                  <Shield className="h-3 w-3" />
                                  Brand: {user.brand_name}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                user.plan_type === 'empire' ? 'bg-purple-500/20 text-purple-400' :
                                user.plan_type === 'growth' ? 'bg-yellow-400/20 text-yellow-400' :
                                user.plan_type === 'starter' ? 'bg-blue-500/20 text-blue-400' :
                                user.plan_type === 'brand' ? 'bg-yellow-400/20 text-yellow-400' :
                                'bg-gray-500/20 text-gray-400'
                              }`}>
                                {user.plan_type?.toUpperCase() || 'FREE'}
                              </span>
                              {user.account_type === 'brand' && (
                                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-yellow-400/10 text-yellow-400/80">
                                  BRAND ACCOUNT
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {editingUser === user.id ? (
                              <Input
                                type="number"
                                value={editForm.api_credits ?? user.api_credits}
                                onChange={(e) => setEditForm({ ...editForm, api_credits: parseInt(e.target.value) })}
                                className="w-24 bg-black/70 border-yellow-400/30 text-white text-sm"
                              />
                            ) : (
                              <span className="text-yellow-400 font-semibold">{user.api_credits || 0}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {user.is_banned ? (
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-red-500/20 text-red-400">
                                BANNED
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-green-500/20 text-green-400">
                                ACTIVE
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-[#C0C0C0]">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {editingUser === user.id ? (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateUser(user.id)}
                                    className="bg-green-500 hover:bg-green-600 h-8 px-2"
                                  >
                                    <Save className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setEditingUser(null);
                                      setEditForm({});
                                    }}
                                    className="bg-gray-500 hover:bg-gray-600 h-8 px-2"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setEditingUser(user.id);
                                      setEditForm({ api_credits: user.api_credits, plan_type: user.plan_type });
                                    }}
                                    variant="outline"
                                    className="border-blue-400/50 text-blue-400 hover:bg-blue-400/10 h-8 px-2"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                  {user.is_banned ? (
                                    <Button
                                      size="sm"
                                      onClick={() => handleUnbanUser(user.id)}
                                      className="bg-green-500 hover:bg-green-600 h-8 px-2"
                                    >
                                      <CheckCircle className="h-3 w-3" />
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        const reason = prompt('Enter ban reason:');
                                        if (reason) handleBanUser(user.id, reason);
                                      }}
                                      className="bg-red-500 hover:bg-red-600 h-8 px-2"
                                    >
                                      <Ban className="h-3 w-3" />
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audits' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold hero-gradient-text">Audit Management</h2>
                <Button onClick={loadData} variant="outline" className="border-yellow-400/50 text-yellow-400">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              <div className="bg-gradient-to-br from-black/90 via-[#181818]/95 to-black/90 border-2 border-yellow-400/30 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-black/50 border-b border-yellow-400/20">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-yellow-400">Domain</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-yellow-400">User</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-yellow-400">Score</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-yellow-400">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-yellow-400">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-yellow-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {audits.map((audit) => (
                        <tr key={audit.id} className="border-b border-yellow-400/10 hover:bg-black/30">
                          <td className="px-4 py-3 font-semibold text-white">{audit.domain}</td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-[#C0C0C0]">
                              {audit.projects?.users?.email || 'N/A'}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-yellow-400 font-bold">{audit.overall_score || 0}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              audit.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                              audit.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400' :
                              audit.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {audit.status?.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-[#C0C0C0]">
                            {new Date(audit.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              size="sm"
                              onClick={() => handleDeleteAudit(audit.id)}
                              className="bg-red-500 hover:bg-red-600 h-8 px-2"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api-usage' && apiUsage && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold hero-gradient-text">API Usage (Last 30 Days)</h2>
                <Button onClick={loadData} variant="outline" className="border-yellow-400/50 text-yellow-400">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-black/90 via-[#181818]/95 to-black/90 border-2 border-yellow-400/30 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-yellow-400 mb-4">Total Usage</h3>
                  <div className="text-3xl font-bold text-white mb-2">
                    {apiUsage.statistics?.totalCreditsUsed?.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-[#C0C0C0]">Credits Used</div>
                  <div className="text-2xl font-bold text-yellow-400 mt-4">
                    {apiUsage.statistics?.totalRequests || 0}
                  </div>
                  <div className="text-sm text-[#C0C0C0]">Total Requests</div>
                </div>

                <div className="bg-gradient-to-br from-black/90 via-[#181818]/95 to-black/90 border-2 border-yellow-400/30 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-yellow-400 mb-4">Usage by Type</h3>
                  <div className="space-y-2">
                    {Object.entries(apiUsage.statistics?.usageByType || {}).map(([type, credits]: [string, any]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-[#C0C0C0] capitalize">{type}</span>
                        <span className="text-yellow-400 font-semibold">{credits.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-black/90 via-[#181818]/95 to-black/90 border-2 border-yellow-400/30 rounded-xl p-6">
                <h3 className="text-lg font-bold text-yellow-400 mb-4">Top Users by Usage</h3>
                <div className="space-y-2">
                  {apiUsage.statistics?.usageByUser?.slice(0, 10).map((usage: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-black/50 rounded-lg">
                      <div>
                        <div className="font-semibold text-white">
                          {usage.user?.full_name || usage.user?.email || 'Unknown'}
                        </div>
                        <div className="text-sm text-[#C0C0C0]">{usage.user?.email}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-yellow-400">{usage.totalCredits.toLocaleString()}</div>
                        <div className="text-xs text-[#C0C0C0]">{usage.count} requests</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'errors' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold hero-gradient-text">Error Logs</h2>
                <div className="flex gap-2">
                  <Button 
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/admin/test-error-log', { method: 'POST' });
                        if (response.ok) {
                          alert('Test error log created! Refresh to see it.');
                          loadData();
                        } else {
                          alert('Failed to create test error log');
                        }
                      } catch (error) {
                        console.error('Error creating test log:', error);
                        alert('Failed to create test error log');
                      }
                    }}
                    variant="outline" 
                    className="border-blue-400/50 text-blue-400"
                  >
                    Create Test Log
                  </Button>
                  <Button onClick={loadData} variant="outline" className="border-yellow-400/50 text-yellow-400">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {errorLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`bg-gradient-to-br from-black/90 via-[#181818]/95 to-black/90 border-2 rounded-xl p-6 ${
                      log.severity === 'critical' ? 'border-red-500/50' :
                      log.severity === 'error' ? 'border-red-400/50' :
                      log.severity === 'warning' ? 'border-yellow-400/50' :
                      'border-blue-400/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 rounded text-xs font-semibold ${
                            log.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                            log.severity === 'error' ? 'bg-red-400/20 text-red-300' :
                            log.severity === 'warning' ? 'bg-yellow-400/20 text-yellow-400' :
                            'bg-blue-400/20 text-blue-400'
                          }`}>
                            {log.severity?.toUpperCase()}
                          </span>
                          {log.resolved && (
                            <span className="px-3 py-1 rounded text-xs font-semibold bg-green-500/20 text-green-400">
                              RESOLVED
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-white mb-1">{log.error_type}</div>
                        <div className="text-sm text-[#C0C0C0] mb-2">{log.error_message}</div>
                        {log.endpoint && (
                          <div className="text-xs text-[#C0C0C0] mb-2">Endpoint: {log.endpoint}</div>
                        )}
                        {log.users && (
                          <div className="text-xs text-[#C0C0C0] mb-2">
                            User: {log.users.email}
                          </div>
                        )}
                        <div className="text-xs text-[#C0C0C0]">
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        {!log.resolved ? (
                          <Button
                            size="sm"
                            onClick={() => handleResolveError(log.id, true)}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Resolved
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleResolveError(log.id, false)}
                            variant="outline"
                            className="border-gray-400/50 text-gray-400"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Mark Unresolved
                          </Button>
                        )}
                      </div>
                    </div>
                    {log.error_stack && (
                      <details className="mt-4">
                        <summary className="text-sm text-yellow-400 cursor-pointer">View Stack Trace</summary>
                        <pre className="mt-2 p-4 bg-black/50 rounded text-xs text-[#C0C0C0] overflow-x-auto">
                          {log.error_stack}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
                {errorLogs.length === 0 && (
                  <div className="text-center py-12">
                    <AlertTriangle className="h-12 w-12 text-[#C0C0C0] mx-auto mb-4 opacity-50" />
                    <p className="text-[#C0C0C0] text-lg mb-2">No error logs found</p>
                    <p className="text-[#C0C0C0] text-sm mb-4">
                      Error logs will appear here when errors occur in the system.
                    </p>
                    <Button 
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/admin/test-error-log', { method: 'POST' });
                          if (response.ok) {
                            alert('Test error log created! Refresh to see it.');
                            loadData();
                          } else {
                            const data = await response.json();
                            alert(`Failed to create test error log: ${data.error || 'Unknown error'}`);
                          }
                        } catch (error) {
                          console.error('Error creating test log:', error);
                          alert('Failed to create test error log');
                        }
                      }}
                      variant="outline" 
                      className="border-blue-400/50 text-blue-400"
                    >
                      Create Test Error Log
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}