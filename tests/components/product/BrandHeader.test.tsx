import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BrandHeader } from '../../../app/components/product/BrandHeader';

vi.mock('@salla.sa/twilight-theme-engine/common', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  Image: ({ alt }: { alt?: string }) => <img alt={alt} />,
}));

const brandSource = (description: string) =>
  ({
    type: 'brands',
    value: '1',
    entity: { name: 'Acme', description },
  }) as never;

describe('BrandHeader description', () => {
  it('keeps bold and links, drops script and event handlers', () => {
    const { container } = render(
      <BrandHeader
        source={brandSource(
          'We make <strong>things</strong> <a href="https://acme.test/about">about us</a>' +
            '<script>window.pwned=1</script><img src="x" onerror="window.pwned=2">' +
            '<a href="javascript:alert(1)" onclick="x()">bad</a>'
        )}
      />
    );

    const description = container.querySelector('header p') as HTMLElement;
    expect(description.querySelector('script')).toBeNull();
    expect(description.innerHTML).not.toMatch(/onerror|onclick|javascript:|pwned/);
    expect(description.querySelector('img')).toBeNull();
    expect(description.querySelector('strong')?.textContent).toBe('things');
    expect(description.querySelector('a[href="https://acme.test/about"]')?.textContent).toBe(
      'about us'
    );
  });

  it('renders nothing for the description when the brand has none', () => {
    const { container } = render(<BrandHeader source={brandSource('')} />);
    expect(container.querySelector('header p')).toBeNull();
  });
});
