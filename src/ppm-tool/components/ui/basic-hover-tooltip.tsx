import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cn } from "@/ppm-tool/shared/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => {
  // SSR Protection: Only render Portal on client-side to prevent hydration mismatches
  if (typeof window === 'undefined') {
    return null;
  }

  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          "z-[1000] overflow-hidden rounded-md bg-gray-800 text-white px-3 py-1.5 text-xs animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 shadow-xl",
          className
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
})
TooltipContent.displayName = TooltipPrimitive.Content.displayName

interface BasicHoverTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  className?: string;
  forceOpen?: boolean; // New prop for external control
}

/**
 * Basic hover tooltip with no device detection - just pure hover behavior
 * Now supports external control via forceOpen prop
 */
export const BasicHoverTooltip: React.FC<BasicHoverTooltipProps> = ({
  content,
  children,
  side = 'top',
  align = 'center',
  className = '',
  forceOpen = false
}) => {
  const [internalOpen, setInternalOpen] = React.useState(false);

  // When forceOpen is true, use that; otherwise use internal hover state
  const effectiveOpen = forceOpen || internalOpen;

  return (
    <TooltipProvider delayDuration={200} skipDelayDuration={100}>
      <Tooltip 
        open={effectiveOpen}
        onOpenChange={forceOpen ? undefined : setInternalOpen}
      >
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side={side} align={align} className={className}>
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
