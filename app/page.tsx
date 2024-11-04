'use client';

import ProductAccordion from '@/components/ProductAccordion';

const sampleCategories = [
  {
    id: 'cat1',
    name: 'Food',
    products: [
      {
        id: 'p1',
        name: 'Burger',
        price: 9.99,
        image: '/images/burger.jpg',
        description: 'Juicy beef burger with fresh vegetables'
      },
      {
        id: 'p2',
        name: 'Pizza',
        price: 12.99,
        image: '/images/pizza.jpg',
        description: 'Classic Margherita pizza'
      },
    ]
  },
  {
    id: 'cat2',
    name: 'Beverages',
    products: [
      {
        id: 'p3',
        name: 'Soda',
        price: 2.99,
        image: '/images/soda.jpg',
        description: 'Refreshing carbonated drink'
      },
      {
        id: 'p4',
        name: 'Coffee',
        price: 3.99,
        image: '/images/coffee.jpg',
        description: 'Fresh brewed coffee'
      },
    ]
  }
];

export default function Home() {
  return <ProductAccordion categories={sampleCategories} />;
}
