import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FloatingOrderButton } from '../FloatingOrderButton';

describe('FloatingOrderButton', () => {
  it('should render with correct text in English', () => {
    const onClick = vi.fn();
    render(<FloatingOrderButton selectedProductsCount={5} isEnglish={true} onClick={onClick} />);

    expect(screen.getByText('View Order')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should render with correct text in Chinese', () => {
    const onClick = vi.fn();
    render(<FloatingOrderButton selectedProductsCount={3} isEnglish={false} onClick={onClick} />);

    expect(screen.getByText('查看订单')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const onClick = vi.fn();
    render(<FloatingOrderButton selectedProductsCount={3} isEnglish={true} onClick={onClick} />);

    const button = screen.getByRole('button');
    button.click();

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should display zero when selectedProductsCount is 0', () => {
    const onClick = vi.fn();
    render(<FloatingOrderButton selectedProductsCount={0} isEnglish={true} onClick={onClick} />);

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should have correct styling classes', () => {
    const onClick = vi.fn();
    const { container } = render(
      <FloatingOrderButton selectedProductsCount={1} isEnglish={true} onClick={onClick} />
    );

    const button = container.querySelector('button');
    expect(button?.classList.contains('fixed')).toBe(true);
    expect(button?.classList.contains('bg-blue-500')).toBe(true);
  });
});

