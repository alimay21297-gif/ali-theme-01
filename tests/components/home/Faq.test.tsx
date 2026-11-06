import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Faq, faqJsonLd, parseFaqItems } from '../../../app/components/home/Faq';

vi.mock('@salla.sa/twilight-theme-engine/common', () => ({
  Link: (props: { to: string; className?: string; children?: React.ReactNode }) => (
    <a href={props.to} className={props.className}>
      {props.children}
    </a>
  ),
}));

// Line and paragraph separators end a line in JS source, so build them from char codes.
const [LS, PS] = [String.fromCharCode(0x2028), String.fromCharCode(0x2029)];

const item = (n: number) => ({ question: `Q${n}`, answer: `A${n}` });
const items = (n: number) => Array.from({ length: n }, (_, i) => item(i + 1));

describe('Faq', () => {
  it('renders each valid item as a native details/summary sharing one group name', () => {
    const { container } = render(<Faq data={{ items: items(3) }} />);
    const details = [...container.querySelectorAll('details.home-faq__item')];
    expect(details).toHaveLength(3);
    expect(details[0].querySelector('summary')?.textContent).toBe('Q1');
    expect(details[0].querySelector('.home-faq__answer')?.textContent).toBe('A1');
    const names = new Set(details.map((d) => d.getAttribute('name')));
    expect(names.size).toBe(1);
    expect([...names][0]).toBeTruthy();
  });

  it('drops items missing a question or an answer, reads prefixed ids and caps at 12', () => {
    expect(
      parseFaqItems([{ question: 'Q', answer: '' }, { question: ' ', answer: 'A' }, 'x', null, item(1)])
    ).toEqual([item(1)]);
    expect(parseFaqItems([{ 'items.question': 'Q', 'items.answer': 'A' }])).toEqual([{ question: 'Q', answer: 'A' }]);
    expect(parseFaqItems(items(20))).toHaveLength(12);
    expect(parseFaqItems('nope')).toEqual([]);
  });

  it('full-width FAQ with no guarantee fields', () => {
    const { container } = render(<Faq data={{ items: items(2), title: 'T', subtitle: 'S' }} />);
    expect(container.querySelector('.home-faq__card')).toBeNull();
    expect(container.querySelector('.home-faq__layout--split')).toBeNull();
    expect(container.querySelector('.home-faq__title')?.textContent).toBe('T');
  });

  it('splits FAQ and card when both exist, with the button only for a set link and label', () => {
    const base = { items: items(2), guarantee_title: 'G', guarantee_text: 'Text' };
    const split = render(<Faq data={{ ...base, guarantee_button: 'Go', guarantee_link: [{ value: '/returns' }] }} />)
      .container;
    expect(split.querySelector('.home-faq__layout--split')).not.toBeNull();
    expect(split.querySelector('a.home-faq__card-cta')?.getAttribute('href')).toBe('/returns');
    // No link, an unsafe link, or no label: no button.
    expect(render(<Faq data={base} />).container.querySelector('a')).toBeNull();
    expect(
      render(<Faq data={{ ...base, guarantee_button: 'Go', guarantee_link: 'javascript:alert(1)' }} />).container.querySelector(
        'a'
      )
    ).toBeNull();
    expect(render(<Faq data={{ ...base, guarantee_link: '/r' }} />).container.querySelector('a')).toBeNull();
  });

  it('shows the card alone, without FAQ or JSON-LD, when there are no valid items', () => {
    const { container } = render(
      <Faq data={{ items: [{ question: 'Q' }], title: 'T', guarantee_title: 'G', guarantee_icon: 'sicon-star' }} />
    );
    expect(container.querySelector('.home-faq__list')).toBeNull();
    expect(container.querySelector('.home-faq__title')).toBeNull();
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('.home-faq__layout--split')).toBeNull();
    expect(container.querySelector('.home-faq__card-title')?.textContent).toBe('G');
    expect(container.querySelector('i.sicon-star')).not.toBeNull();
  });

  it('renders nothing with no items and no guarantee text', () => {
    expect(render(<Faq data={{}} />).container.firstChild).toBeNull();
    expect(render(<Faq data={{ title: 'T', guarantee_icon: 'sicon-star' }} />).container.firstChild).toBeNull();
  });

  it('drops guarantee icons that are not sicon classes', () => {
    const { container } = render(<Faq data={{ guarantee_title: 'G', guarantee_icon: 'x" onclick="y' }} />);
    expect(container.querySelector('i')).toBeNull();
  });

  it('puts valid FAQPage JSON-LD on the page', () => {
    const { container } = render(<Faq data={{ items: items(2) }} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const json = JSON.parse(script?.innerHTML ?? '{}');
    expect(json['@type']).toBe('FAQPage');
    expect(json.mainEntity).toHaveLength(2);
    expect(json.mainEntity[0]).toEqual({
      '@type': 'Question',
      name: 'Q1',
      acceptedAnswer: { '@type': 'Answer', text: 'A1' },
    });
  });

  it('escapes < > & and line separators in the JSON-LD so no markup can break out', () => {
    const evil = { question: '</script><img src=x onerror=alert(1)>', answer: `a & b <b>${LS}</b>` };
    const out = faqJsonLd([evil]);
    expect(out).not.toMatch(new RegExp(`[<>&${LS}${PS}]`));
    expect(JSON.parse(out).mainEntity[0].name).toBe(evil.question);
    expect(JSON.parse(out).mainEntity[0].acceptedAnswer.text).toBe(evil.answer);
    const { container } = render(<Faq data={{ items: [evil] }} />);
    expect(container.querySelector('script')?.innerHTML).not.toContain('</script');
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('summary')?.textContent).toBe(evil.question);
  });
});
