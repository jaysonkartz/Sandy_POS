import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LanguageToggle } from '../LanguageToggle';

describe('LanguageToggle', () => {
  it('should render "中文" when isEnglish is true', () => {
    const onToggle = vi.fn();
    render(<LanguageToggle isEnglish={true} onToggle={onToggle} />);

    expect(screen.getByText('中文')).toBeInTheDocument();
  });

  it('should render "English" when isEnglish is false', () => {
    const onToggle = vi.fn();
    render(<LanguageToggle isEnglish={false} onToggle={onToggle} />);

    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('should call onToggle when button is clicked', () => {
    const onToggle = vi.fn();
    render(<LanguageToggle isEnglish={true} onToggle={onToggle} />);

    const button = screen.getByText('中文');
    button.click();

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('should render with correct styling classes', () => {
    const onToggle = vi.fn();
    const { container } = render(<LanguageToggle isEnglish={true} onToggle={onToggle} />);

    const button = container.querySelector('button');
    expect(button?.classList.contains('px-4')).toBe(true);
    expect(button?.classList.contains('py-2')).toBe(true);
    expect(button?.classList.contains('bg-gray-200')).toBe(true);
  });

  it('should render icon', () => {
    const onToggle = vi.fn();
    const { container } = render(<LanguageToggle isEnglish={true} onToggle={onToggle} />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});

