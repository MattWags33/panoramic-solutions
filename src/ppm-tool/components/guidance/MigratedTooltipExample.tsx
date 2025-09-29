/**
 * Migration Example - User-Centric Tooltip Replacement
 * 
 * This shows how to replace the existing device-based tooltip system
 * with the new user-centric guidance system.
 */

import React from 'react';
import { UniversalTooltip, GuidanceSystemProvider } from './UniversalGuidanceSystem';

// ============================================================================
// BEFORE: Device-based tooltip (problematic)
// ============================================================================

/*
// OLD APPROACH - Device-based, environment-coupled
function OldTooltip({ children, content }: { children: React.ReactNode; content: string }) {
  const isTouchDevice = useTouchDevice(); // Environment coupling
  const [isOpen, setIsOpen] = useState(false);
  
  // Device-based trigger logic
  const handleInteraction = () => {
    if (isTouchDevice) {
      setIsOpen(!isOpen); // Touch = click
    }
    // Desktop = hover (handled by CSS)
  };
  
  return (
    <div onTouchStart={handleInteraction}>
      {children}
      {isOpen && <div className="tooltip">{content}</div>}
    </div>
  );
}
*/

// ============================================================================
// AFTER: User-centric tooltip (solution)
// ============================================================================

/**
 * New approach - User-centric, environment-agnostic
 */
function NewTooltip({ children, content, guidanceId }: { 
  children: React.ReactNode; 
  content: string;
  guidanceId: string;
}) {
  return (
    <UniversalTooltip
      guidanceId={guidanceId}
      content={content}
      trigger="user-action" // User-centric trigger
    >
      {children}
    </UniversalTooltip>
  );
}

// ============================================================================
// MIGRATION EXAMPLES
// ============================================================================

/**
 * Example 1: Basic tooltip migration
 */
export function BasicTooltipExample() {
  return (
    <GuidanceSystemProvider>
      <div className="p-4 space-y-4">
        <h2>Migrated Tooltips</h2>
        
        {/* Hover tooltip - adapts to environment */}
        <NewTooltip 
          guidanceId="criteria-help"
          content="This helps you understand the criteria for tool selection"
        >
          <button className="px-4 py-2 bg-blue-500 text-white rounded">
            Criteria Help
          </button>
        </NewTooltip>
        
        {/* Progress-based guidance */}
        <UniversalTooltip
          guidanceId="next-step"
          content="Great progress! Try ranking your criteria next."
          trigger="user-progress"
        >
          <div className="p-4 border border-gray-200 rounded">
            Progress indicator area
          </div>
        </UniversalTooltip>
      </div>
    </GuidanceSystemProvider>
  );
}

/**
 * Example 2: Complex guidance migration
 */
export function ComplexGuidanceExample() {
  return (
    <GuidanceSystemProvider>
      <div className="p-4 space-y-4">
        <h2>Complex Guidance Patterns</h2>
        
        {/* Help-seeking guidance */}
        <UniversalTooltip
          guidanceId="stuck-help"
          content="Need help? This tool helps you compare different options."
          trigger="user-intent"
          variant="popover"
          size="lg"
        >
          <div className="p-8 border-2 border-dashed border-gray-300 rounded text-center">
            Complex interaction area
          </div>
        </UniversalTooltip>
        
        {/* Modal guidance for important information */}
        <UniversalTooltip
          guidanceId="important-info"
          content={
            <div>
              <p className="mb-2">This is important information about your selection.</p>
              <p>It will be shown consistently across all devices and environments.</p>
            </div>
          }
          variant="modal"
          trigger="user-action"
        >
          <button className="px-4 py-2 bg-red-500 text-white rounded">
            Important Info
          </button>
        </UniversalTooltip>
      </div>
    </GuidanceSystemProvider>
  );
}

// ============================================================================
// INTEGRATION HELPER
// ============================================================================

/**
 * Helper to gradually migrate existing tooltips
 */
export function MigrateTooltip({ 
  children, 
  content, 
  guidanceId,
  useNewSystem = true 
}: { 
  children: React.ReactNode; 
  content: string;
  guidanceId: string;
  useNewSystem?: boolean;
}) {
  if (useNewSystem) {
    return (
      <NewTooltip guidanceId={guidanceId} content={content}>
        {children}
      </NewTooltip>
    );
  }
  
  // Fallback to old system during migration
  return (
    <div title={content}>
      {children}
    </div>
  );
}

// ============================================================================
// USAGE EXAMPLES FOR EXISTING COMPONENTS
// ============================================================================

/**
 * How to integrate with existing PPM Tool components
 */
export function PPMToolIntegrationExample() {
  return (
    <GuidanceSystemProvider>
      <div className="ppm-tool-container">
        
        {/* Criteria section with guidance */}
        <div className="criteria-section">
          <UniversalTooltip
            guidanceId="criteria-explanation"
            content="Drag and drop to rank these criteria by importance to your organization"
            trigger="user-progress"
            variant="popover"
          >
            <h3>Rank Your Criteria</h3>
          </UniversalTooltip>
          
          {/* Criteria items would go here */}
        </div>
        
        {/* Tools section with guidance */}
        <div className="tools-section">
          <UniversalTooltip
            guidanceId="tools-explanation"
            content="These tools are ranked based on your criteria preferences"
            trigger="user-action"
          >
            <h3>Recommended Tools</h3>
          </UniversalTooltip>
          
          {/* Tool cards would go here */}
        </div>
        
      </div>
    </GuidanceSystemProvider>
  );
}
