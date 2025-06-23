import { mapSPSSTypeToInterface } from '../openSavFileUtils';
import { VariableType } from '@/types/Variable';

describe('mapSPSSTypeToInterface utility', () => {

  it('should map standard numeric types correctly', () => {
    expect(mapSPSSTypeToInterface('F')).toBe<VariableType>('NUMERIC');
    expect(mapSPSSTypeToInterface('COMMA')).toBe<VariableType>('COMMA');
    expect(mapSPSSTypeToInterface('E')).toBe<VariableType>('SCIENTIFIC');
    expect(mapSPSSTypeToInterface('DOLLAR')).toBe<VariableType>('DOLLAR');
  });

  it('should map standard string types correctly', () => {
    expect(mapSPSSTypeToInterface('A')).toBe<VariableType>('STRING');
  });

  it('should map various date types correctly', () => {
    expect(mapSPSSTypeToInterface('DATE')).toBe<VariableType>('DATE');
    expect(mapSPSSTypeToInterface('ADATE')).toBe<VariableType>('ADATE');
    expect(mapSPSSTypeToInterface('EDATE')).toBe<VariableType>('EDATE');
    expect(mapSPSSTypeToInterface('SDATE')).toBe<VariableType>('SDATE');
    expect(mapSPSSTypeToInterface('DATETIME')).toBe<VariableType>('DATETIME');
    expect(mapSPSSTypeToInterface('TIME')).toBe<VariableType>('TIME');
    expect(mapSPSSTypeToInterface('DTIME')).toBe<VariableType>('DTIME');
  });

  it('should map custom currency types correctly', () => {
    expect(mapSPSSTypeToInterface('CCA')).toBe<VariableType>('CCA');
    expect(mapSPSSTypeToInterface('CCB')).toBe<VariableType>('CCB');
    expect(mapSPSSTypeToInterface('CCC')).toBe<VariableType>('CCC');
    expect(mapSPSSTypeToInterface('CCD')).toBe<VariableType>('CCD');
    expect(mapSPSSTypeToInterface('CCE')).toBe<VariableType>('CCE');
  });

  it('should default to NUMERIC for unknown types', () => {
    expect(mapSPSSTypeToInterface('UNKNOWN_TYPE')).toBe<VariableType>('NUMERIC');
    expect(mapSPSSTypeToInterface('')).toBe<VariableType>('NUMERIC');
  });
}); 