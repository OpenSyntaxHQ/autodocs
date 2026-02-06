import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { CodeBlock } from './CodeBlock';

let writeTextMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  writeTextMock = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(window.Navigator.prototype, 'clipboard', {
    value: { writeText: writeTextMock },
    configurable: true,
  });
});

describe('CodeBlock', () => {
  it('renders code and language label', () => {
    const { getByText } = render(<CodeBlock code="const x = 1" language="ts" />);

    expect(getByText('ts')).toBeInTheDocument();
    expect(getByText('const x = 1')).toBeInTheDocument();
  });

  it('copies code to clipboard and shows feedback', async () => {
    const { getByRole, getByText, findByText } = render(<CodeBlock code="const x = 1" />);

    const button = getByRole('button', { name: 'Copy' });
    fireEvent.click(button);

    expect(writeTextMock).toHaveBeenCalledWith('const x = 1');
    expect(await findByText('Copied')).toBeInTheDocument();

    await waitFor(
      () => {
        expect(getByText('Copy')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });
});
