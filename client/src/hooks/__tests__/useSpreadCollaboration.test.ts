import { renderHook, act } from '@testing-library/react';
import { useSpreadCollaboration } from '../useSpreadCollaboration';

describe('useSpreadCollaboration', () => {
  it('should initialize with correct initial state', () => {
    const { result } = renderHook(() =>
      useSpreadCollaboration({
        documentId: null,
        serverUrl: 'http://localhost:8080',
      })
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.users).toEqual([]);
  });

  it('should not connect when documentId is null', () => {
    const { result } = renderHook(() =>
      useSpreadCollaboration({
        documentId: null,
        serverUrl: 'http://localhost:8080',
        autoConnect: true,
      })
    );

    expect(result.current.isLoading).toBe(false);
  });

  it('should not connect when autoConnect is false', () => {
    const { result } = renderHook(() =>
      useSpreadCollaboration({
        documentId: 'test-doc',
        serverUrl: 'http://localhost:8080',
        autoConnect: false,
      })
    );

    expect(result.current.isLoading).toBe(false);
  });
});
