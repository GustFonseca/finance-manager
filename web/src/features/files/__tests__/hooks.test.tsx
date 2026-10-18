import { act, renderHook } from '@testing-library/react';
import { useFileDrop, useListSelection } from '../hooks';

function dragEvent(type: string, types: string[], files: File[] = []) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'dataTransfer', { value: { types, files } });
  return event;
}

describe('useListSelection', () => {
  it('selects on a click and opens on a double click of the same item', () => {
    const now = jest.spyOn(Date, 'now');
    const open = jest.fn();
    const { result } = renderHook(() => useListSelection());

    now.mockReturnValue(1000);
    act(() => result.current.press('a', open));
    expect(result.current.selectedId).toBe('a');
    expect(open).not.toHaveBeenCalled();

    now.mockReturnValue(1200);
    act(() => result.current.press('a', open));
    expect(open).toHaveBeenCalledTimes(1);

    now.mockReturnValue(1300);
    act(() => result.current.press('a', open));
    expect(open).toHaveBeenCalledTimes(1);

    now.mockReturnValue(2000);
    act(() => result.current.press('a', open));
    expect(open).toHaveBeenCalledTimes(1);

    now.mockReturnValue(2100);
    act(() => result.current.press('b', open));
    expect(result.current.selectedId).toBe('b');
    expect(open).toHaveBeenCalledTimes(1);

    now.mockReturnValue(2200);
    act(() => result.current.press('b'));
    expect(open).toHaveBeenCalledTimes(1);

    act(() => result.current.select(null));
    expect(result.current.selectedId).toBeNull();
    now.mockRestore();
  });
});

describe('useFileDrop', () => {
  it('highlights while files are dragged over and hands dropped files to the callback', () => {
    const onFiles = jest.fn();
    const { result } = renderHook(() => useFileDrop(onFiles));
    const node = document.createElement('div');
    act(() => result.current.ref(node));

    const ignored = dragEvent('dragover', ['text/plain']);
    act(() => {
      node.dispatchEvent(ignored);
    });
    expect(ignored.defaultPrevented).toBe(false);
    expect(result.current.over).toBe(false);

    const over = dragEvent('dragover', ['Files']);
    act(() => {
      node.dispatchEvent(over);
    });
    expect(over.defaultPrevented).toBe(true);
    expect(result.current.over).toBe(true);

    act(() => {
      node.dispatchEvent(new Event('dragleave'));
    });
    expect(result.current.over).toBe(false);

    act(() => {
      node.dispatchEvent(dragEvent('drop', ['text/plain']));
    });
    expect(onFiles).not.toHaveBeenCalled();

    const file = new File(['x'], 'x.csv');
    act(() => {
      node.dispatchEvent(dragEvent('dragover', ['Files']));
      node.dispatchEvent(dragEvent('drop', ['Files'], [file]));
    });
    expect(result.current.over).toBe(false);
    expect(onFiles).toHaveBeenCalledWith([file]);
  });

  it('treats a missing dataTransfer as no files', () => {
    const onFiles = jest.fn();
    const { result } = renderHook(() => useFileDrop(onFiles));
    const node = document.createElement('div');
    act(() => result.current.ref(node));
    act(() => {
      node.dispatchEvent(new Event('drop'));
    });
    expect(onFiles).not.toHaveBeenCalled();
  });

  it('handles a drop event whose file list is missing', () => {
    const onFiles = jest.fn();
    const { result } = renderHook(() => useFileDrop(onFiles));
    const node = document.createElement('div');
    act(() => result.current.ref(node));
    const event = new Event('drop', { cancelable: true });
    Object.defineProperty(event, 'dataTransfer', { value: { types: ['Files'] } });
    act(() => {
      node.dispatchEvent(event);
    });
    expect(onFiles).toHaveBeenCalledWith([]);
  });

  it('detaches the listeners when the node changes or goes away', () => {
    const onFiles = jest.fn();
    const { result } = renderHook(() => useFileDrop(onFiles));
    const first = document.createElement('div');
    const second = document.createElement('div');
    act(() => result.current.ref(first));
    act(() => result.current.ref(second));
    act(() => {
      first.dispatchEvent(dragEvent('drop', ['Files']));
    });
    expect(onFiles).not.toHaveBeenCalled();

    act(() => result.current.ref(null));
    act(() => {
      second.dispatchEvent(dragEvent('drop', ['Files']));
    });
    expect(onFiles).not.toHaveBeenCalled();

    act(() => result.current.ref({}));
    expect(result.current.over).toBe(false);
  });
});
