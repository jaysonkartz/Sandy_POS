import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CategoryFilter } from '../CategoryFilter';

// Mock the category constant
vi.mock('@/app/(admin)/const/category', () => ({
  CATEGORY_ID_NAME_MAP: {
    '1': 'Dried Chilli',
    '2': 'Beans & Legumes',
    '3': 'Nuts & Seeds',
  },
}));

describe('CategoryFilter', () => {
  it('should render all categories option', () => {
    const onCategoryChange = vi.fn();
    render(<CategoryFilter selectedCategory="all" onCategoryChange={onCategoryChange} isEnglish={true} />);

    expect(screen.getByText('All Categories')).toBeInTheDocument();
    expect(screen.getByText('Dried Chilli')).toBeInTheDocument();
    expect(screen.getByText('Beans & Legumes')).toBeInTheDocument();
  });

  it('should render Chinese text when isEnglish is false', () => {
    const onCategoryChange = vi.fn();
    render(<CategoryFilter selectedCategory="all" onCategoryChange={onCategoryChange} isEnglish={false} />);

    expect(screen.getByText('所有类别')).toBeInTheDocument();
  });

  it('should call onCategoryChange when selection changes', () => {
    const onCategoryChange = vi.fn();
    render(<CategoryFilter selectedCategory="all" onCategoryChange={onCategoryChange} isEnglish={true} />);

    const select = screen.getByRole('combobox');
    select.dispatchEvent(new Event('change', { bubbles: true }));
    (select as HTMLSelectElement).value = '1';
    select.dispatchEvent(new Event('change', { bubbles: true }));

    expect(onCategoryChange).toHaveBeenCalled();
  });

  it('should have correct selected value', () => {
    const onCategoryChange = vi.fn();
    render(<CategoryFilter selectedCategory="1" onCategoryChange={onCategoryChange} isEnglish={true} />);

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('1');
  });

  it('should render select element with correct classes', () => {
    const onCategoryChange = vi.fn();
    const { container } = render(
      <CategoryFilter selectedCategory="all" onCategoryChange={onCategoryChange} isEnglish={true} />
    );

    const select = container.querySelector('select');
    expect(select?.classList.contains('p-2')).toBe(true);
    expect(select?.classList.contains('border')).toBe(true);
  });
});

