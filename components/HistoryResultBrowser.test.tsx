// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HistoryResultBrowser from './HistoryResultBrowser';

vi.mock('./HistoryResultViewer', () => ({
  default: ({
    item,
    navigation,
  }: {
    item: { id: string };
    navigation: { index: number; total: number; onPrevious: () => void; onNext: () => void };
  }) => (
    <div>
      <p>
        {item.id} {navigation.index + 1}/{navigation.total}
      </p>
      <button onClick={navigation.onPrevious}>Previous</button>
      <button onClick={navigation.onNext}>Next</button>
    </div>
  ),
}));
const items = ['third', 'first', 'second'].map((id) => ({
  id,
  type: 'tryon',
  timestamp: 1,
  blob: new Blob(),
  url: `blob:${id}`,
}));
afterEach(cleanup);
describe('history filtered result sequence', () => {
  it('follows the supplied filtered order and does not wrap across boundaries', () => {
    render(<HistoryResultBrowser items={items} initialId="first" onClose={vi.fn()} />);
    expect(screen.getByText('first 2/3')).toBeTruthy();
    fireEvent.click(screen.getByText('Previous'));
    expect(screen.getByText('third 1/3')).toBeTruthy();
    fireEvent.click(screen.getByText('Previous'));
    expect(screen.getByText('third 1/3')).toBeTruthy();
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('second 3/3')).toBeTruthy();
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('second 3/3')).toBeTruthy();
  });
  it('closes when the current record is removed rather than showing an unrelated record', () => {
    const close = vi.fn();
    const view = render(<HistoryResultBrowser items={items} initialId="first" onClose={close} />);
    view.rerender(
      <HistoryResultBrowser items={[items[0], items[2]]} initialId="first" onClose={close} />,
    );
    expect(close).toHaveBeenCalled();
    expect(screen.queryByText('third 1/2')).toBeNull();
  });
});
