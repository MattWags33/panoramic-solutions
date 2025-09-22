'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, Plus, LogOut, RefreshCw } from 'lucide-react';
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
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddName, setQuickAddName] = useState('');
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
  
  useEffect(() => {
    if (user) {
      fetchTools();
      fetchCriteria();
      debugAdminAuth();
    }
  }, [user]);

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

  const fetchTools = async () => {
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
        
        // Find Asana specifically for debugging
        const asanaData = data.find((tool: any) => tool.name === 'Asana');
        if (asanaData) {
          console.log('🎯 Asana data from database:', {
            name: asanaData.name,
            status: asanaData.submission_status,
            criteriaCount: asanaData.criteria?.length || 0,
            tagsCount: asanaData.tags?.length || 0,
            hasData: !!(asanaData.criteria && asanaData.tags)
          });
        }
        
        // Add updated_at field if it doesn't exist
        const toolsWithUpdated = data.map((tool: Tool) => ({
          ...tool,
          updated_at: tool.updated_at || tool.submitted_at || tool.approved_at || tool.created_on
        }));
        
        setTools(toolsWithUpdated as Tool[]);
      }
    } catch (err: unknown) {
      console.error('Error fetching tools:', err);
      setError(`Failed to load tools: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
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
  
  const handleEditTool = (tool: Tool) => {
    setSelectedTool(tool);
    setIsEditing(true);
    setIsAddingTool(false);
  };
  
  const handleAddNewTool = () => {
    setIsAddingTool(true);
    setIsEditing(false);
    setSelectedTool(null);
  };

  const handleQuickAddTool = async () => {
    if (!quickAddName.trim()) {
      setError('Please enter a tool name');
      return;
    }

    try {
      setError(null);
      setIsUpdating(true);
      
      if (!supabase) {
        throw new Error('Supabase client not configured');
      }
      
      console.log('🚀 Quick adding tool:', quickAddName);
      
      const { data, error } = await supabase.rpc('simple_create_tool', {
        p_name: quickAddName.trim(),
        p_type: 'application'
      });
      
      if (error) {
        console.error('❌ Quick add error:', error);
        throw error;
      }
      
      console.log('✅ Tool quick added:', data);
      
      // Reset form
      setQuickAddName('');
      setShowQuickAdd(false);
      
      // Refresh from database immediately
      await fetchTools();
    } catch (err: unknown) {
      console.error('❌ Failed to quick add tool:', err);
      setError(`Failed to add tool: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
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
  
  const handleApproveRejectTool = async (toolId: string, status: 'approved' | 'rejected') => {
    try {
      setError(null);
      setIsUpdating(true);
      
      if (!supabase) {
        throw new Error('Supabase client not configured');
      }
      
      console.log('🔧 Admin attempting to update tool status:', { toolId, status });
      
      // Use direct database update for reliable operation
      const now = new Date().toISOString();
      let updateData: any = {
        submission_status: status,
        updated_at: now
      };
      
      // Set appropriate timestamps based on status
      if (status === 'approved') {
        updateData.approved_at = now;
      } else if (status === 'rejected') {
        updateData.approved_at = null;
      }
      
      const { data, error } = await supabase
        .from('tools')
        .update(updateData)
        .eq('id', toolId)
        .select();
      
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
      
      console.log('✅ Admin tool status updated successfully:', { toolId, status, result: data });
      
      // Refresh tools data immediately to get the updated information with all criteria/tags preserved
      await fetchTools();
    } catch (err: unknown) {
      console.error(`❌ Error ${status === 'approved' ? 'approving' : 'rejecting'} tool:`, err);
      setError(`Failed to ${status === 'approved' ? 'approve' : 'reject'} tool: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-40">
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
            
            <div className="flex items-center space-x-4">
              {/* Refresh button */}
              <button 
                onClick={() => {
                  console.log('🔄 Manual refresh triggered');
                  fetchTools();
                  fetchCriteria();
                }}
                className="flex items-center px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors shadow-sm"
                title="Refresh data from database"
                disabled={isUpdating}
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${isUpdating ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              {/* Quick Add Tool */}
              {showQuickAdd ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Tool name..."
                    value={quickAddName}
                    onChange={(e) => setQuickAddName(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && handleQuickAddTool()}
                    autoFocus
                    disabled={isUpdating}
                  />
                  <button 
                    onClick={handleQuickAddTool}
                    className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm disabled:opacity-50"
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Adding...' : 'Add'}
                  </button>
                  <button 
                    onClick={() => {
                      setShowQuickAdd(false);
                      setQuickAddName('');
                    }}
                    className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                    disabled={isUpdating}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  {/* Quick Add button */}
                  <button 
                    onClick={() => setShowQuickAdd(true)}
                    className="flex items-center px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-sm text-sm disabled:opacity-50"
                    disabled={isUpdating}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Quick Add
                  </button>
                  
                  {/* Add New Tool button */}
                  <button 
                    onClick={handleAddNewTool}
                    className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm disabled:opacity-50"
                    disabled={isUpdating}
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add New Tool
                  </button>
                </>
              )}
              
              {/* User Menu */}
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
            onSuccess={() => {
              setIsAddingTool(false);
              fetchTools();
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
            onSuccess={() => {
              setIsEditing(false);
              setSelectedTool(null);
              fetchTools();
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
            />
          )
        )}
      </div>
    </div>
  );
};