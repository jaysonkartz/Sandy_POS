
const exampleProducts = [
  {
    id: 79,
    Product: "Byadgi Dried Chilli",
    Variation: '2"',
    Variation_CH: "2寸",
    price: 13.7,
    stock_quantity: 26,
    weight: "25kg",
    UOM: "kg",
    Category: 1,
    Country: 1,
    "Item Code": "CH001",
  },
  {
    id: 80,
    Product: "Byadgi Dried Chilli",
    Variation: '4"',
    Variation_CH: "4寸",
    price: 15.2,
    stock_quantity: 40,
    weight: "25kg",
    UOM: "kg",
    Category: 1,
    Country: 1,
    "Item Code": "CH002",
  },
  {
    id: 81,
    Product: "Byadgi Dried Chilli",
    Variation: "60 70",
    Variation_CH: "60 70",
    price: 18.5,
    stock_quantity: 77,
    weight: "25kg",
    UOM: "kg",
    Category: 1,
    Country: 1,
    "Item Code": "CH003",
  },
];

const groupedVariants = {
  productName: "Byadgi Dried Chilli",
  variants: [
    {
      id: 79,
      Variation: '2"',
      Variation_CH: "2寸",
      price: 13.7,
      stock_quantity: 26,
    },
    {
      id: 80,
      Variation: '4"',
      Variation_CH: "4寸",
      price: 15.2,
      stock_quantity: 40,
    },
    {
      id: 81,
      Variation: "60 70",
      Variation_CH: "60 70",
      price: 18.5,
      stock_quantity: 77,
    },
  ],
};

const sqlQuery = `
  SELECT * 
  FROM products 
  WHERE Product = 'Byadgi Dried Chilli'
  ORDER BY Variation ASC
`;


export { exampleProducts, groupedVariants, sqlQuery };
