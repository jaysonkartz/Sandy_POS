import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWhatsApp } from '../useWhatsApp';

const DEFAULT_MESSAGE = 'Hi, I would like to inquire about your products.';

describe('useWhatsApp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.open = vi.fn();
  });

  it('should initialize with handleCustomerService and sendWhatsAppNotification functions', () => {
    const { result } = renderHook(() => useWhatsApp());

    expect(result.current.handleCustomerService).toBeDefined();
    expect(result.current.sendWhatsAppNotification).toBeDefined();
    expect(typeof result.current.handleCustomerService).toBe('function');
    expect(typeof result.current.sendWhatsAppNotification).toBe('function');
  });

  it('should open WhatsApp with default message when handleCustomerService is called', () => {
    const { result } = renderHook(() => useWhatsApp());

    act(() => {
      result.current.handleCustomerService();
    });

    expect(window.open).toHaveBeenCalledTimes(1);
    const callArgs = (window.open as any).mock.calls[0];
    expect(callArgs[0]).toContain('wa.me/6593254825');
    expect(callArgs[0]).toContain('text=');
    expect(callArgs[1]).toBe('_blank');

    const url = new URL(callArgs[0]);
    const message = decodeURIComponent(url.searchParams.get('text') || '');
    expect(message).toBe(DEFAULT_MESSAGE);
  });

  it('should include product details when handleCustomerService is called with a product payload', () => {
    const { result } = renderHook(() => useWhatsApp());

    act(() => {
      result.current.handleCustomerService({
        productName: 'Dried Chilli',
        variation: 'Premium',
        origin: 'China',
        weight: '25kg',
      });
    });

    expect(window.open).toHaveBeenCalledTimes(1);
    const callArgs = (window.open as any).mock.calls[0];
    const url = new URL(callArgs[0]);
    const message = decodeURIComponent(url.searchParams.get('text') || '');

    expect(message).toContain(DEFAULT_MESSAGE);
    expect(message).toContain('Product details:');
    expect(message).toContain('Product: Dried Chilli');
    expect(message).toContain('Variation: Premium');
    expect(message).toContain('Origin: China');
    expect(message).toContain('Weight: 25kg');
    expect(message).not.toContain('Item Code:');
  });

  it('should open WhatsApp with order notification when sendWhatsAppNotification is called', () => {
    const { result } = renderHook(() => useWhatsApp());

    const orderDetails = {
      orderId: 123,
      customerName: 'John Doe',
      totalAmount: 99.99,
      items: [
        { productName: 'Product 1', quantity: 2, price: 29.99 },
        { productName: 'Product 2', quantity: 1, price: 40.01 },
      ],
    };

    act(() => {
      result.current.sendWhatsAppNotification(orderDetails);
    });

    expect(window.open).toHaveBeenCalledTimes(1);
    const callArgs = (window.open as any).mock.calls[0];
    expect(callArgs[0]).toContain('wa.me/6593254825');
    expect(callArgs[0]).toContain('text=');
    expect(callArgs[1]).toBe('_blank');

    // Verify the message contains order details
    const url = new URL(callArgs[0]);
    const message = decodeURIComponent(url.searchParams.get('text') || '');
    expect(message).toContain('New Order Notification');
    expect(message).toContain('Order ID: 123');
    expect(message).toContain('Customer: John Doe');
    expect(message).toContain('Total Amount: $99.99');
    expect(message).toContain('Product 1');
    expect(message).toContain('Product 2');
  });

  it('should format order notification message correctly', () => {
    const { result } = renderHook(() => useWhatsApp());

    const orderDetails = {
      orderId: 456,
      customerName: 'Jane Smith',
      totalAmount: 150.50,
      items: [
        { productName: 'Item A', quantity: 3, price: 50.17 },
      ],
    };

    act(() => {
      result.current.sendWhatsAppNotification(orderDetails);
    });

    const callArgs = (window.open as any).mock.calls[0];
    const url = new URL(callArgs[0]);
    const message = decodeURIComponent(url.searchParams.get('text') || '');
    
    expect(message).toContain('Order ID: 456');
    expect(message).toContain('Customer: Jane Smith');
    expect(message).toContain('Total Amount: $150.50');
    expect(message).toContain('Item A x 3 @ $50.17');
  });
});

