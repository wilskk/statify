import { ModalType } from '@/types/modalTypes';

// Main exports from TransformRegistry
export { 
  TRANSFORM_MODAL_COMPONENTS,
  TRANSFORM_MODAL_CONTAINER_PREFERENCES,
  getTransformModalComponent,
  isTransformModal
} from './TransformRegistry';

// Export transform modal components for direct usage
export { default as ComputeVariableModal } from './ComputeVariableModal';
export { RecodeSameVariablesModal } from './recodeSameVariables';

// Export RecodeSameVariables components and types
export { isRecodeSameVariablesModalType } from './recodeSameVariables'; 