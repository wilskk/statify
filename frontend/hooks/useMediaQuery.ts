import { useState, useEffect } from 'react';

/**
 * useMediaQuery - A custom React hook to detect matching media queries
 * 
 * This hook allows components to respond to media query changes
 * such as screen width breakpoints or orientation changes.
 * 
 * @param query - The media query string to match against (e.g. '(max-width: 768px)')
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Initialize state with null to prevent hydration mismatch
  const [matches, setMatches] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Set mounted to true - this prevents hydration mismatches with SSR
    setMounted(true);

    // Create the media query list
    const mediaQuery = window.matchMedia(query);
    
    // Set initial match value
    setMatches(mediaQuery.matches);

    // Define handler to update match state
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add event listener
    mediaQuery.addEventListener('change', handler);
    
    // Clean up the media query listener
    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, [query]);

  // Return false during SSR, and actual value after mounting
  return mounted ? matches : false;
}

export default useMediaQuery; 