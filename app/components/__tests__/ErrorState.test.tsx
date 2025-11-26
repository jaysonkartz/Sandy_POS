import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorState } from '../ErrorState';

describe('ErrorState', () => {
  it('should render error message in English', () => {
    const onRetry = vi.fn();
    render(<ErrorState error="Test error message" isEnglish={true} onRetry={onRetry} />);

    expect(screen.getByText('Error Loading Products')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('should render error message in Chinese', () => {
    const onRetry = vi.fn();
    render(<ErrorState error="测试错误消息" isEnglish={false} onRetry={onRetry} />);

    expect(screen.getByText('加载产品时出错')).toBeInTheDocument();
    expect(screen.getByText('测试错误消息')).toBeInTheDocument();
    expect(screen.getByText('重试')).toBeInTheDocument();
  });

  it('should call onRetry when retry button is clicked', () => {
    const onRetry = vi.fn();
    render(<ErrorState error="Test error" isEnglish={true} onRetry={onRetry} />);

    const retryButton = screen.getByText('Try Again');
    retryButton.click();

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should render error icon', () => {
    const onRetry = vi.fn();
    const { container } = render(
      <ErrorState error="Test error" isEnglish={true} onRetry={onRetry} />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.classList.contains('w-16')).toBe(true);
    expect(svg?.classList.contains('h-16')).toBe(true);
  });
});

