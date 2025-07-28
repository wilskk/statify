"use client";

import React, { forwardRef } from 'react';
import { HotTable, HotTableProps } from '@handsontable/react-wrapper';
import 'handsontable/dist/handsontable.full.min.css';

export type HandsontableWrapperProps = Omit<HotTableProps, 'licenseKey'> & {
  licenseKey?: string;
};

// Threshold untuk dataset besar - disable autoColumnSize jika melebihi
const AUTO_COLUMN_SIZE_THRESHOLD = {
  rows: 1000,
  cols: 50
};

const defaultProps: Partial<HandsontableWrapperProps> = {
  licenseKey: 'non-commercial-and-evaluation',
  rowHeaders: true,
  width: '100%',
  height: '100%',
  manualColumnResize: true,  // Biarkan aktif untuk resize manual
  autoColumnSize: false,     // Akan diatur dinamis berdasarkan dataset size
  manualRowResize: false,
  manualColumnMove: false,
  manualRowMove: false,
  dropdownMenu: false,
  filters: true,
  customBorders: true,
  copyPaste: true,
  minSpareRows: 0,
  minSpareCols: 0,
  allowInvalid: false,
  outsideClickDeselects: false,
  invalidCellClassName: 'htInvalid',
  preventOverflow: 'horizontal'
};

export const HandsontableWrapper = React.memo(forwardRef<any, HandsontableWrapperProps>(
  (props, ref) => <HotTable ref={ref} {...defaultProps} {...props} />
));

HandsontableWrapper.displayName = 'HandsontableWrapper';

export default HandsontableWrapper;
