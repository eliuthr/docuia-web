import { toolLabel } from './tool-label';

describe('toolLabel', () => {
  it('describes a known tool', () => {
    expect(toolLabel('find_documents')).toBe('Searching documents…');
  });

  it('falls back to a generic label for an unknown tool', () => {
    expect(toolLabel('new_tool')).toBe('Working on it…');
  });
});
