import { VariableAlign } from '@/types/Variable';

/**
 * Types for DataTable service functions inputs.
 */
export interface InsertRowFn {
  (atIndex: number): void;
}

export interface InsertColumnFn {
  (atIndex: number): void;
}

export interface RemoveRowsFn {
  (rows: number[]): void;
}

export interface RemoveColumnsFn {
  (startCol: number, count: number): void;
}

export interface ApplyAlignmentFn {
  (columns: number[], alignment: VariableAlign): void;
}
