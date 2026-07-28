import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import RacketImageDeck from '../../../components/common/RacketImageDeck';

const defaultProps = {
  activeIndex: 0,
  onSelect: vi.fn(),
  onOverflow: vi.fn(),
  alt: 'Adidas Metalbone 3.1',
};

describe('RacketImageDeck', () => {
  it('renders nothing when there is only one image', () => {
    const { container } = render(<RacketImageDeck images={['a.jpg']} {...defaultProps} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders one card per image and selects on click', () => {
    const onSelect = vi.fn();
    const images = ['a.jpg', 'b.jpg', 'c.jpg', 'd.jpg'];
    render(<RacketImageDeck {...defaultProps} images={images} onSelect={onSelect} />);

    const cards = screen.getAllByRole('button');
    expect(cards).toHaveLength(4);

    cards[2].click();
    expect(onSelect).toHaveBeenCalledWith(2);
  });

  it('shows an overflow badge and triggers onOverflow for images beyond the 5th', () => {
    const onOverflow = vi.fn();
    const images = Array.from({ length: 8 }, (_, i) => `img-${i}.jpg`);
    render(<RacketImageDeck {...defaultProps} images={images} onOverflow={onOverflow} />);

    const cards = screen.getAllByRole('button');
    expect(cards).toHaveLength(5);
    expect(screen.getByText('+3')).toBeInTheDocument();

    cards[4].click();
    expect(onOverflow).toHaveBeenCalled();
  });
});
