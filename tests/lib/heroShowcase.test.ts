import { describe, it, expect } from 'vitest';
import { parseShowcase } from '../../app/lib/heroShowcase';

const wallet = {
  p1_link: '/wallet',
  p1_name: 'Wallet',
  p1_type: 'slide',
  p1_body: 'https://cdn.test/wallet-body.webp',
  p1_layers: [{ image: 'https://cdn.test/c1.webp' }, { image: 'https://cdn.test/c2.webp' }],
};

describe('parseShowcase', () => {
  it('is empty unless the switch is on', () => {
    expect(parseShowcase(wallet)).toEqual([]);
    expect(parseShowcase({ ...wallet, animate_products: false })).toEqual([]);
  });

  it('builds a product from its link, front image and layers', () => {
    const [product] = parseShowcase({ ...wallet, animate_products: true });
    expect(product).toMatchObject({
      type: 'slide',
      url: '/wallet',
      name: 'Wallet',
      body: 'https://cdn.test/wallet-body.webp',
      layers: ['https://cdn.test/c1.webp', 'https://cdn.test/c2.webp'],
    });
  });

  it('leaves out a product with no link, no front image or no layers', () => {
    const on = { ...wallet, animate_products: true };
    expect(parseShowcase({ ...on, p1_link: '' })).toEqual([]);
    expect(parseShowcase({ ...on, p1_body: '' })).toEqual([]);
    expect(parseShowcase({ ...on, p1_layers: [] })).toEqual([]);
    expect(parseShowcase({ ...on, p1_layers: [{ image: '' }] })).toEqual([]);
  });

  it('drops a link that is not a path or an http(s) address', () => {
    expect(
      parseShowcase({ ...wallet, animate_products: true, p1_link: 'javascript:alert(1)' })
    ).toEqual([]);
  });

  it('reads the link as a string', () => {
    const [product] = parseShowcase({ ...wallet, animate_products: true, p1_link: '/p/1' });
    expect(product.url).toBe('/p/1');
  });

  it('reads the link as [{ value, … }] (variable-list)', () => {
    const [product] = parseShowcase({
      ...wallet,
      animate_products: true,
      p1_link: [{ type: 'products', value: 'https://shop.test/p/2', label: 'Wallet' }],
    });
    expect(product.url).toBe('https://shop.test/p/2');
  });

  it('reads the link as { value, … }', () => {
    const [product] = parseShowcase({
      ...wallet,
      animate_products: true,
      p1_link: { type: 'url', value: '/p/3' },
    });
    expect(product.url).toBe('/p/3');
  });

  it('drops an unsafe or empty link in any shape', () => {
    const on = { ...wallet, animate_products: true };
    expect(parseShowcase({ ...on, p1_link: [{ value: 'javascript:alert(1)' }] })).toEqual([]);
    expect(parseShowcase({ ...on, p1_link: { value: 'data:text/html,x' } })).toEqual([]);
    expect(parseShowcase({ ...on, p1_link: [] })).toEqual([]);
    expect(parseShowcase({ ...on, p1_link: [{}] })).toEqual([]);
  });

  it('keeps the other product when one is incomplete', () => {
    const products = parseShowcase({
      ...wallet,
      animate_products: true,
      p2_link: '/keys',
      p2_body: 'https://cdn.test/keys-body.webp',
      p2_layers: [],
    });
    expect(products).toHaveLength(1);
    expect(products[0].url).toBe('/wallet');
  });

  it('reads the animation type as a string or as [{ value }], defaulting to slide', () => {
    const on = { ...wallet, animate_products: true };
    expect(parseShowcase({ ...on, p1_type: 'swing' })[0].type).toBe('swing');
    expect(parseShowcase({ ...on, p1_type: [{ value: 'swing' }] })[0].type).toBe('swing');
    expect(parseShowcase({ ...on, p1_type: undefined })[0].type).toBe('slide');
    expect(parseShowcase({ ...on, p1_type: 'spin' })[0].type).toBe('slide');
  });

  it('accepts layer items as { image }, { "<id>.image" } or a URL, and keeps at most three', () => {
    const [product] = parseShowcase({
      ...wallet,
      animate_products: true,
      p1_layers: [
        { 'p1_layers.image': 'https://cdn.test/a.webp' },
        'https://cdn.test/b.webp',
        { image: 'https://cdn.test/c.webp' },
        { image: 'https://cdn.test/d.webp' },
      ],
    });
    expect(product.layers).toEqual([
      'https://cdn.test/a.webp',
      'https://cdn.test/b.webp',
      'https://cdn.test/c.webp',
    ]);
  });

  it('reads the pivot as a number or numeric string, clamped to 0-100', () => {
    const on = { ...wallet, animate_products: true };
    expect(parseShowcase({ ...on, p1_pivot_x: '53', p1_pivot_y: 71.1 })[0]).toMatchObject({
      pivotX: 53,
      pivotY: 71.1,
    });
    expect(parseShowcase({ ...on, p1_pivot_x: 250, p1_pivot_y: -5 })[0]).toMatchObject({
      pivotX: 100,
      pivotY: 0,
    });
    expect(parseShowcase({ ...on, p1_pivot_x: '', p1_pivot_y: 'abc' })[0].pivotX).toBeUndefined();
  });
});
