/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import { renderHook, act } from '@testing-library/react';
import { useAnalyzeHook } from '@/components/Modals/Analyze/TimeSeries/UnitRootTest/hooks/analyzeHook';
import { Variable } from '@/types/Variable';