'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Tool, Criterion } from '@/ppm-tool/shared/types';
import { Settings, X, Award, ArrowRight } from 'lucide-react';
import { useClickOutside } from '@/ppm-tool/shared/hooks/useClickOutside';
import { FilterSystem, FilterCondition } from '@/ppm-tool/components/filters/FilterSystem';
import { EnhancedCompactToolCard } from '@/ppm-tool/components/cards/EnhancedCompactToolCard';
import { RemovedToolsMenu } from './RemovedToolsMenu';
import { filterTools } from '@/ppm-tool/shared/utils/filterTools';
import { testGetToolRating, calculateScore } from '@/ppm-tool/shared/utils/toolRating';
import { useMobileDetection } from '@/ppm-tool/shared/hooks/useMobileDetection';
// REMOVED: FullscreenNavigation - no longer needed without FullscreenContext
import { ToolCompareAnimation } from '@/ppm-tool/components/animations/ToolCompareAnimation';
import { useShuffleAnimation, useToolOrderShuffle } from '@/ppm-tool/hooks/useShuffleAnimation';
import { ShuffleContainer } from '@/ppm-tool/components/animations/ShuffleContainer';
import { AnimatedToolCard } from '@/ppm-tool/components/animations/AnimatedToolCard';
import { checkAndTrackNewActive } from '@/lib/posthog';
import { hasCriteriaBeenAdjusted } from '@/ppm-tool/shared/utils/criteriaAdjustmentState';



interface ToolSectionProps {
  tools: Tool[];
  selectedTools: Tool[];
  removedTools: Tool[];
  selectedCriteria: Criterion[];
  filterConditions: FilterCondition[];
  filterMode: 'AND' | 'OR';
  onAddFilterCondition: () => void;
  onRemoveFilterCondition: (id: string) => void;
  onUpdateFilterCondition: (id: string, updates: Partial<FilterCondition>) => void;
  onToggleFilterMode: () => void;
  onToolSelect: (tool: Tool) => void;
  onToolRemove: (toolId: string) => void;
  onRestoreAll: () => void;
  onContinue?: () => void;
  isSubmitting?: boolean;
  onCompare?: (tool: Tool) => void;
  comparedTools?: Set<string>;
  chartButtonPosition?: { x: number; y: number };
  onOpenGuidedRanking?: () => void;
}

// Use the unified calculateScore function
const calculateMatchScore = (tool: Tool, criteria: Criterion[]): number => {
  return calculateScore(tool, criteria);
};

