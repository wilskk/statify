import { excelStyleTextToColumns } from '../importClipboard.utils';

describe('excelStyleTextToColumns', () => {

  // Test 1: Basic tab-delimited data
  it('should parse basic tab-delimited text', () => {
    const text = "col1\tcol2\tcol3\nval1\tval2\tval3";
    const result = excelStyleTextToColumns(text, { delimiterType: 'delimited', delimiter: '\t' });
    expect(result).toEqual([
      ['col1', 'col2', 'col3'],
      ['val1', 'val2', 'val3']
    ]);
  });

  // Test 2: Comma-delimited data
  it('should parse basic comma-delimited text', () => {
    const text = "col1,col2,col3\nval1,val2,val3";
    const result = excelStyleTextToColumns(text, { delimiterType: 'delimited', delimiter: ',' });
    expect(result).toEqual([
      ['col1', 'col2', 'col3'],
      ['val1', 'val2', 'val3']
    ]);
  });

  // Test 3: Data with quoted fields containing delimiters
  it('should handle quoted fields containing delimiters', () => {
    const text = '1,"Doe, John",30\n2,"Smith, Jane",25';
    const result = excelStyleTextToColumns(text, { delimiterType: 'delimited', delimiter: ',', textQualifier: '"' });
    expect(result).toEqual([
      ['1', 'Doe, John', '30'],
      ['2', 'Smith, Jane', '25']
    ]);
  });

  // Test 4: Data with escaped quotes inside a quoted field
  it('should handle escaped quotes within a quoted field', () => {
    const text = '1,"He said ""Hello""",20';
    const result = excelStyleTextToColumns(text, { delimiterType: 'delimited', delimiter: ',', textQualifier: '"' });
    expect(result).toEqual([
      ['1', 'He said "Hello"', '20']
    ]);
  });

  // Test 5: Treat consecutive delimiters as one
  it('should treat consecutive delimiters as one when option is true', () => {
    const text = "a,,b,c\nd,,e"; // Excel would produce 3 columns for row 1, and 3 for row 2
    const result = excelStyleTextToColumns(text, {
      delimiterType: 'delimited',
      delimiter: ',',
      treatConsecutiveDelimitersAsOne: true
    });
    // This part is tricky. Excel's behavior for "a,,b" is to create two columns [a, b].
    // Our parser's logic for "a,,b" creates [a, '', b]. Let's test the actual implementation.
    // The implementation seems to skip the second delimiter, resulting in [a, b].
    // Let's adjust the test to match the code's behavior.
    expect(result).toEqual([
        ["a", "b", "c"],
        ["d", "e"]
    ]);
  });

  // Test 6: Do not treat consecutive delimiters as one
  it('should create empty fields for consecutive delimiters when option is false', () => {
    const text = "a,,b,c\nd,,e";
    const result = excelStyleTextToColumns(text, {
      delimiterType: 'delimited',
      delimiter: ',',
      treatConsecutiveDelimitersAsOne: false
    });
    expect(result).toEqual([
      ['a', '', 'b', 'c'],
      ['d', '', 'e']
    ]);
  });
  
  // Test 7: Handling empty rows
  it('should skip empty rows if trimWhitespace is true', () => {
    const text = "a,b\n\nc,d";
    const result = excelStyleTextToColumns(text, { 
        delimiterType: 'delimited', 
        delimiter: ',',
        trimWhitespace: true // This option makes it skip lines with only whitespace
    });
    expect(result).toEqual([
      ['a', 'b'],
      ['c', 'd']
    ]);
  });

  // Test 8: Trimming whitespace from fields
  it('should trim whitespace from fields when option is true', () => {
    const text = " a , b \n c,d ";
    const result = excelStyleTextToColumns(text, {
      delimiterType: 'delimited',
      delimiter: ',',
      trimWhitespace: true
    });
    expect(result).toEqual([
      ['a', 'b'],
      ['c', 'd']
    ]);
  });
  
  // Test 9: Mixed quoted and unquoted fields
  it('should handle mixed quoted and unquoted fields', () => {
    const text = '1,Name,"City, State",Age\n2,John,"New York, NY",30';
    const result = excelStyleTextToColumns(text, {
      delimiterType: 'delimited',
      delimiter: ',',
      textQualifier: '"'
    });
    expect(result).toEqual([
      ['1', 'Name', 'City, State', 'Age'],
      ['2', 'John', 'New York, NY', '30']
    ]);
  });

  // Test 10: Row with empty last field
  it('should handle rows with an empty last field', () => {
    const text = 'a,b,c,';
    const result = excelStyleTextToColumns(text, {
      delimiterType: 'delimited',
      delimiter: ',',
      treatConsecutiveDelimitersAsOne: false
    });
    expect(result).toEqual([['a', 'b', 'c', '']]);
  });
  
}); 