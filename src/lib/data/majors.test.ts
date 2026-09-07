import { describe, it, expect } from 'vitest';
import { MAJOR_CATALOG, getMajorById } from './majors';

describe('MAJOR_CATALOG', () => {
  it('has exactly 10 unique major ids', () => {
    expect(MAJOR_CATALOG).toHaveLength(10);
    const ids = MAJOR_CATALOG.map((major) => major.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(10);
  });
});

describe('getMajorById', () => {
  it('returns the major for a known id', () => {
    const major = getMajorById('business');
    expect(major).toBeDefined();
    expect(major?.label).toBe('Business');
    expect(major?.field).toBe('business');
  });

  it('returns undefined for an unknown id', () => {
    const major = getMajorById('unknown');
    expect(major).toBeUndefined();
  });

  it('returns undefined for undefined input', () => {
    const major = getMajorById(undefined);
    expect(major).toBeUndefined();
  });
});