export const ToolSection: React.FC<ToolSectionProps> = ({
  selectedTools,
  removedTools,
  selectedCriteria,
  filterConditions,
  filterMode,
  onAddFilterCondition,
  onRemoveFilterCondition,
  onUpdateFilterCondition,
  onToggleFilterMode,
  onToolSelect,
  onRestoreAll,
  onContinue,
  isSubmitting,
  onCompare,
  comparedTools = new Set(),
  chartButtonPosition,
  onOpenGuidedRanking
}) => {
  const isMobile = useMobileDetection();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [animatingTool, setAnimatingTool] = useState<{ id: string; position: { x: number; y: number } } | null>(null);

  const settingsRef = React.useRef<HTMLDivElement>(null);
  const modalContentRef = React.useRef<HTMLDivElement>(null);
  
  // Initialize shuffle animation
  const shuffleAnimation = useShuffleAnimation({
    delayMs: 500,
    shuffleDurationMs: isMobile ? 800 : 1200,
    disabled: false
  });
  
  const filteredTools = filterTools(selectedTools, filterConditions, filterMode);

  // Debug logging for filtering
  React.useEffect(() => {
    console.debug('ToolSection - Filter conditions:', filterConditions);
    console.debug('ToolSection - Filter mode:', filterMode);
    console.debug('ToolSection - Selected tools count:', selectedTools.length);
    console.debug('ToolSection - Filtered tools count:', filteredTools.length);
    console.debug('ToolSection - Filtered tools:', filteredTools.map(t => t.name));
    
    // Test getToolRating function if we have tools and criteria
    if (selectedTools.length > 0 && selectedCriteria.length > 0) {
      const testTool = selectedTools[0];
      const testCriterion = selectedCriteria[0];
      console.debug('Testing getToolRating:', testGetToolRating(testTool, testCriterion.id));
    }
  }, [filterConditions, filterMode, selectedTools, filteredTools, selectedCriteria]);

  // Check if criteria have been adjusted from defaults (isolated from bumper logic)
  const criteriaAdjusted = hasCriteriaBeenAdjusted(selectedCriteria);

  // Memoize match scores for performance
  const toolMatchScores = React.useMemo(() => {
    const scores = new Map<string, number>();
    filteredTools.forEach(tool => {
      scores.set(tool.id, calculateMatchScore(tool, selectedCriteria));
    });
    return scores;
  }, [filteredTools, selectedCriteria]);

  // Sort tools: alphabetically when criteria not adjusted, by match score when adjusted
  const sortedTools = React.useMemo(() => {
    if (!criteriaAdjusted) {
      // Sort alphabetically when criteria haven't been adjusted
      return [...filteredTools].sort((a, b) => a.name.localeCompare(b.name));
    }
    
    // Sort by match score (highest first) when criteria have been adjusted
    return [...filteredTools].sort((a, b) => {
      const scoreA = toolMatchScores.get(a.id) || 0;
      const scoreB = toolMatchScores.get(b.id) || 0;
      return scoreB - scoreA;
    });
  }, [filteredTools, toolMatchScores, criteriaAdjusted]);

  // Set up tool order shuffle animation - triggers when sortedTools order changes
  useToolOrderShuffle(sortedTools, shuffleAnimation, {
    triggerOnChange: true
  });

  const handleToggleExpand = (toolId: string) => {
    const newExpanded = new Set(expandedCards);
    const wasExpanded = newExpanded.has(toolId);
    const tool = selectedTools.find(t => t.id === toolId);
    
    if (wasExpanded) {
      newExpanded.delete(toolId);
    } else {
      newExpanded.add(toolId);
      
      // Track tool card expansion for New_Active metric (only when expanding, not collapsing)
      try {
        checkAndTrackNewActive('Active-details', {
          component: 'tool_section',
          tool_id: toolId,
          tool_name: tool?.name || 'unknown',
          interaction_type: 'tool_card_expanded'
        });
      } catch (error) {
        console.warn('Failed to track tool card expansion:', error);
      }
    }
    
    setExpandedCards(newExpanded);
  };
  
  const filteredOutTools = React.useMemo(() => {
    return selectedTools.filter(tool => 
      !filterTools([tool], filterConditions, filterMode, true).length
    ); 
  }, [selectedTools, filterConditions, filterMode]);

  useClickOutside(settingsRef, () => {
    handleSettingsClose();
  });

  const handleSettingsClose = () => {
    // Simplify the close logic - just close the modal
    setIsSettingsOpen(false);
    
    // Clean up empty filters after closing
    const cleanedFilters = filterConditions.filter(condition => 
      condition.type && condition.value
    );
    
    if (cleanedFilters.length !== filterConditions.length) {
      const emptyFilterIds = filterConditions
        .filter(condition => !condition.type || !condition.value)
        .map(condition => condition.id);
      
      emptyFilterIds.forEach(id => onRemoveFilterCondition(id));
    }
  };

  const showRemovedToolsMenu = removedTools.length > 0;

  const handleCompare = (tool: Tool, event: React.MouseEvent) => {
    // Check if tool is currently being compared
    const isCurrentlyCompared = comparedTools.has(tool.id);
    
    // Only trigger animation when ADDING a tool to compare (not when removing)
    if (!isCurrentlyCompared) {
      // Get the button's position for the animation
      const button = event.currentTarget;
      const rect = button.getBoundingClientRect();
      
      // Set the animating tool state
      setAnimatingTool({
        id: tool.id,
        position: { x: rect.left, y: rect.top }
      });
    }

    // Call the compare handler
    onCompare?.(tool);
  };

  const handleAnimationComplete = () => {
    setAnimatingTool(null);
  };

  const renderTool = (tool: Tool, index: number) => (
    <AnimatedToolCard
      key={tool.id}
      tool={tool}
      index={index}
      isExpanded={expandedCards.has(tool.id)}
    >
      <EnhancedCompactToolCard
        tool={tool}
        selectedCriteria={selectedCriteria}
        matchScore={toolMatchScores.get(tool.id) || 0}
        isExpanded={expandedCards.has(tool.id)}
        onToggleExpand={() => handleToggleExpand(tool.id)}
        onCompare={(e) => handleCompare(tool, e)}
        isCompared={comparedTools.has(tool.id)}
        criteriaAdjusted={criteriaAdjusted}
        onOpenGuidedRanking={onOpenGuidedRanking}
      />
    </AnimatedToolCard>
  );

  return (
    <div id="tools-section" className="bg-white rounded-lg shadow-none flex flex-col h-full overflow-hidden min-h-0 border border-gray-200">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 md:p-6 pb-3 md:pb-4 border-b bg-white rounded-t-lg">
        <div className="flex items-center">
          <Award className="w-5 h-5 md:w-6 md:h-6 mr-2 text-alpine-blue-400" />
          <div className="flex items-center">
            <h2 className="text-base md:text-lg lg:text-xl font-bold text-gray-900">Tools & Recommendations</h2>
            <span className="hidden md:block ml-2 text-xs md:text-sm text-gray-500">
              {sortedTools.length} {sortedTools.length === 1 ? 'tool' : 'tools'} analyzed
            </span>
          </div>
        </div>

        {/* Control buttons */}
        <div className="flex items-center gap-1 md:gap-2">
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="p-1 md:p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              aria-label="Filter settings"
            >
              <Settings className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            {isSettingsOpen && (
              <div className="absolute right-0 top-full mt-2 w-[calc(100vw-1rem)] max-w-xs sm:max-w-md md:w-80 lg:w-[36rem] bg-white rounded-lg shadow-xl border border-gray-200 z-50 mx-2 md:mx-0 max-h-[80vh]">
                <div className="flex items-center justify-between p-3 md:p-4 border-b">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm md:text-base font-medium text-gray-900 truncate">Tool Settings</h3>
                    <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                      {sortedTools.length} {sortedTools.length === 1 ? 'tool' : 'tools'} visible
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        onRestoreAll();
                        handleSettingsClose();
                      }}
                      className="px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm font-medium text-white bg-alpine-blue-400 hover:bg-alpine-blue-500 rounded-lg transition-colors whitespace-nowrap shadow-sm"
                    >
                      Reset Filters
                    </button>
                    <button
                      onClick={handleSettingsClose}
                      className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0"
                    >
                      <X className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                  </div>
                </div>
                
                <div 
                  ref={modalContentRef}
                  className="p-3 md:p-4 space-y-3 md:space-y-4 border-t border-gray-100 filter-modal-content"
                  style={{
                    maxHeight: '50vh',
                    overflowY: 'scroll'
                  }}
                  data-lenis-prevent
                  onWheel={(e) => {
                    // Allow scroll wheel to work within the modal
                    e.stopPropagation();
                    // Let the default scroll behavior work
                  }}
                >
                  <FilterSystem
                    selectedCriteria={selectedCriteria}
                    conditions={filterConditions}
                    onAddCondition={onAddFilterCondition}
                    onRemoveCondition={onRemoveFilterCondition}
                    onUpdateCondition={onUpdateFilterCondition}
                    filterMode={filterMode}
                    onToggleFilterMode={onToggleFilterMode}
                  />
                  
                  {filterConditions.length > 0 && selectedTools.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-gray-500">
                          {filteredOutTools.length} {filteredOutTools.length === 1 ? 'tool' : 'tools'} filtered out
                          <em> (adjust filters to add back)</em>
                        </span>
                      </div>
                      {filteredOutTools.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {filteredOutTools.map((tool) => (
                            <div
                              key={tool.id}
                              className="group flex items-center space-x-2 px-3 py-1.5 bg-gray-50/50 rounded-lg border border-gray-200 text-gray-500"
                            >
                              <Image
                                src={tool.logo}
                                alt={`${tool.name} logo`}
                                width={24}
                                height={24}
                                className="w-6 h-6 rounded-full object-cover opacity-75"
                              />
                              <span className="text-sm">{tool.name}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">All tools match the current filters</p>
                      )}
                    </div>
                  )}

                  {showRemovedToolsMenu && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-gray-500">
                          {removedTools.length} {removedTools.length === 1 ? 'tool' : 'tools'} removed
                          <button
                            onClick={onRestoreAll}
                            className="ml-2 text-sm text-alpine-blue-400 hover:text-alpine-blue-500"
                          >
                            Add Back All
                          </button>
                        </span>
                      </div>
                      <RemovedToolsMenu
                        removedTools={removedTools}
                        onRestore={onToolSelect}
                        onRestoreAll={onRestoreAll}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {/* REMOVED: FullscreenNavigation - no longer needed */}

          {onContinue && (
            <button
              onClick={onContinue}
              disabled={isSubmitting}
              className={`
                flex items-center px-4 py-2 
                bg-alpine-blue-500 hover:bg-alpine-blue-600 text-white font-medium 
                rounded-lg transition-colors shadow-sm text-sm
                ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}
              `}
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2">Processing</span>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </>
              ) : (
                <>
                  Continue to Chart Analysis
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Sub-header */}
      <div className="flex-shrink-0 border-b bg-gray-50">
        <div className="px-6 py-3 h-[76px] flex items-center">
          <p className="text-sm text-gray-600">
            Explore the best‑fit PPM tools that align with your goals. Picking the right tool now sets the stage for smoother adoption and long‑term success.
          </p>
        </div>
      </div>

      {/* Animation Layer */}
      {animatingTool && (
        <ToolCompareAnimation
          isAnimating={true}
          startPosition={animatingTool.position}
          targetPosition={chartButtonPosition || { x: 0, y: 0 }}
          onComplete={handleAnimationComplete}
        />
      )}

      {/* Results Section */}
      <div className="section-scroll flex-1 min-h-0" data-lenis-prevent>
        <div className="p-6 pb-24">
          {sortedTools.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Award className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tools match your current filters</h3>
              <p className="text-gray-600 mb-4">Try adjusting your filters or criteria to see more results.</p>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="px-4 py-2 bg-alpine-blue-500 text-white rounded-lg hover:bg-alpine-blue-600 transition-colors"
              >
                Adjust Filters
              </button>
            </div>
          ) : (
            <ShuffleContainer
              tools={sortedTools}
              shuffleAnimation={shuffleAnimation}
              className="flex flex-col gap-1"
              isMobile={isMobile}
              enableParticles={true}
            >
              {sortedTools.map((tool, index) => renderTool(tool, index))}
            </ShuffleContainer>
          )}
        </div>
      </div>


    </div>
  );
};