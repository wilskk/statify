/**
 * Descriptive Analytics Modal Integration
 * 
 * This file documents the integration of Descriptive Analytics modal components
 * with the centralized modal architecture.
 * 
 * Components Flow:
 * ModalRegistry -> Descriptives -> (DescriptiveContent -> {VariablesTab, StatisticsTab})
 * 
 * Key Integration Points:
 * 
 * 1. Modal Registration:
 *    - Added descriptive modal types to ModalType enum in modalTypes.ts
 *    - Created DESCRIPTIVE_MODAL_COMPONENTS registry in ModalRegistry.tsx
 *    - Added container preferences in MODAL_CONTAINER_PREFERENCES
 * 
 * 2. Component Architecture:
 *    - Updated Descriptives component to use BaseModalProps
 *    - Ensured StatisticsTab and VariablesTab properly typed and exported interfaces
 *    - Created proper index.ts exports for easy component consumption
 * 
 * 3. Type Integration:
 *    - Updated DescriptivesAnalysisProps to extend from BaseModalProps
 *    - Ensured all types are properly exported from central types.ts
 * 
 * 4. Hook Integration:
 *    - useVariableSelection, useStatisticsSettings, etc. properly typed
 *    - All hooks properly exported through index.ts
 * 
 * The integration follows the "direct registration" pattern established in previous
 * refactoring work, where we removed redundant router components (like EditModals.tsx
 * and FileModals.tsx) and registered components directly in the ModalRegistry.
 * 
 * The centralized ModalRegistry now directly imports the Descriptives component
 * through lazy loading, improving code organization and reducing complexity.
 */ 