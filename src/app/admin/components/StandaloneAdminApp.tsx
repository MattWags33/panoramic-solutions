'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/ppm-tool/shared/hooks/useAuth';
import { AdminLogin } from './AdminLogin';

// Import types from PPM tool
import { Tool, Criterion } from '@/ppm-tool/shared/types';

// Import components from PPM tool
import { ToolsList } from '@/ppm-tool/features/admin/ToolsList';
import { EditToolForm } from '@/ppm-tool/features/admin/EditToolForm';
import { AdminToolForm } from '@/ppm-tool/features/admin/AdminToolForm';

export const StandaloneAdminApp: React.FC = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingTool, setIsAddingTool] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { user, isAdmin, loading, signOut } = useAuth();
  
  // Prevent hydration mismatches
  useEffect(() => {
    setIsClient(true);
  }, []);

  const debugAdminAuth = async () => {
    try {
      if (!supabase) {
        console.warn('⚠️ Supabase client not available for debug');
        return;
      }
      
      const { data, error } = await supabase.rpc('debug_admin_status');
      
      if (error) {
        console.error('❌ Debug admin status error:', error);
      } else {
        console.log('🔍 Admin authentication debug info:', data);
      }
    } catch (err) {
      console.error('❌ Failed to debug admin status:', err);
    }
  };

  const fetchTools = useCallback(async () => {
    try {
      if (!isLoading) {
        console.log('🔄 Refreshing tools data...');
      }
      setError(null);
      
      // Use admin_tools_view to get all tools regardless of status
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      const { data, error } = await supabase
        .from('admin_tools_view')
        .select('*')
        .order('created_on', { ascending: false });
        
      if (error) throw error;
      
      if (data) {
        console.log('📊 Fetched tools from database:', data.length, 'tools');
        console.log('📋 Sample tool data (first tool):', data[0]);

        const normalizeCriteria = (criteria: any): any[] => {
          if (!Array.isArray(criteria)) return [];
          return criteria.map((c: any) => ({
            id: c?.criteria_id || c?.id || c?.criterion_id || '',
            name: c?.name || c?.criteria_name || c?.criterion_name || 'Unnamed Criterion',
            ranking: (c?.ranking ?? c?.rank ?? c?.rating ?? 0) as number,
            description: c?.description ?? c?.criteria_description ?? ''
          }));
        };

        const normalizeTags = (tags: any, fallbackType?: string): any[] => {
          if (Array.isArray(tags)) {
            return tags.map((t: any) => {
              if (typeof t === 'string') {
                return { id: '', name: t, type: fallbackType || '' };
              }
              return {
                id: t?.id || '',
                name: t?.name || '',
                type: t?.type || t?.tag_type || t?.tag_type_name || ''
              };
            });
          }
          // Some views may expose tag_names as an array of strings
          if (Array.isArray((tags as any)?.tag_names)) {
            return (tags as any).tag_names.map((n: string) => ({ id: '', name: n, type: '' }));
          }
          return [];
        };

        const normalizedTools = (data as any[]).map((t: any) => {
          const normalized = {
            ...t,
            criteria: normalizeCriteria(t.criteria),
            tags: normalizeTags(t.tags),
            updated_at: t.updated_at || t.submitted_at || t.approved_at || t.created_on
          } as any;
          return normalized;
        });

        setTools(normalizedTools as Tool[]);
      }
    } catch (err: unknown) {
      console.error('Error fetching tools:', err);
      setError(`Failed to load tools: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);
  
  useEffect(() => {
    if (user) {
      fetchTools();
      fetchCriteria();
      debugAdminAuth();
    }
  }, [user, fetchTools]);

  const fetchCriteria = async () => {
    try {
      if (!supabase) {
        throw new Error('Supabase client not configured');
      }
      
      const { data, error } = await supabase
        .from('criteria')
        .select('*')
        .order('name');
        
      if (error) throw error;
      
      if (data) {
        // Transform database criteria to match Criterion type
        const formattedCriteria: Criterion[] = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description || 'No description available',
          userRating: 3,
          ratingDescriptions: {
            low: 'Basic functionality',
            high: 'Advanced features'
          }
        }));
        
        setCriteria(formattedCriteria);
      }
    } catch (err: unknown) {
      console.error('Error fetching criteria:', err);
      setError(`Failed to load criteria: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };
  
  const handleEditTool = async (tool: Tool) => {
    try {
      setIsEditing(true);
      setIsAddingTool(false);
      // Fetch freshest version from DB to avoid stale tags/criteria
      if (!supabase) {
        setSelectedTool(tool);
        return;
      }
      const { data, error } = await supabase
        .from('admin_tools_view')
        .select('*')
        .eq('id', tool.id)
        .maybeSingle();
      if (error || !data) {
        console.warn('⚠️ Could not refetch tool by id, using in-memory copy:', error);
        setSelectedTool(tool);
        return;
      }
      setSelectedTool(data as unknown as Tool);
    } catch (e) {
      console.warn('⚠️ Error refetching tool for edit:', e);
      setSelectedTool(tool);
    }
  };
  
  const handleAddNewTool = () => {
    setIsAddingTool(true);
    setIsEditing(false);
    setSelectedTool(null);
  };

  const handleDeleteTool = async (toolId: string) => {
    if (!confirm('Are you sure you want to delete this tool? This action cannot be undone.')) {
      return;
    }
    
    try {
      setError(null);
      setIsUpdating(true);
      
      if (!supabase) {
        throw new Error('Supabase client not configured');
      }
      
      const { error } = await supabase
        .from('tools')
        .delete()
        .eq('id', toolId);
        
      if (error) throw error;
      
      // Refresh data immediately
      await fetchTools();
    } catch (err: unknown) {
      console.error('Error deleting tool:', err);
      setError(`Failed to delete tool: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleApproveRejectTool = async (toolId: string, status: 'approved' | 'rejected' | 'submitted') => {
    try {
      setError(null);
      setIsUpdating(true);
      
      if (!supabase) {
        throw new Error('Supabase client not configured');
      }
      
      console.log('🔧 Admin attempting to update tool status:', { toolId, status });
      
      // Prefer RPC to encapsulate business logic in the DB
      const { data, error } = await supabase.rpc('update_tool_status', {
        p_tool_id: toolId,
        p_status: status
      });
      
      if (error) {
        console.error('❌ Admin Database Error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          toolId,
          status
        });
        
        // Provide more specific error messages
        if (error.code === '42P01') {
          throw new Error('Database schema error: Missing table. Please contact your administrator.');
        } else if (error.message?.includes('Only administrators')) {
          throw new Error('Admin permission denied. Please ensure you are signed in as an administrator.');
        } else if (error.message?.includes('Tool not found')) {
          throw new Error('Tool not found. It may have been deleted.');
        } else {
          throw new Error(`Database error: ${error.message || 'Unknown error occurred'}`);
        }
      }
      
      console.log('✅ Admin tool status updated successfully (RPC):', { toolId, status, result: data });
      
      // Refresh tools data immediately to get the updated information with all criteria/tags preserved
      await fetchTools();
    } catch (err: unknown) {
      console.error(`❌ Error updating tool status to ${status}:`, err);
      setError(`Failed to update tool status to ${status}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleApproveAll = async () => {
    try {
      setError(null);
      setIsUpdating(true);
      
      if (!supabase) {
        throw new Error('Supabase client not configured');
      }
      
      const submittedTools = tools.filter(tool => tool.submission_status === 'submitted');
      
      if (submittedTools.length === 0) {
        return;
      }
      
      console.log('🚀 Approving all submitted tools:', submittedTools.length);
      
      // Use direct database updates for all tools
      const now = new Date().toISOString();
      const promises = submittedTools.map(tool => {
        if (!supabase) {
          throw new Error('Supabase client not configured');
        }
        return supabase
          .from('tools')
          .update({
            submission_status: 'approved',
            approved_at: now,
            updated_at: now
          })
          .eq('id', tool.id);
      });
      
      const results = await Promise.all(promises);
      const errors = results.filter(result => result.error).map(result => result.error);
      
      if (errors.length > 0) {
        console.error('Errors approving tools:', errors);
        throw new Error(`Failed to approve ${errors.length} tools`);
      }
      
      console.log('✅ All tools approved successfully');
      
      // Refresh data immediately
      await fetchTools();
    } catch (err: unknown) {
      console.error('Error approving all tools:', err);
      setError(`Failed to approve all tools: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Prevent hydration mismatches by not rendering until client-side
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login form if no user is authenticated
  if (!user) {
    return <AdminLogin />;
  }

  // Show access denied if user is not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-white rounded-lg shadow-lg p-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You are signed in as <strong>{user.email}</strong>, but you don&apos;t have admin permissions.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Please contact your administrator to request access.
          </p>
          <div className="space-y-3">
            <button
              onClick={signOut}
              className="flex items-center justify-center w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </button>
            <button
              onClick={() => window.location.href = 'https://panoramic-solutions.com'}
              className="block w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Back to Main Site
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Header */}
      <div className="admin-header bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                Panoramic Solutions - Admin Dashboard
              </h1>
              {isUpdating && (
                <div className="flex items-center space-x-2 text-sm text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  <span>Updating...</span>
                </div>
              )}
            </div>
            
            {/* User Menu Only */}
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">{user.email}</span>
              <button
                onClick={signOut}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {isAddingTool && (
          <AdminToolForm 
            onClose={() => setIsAddingTool(false)}
            onSuccess={async () => {
              setIsAddingTool(false);
              // small delay to allow view to reflect new joins
              await new Promise(r => setTimeout(r, 250));
              await fetchTools();
            }}
            selectedCriteria={criteria}
          />
        )}
        
        {isEditing && selectedTool ? (
          <EditToolForm 
            tool={selectedTool}
            onClose={() => {
              setIsEditing(false);
              setSelectedTool(null);
            }}
            onSuccess={async () => {
              setIsEditing(false);
              setSelectedTool(null);
              // small delay to ensure the view reflects updates
              await new Promise(r => setTimeout(r, 200));
              await fetchTools();
            }}
          />
        ) : (
          !isAddingTool && (
            <ToolsList 
              tools={tools} 
              isLoading={isLoading || isUpdating}
              onEdit={handleEditTool}
              onDelete={handleDeleteTool}
              onApproveReject={handleApproveRejectTool}
              onApproveAll={handleApproveAll}
              onAddNewTool={handleAddNewTool}
            />
          )
        )}
      </div>
    </div>
  );
};