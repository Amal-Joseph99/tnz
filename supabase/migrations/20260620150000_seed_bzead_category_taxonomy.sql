-- Seed BZEAD Global Ecommerce Taxonomy (all rows from BZEAD_Global_Ecommerce_Taxonomy.xlsx)
-- Total rows: 39

INSERT INTO public.product_category_taxonomy (
  category_name,
  sub_category_name,
  product_type_name,
  hsn_code
)
VALUES
  ('Electronics', 'Mobile Phones', 'Smartphones', '85171300'),
  ('Electronics', 'Mobile Phones', 'Feature Phones', '85171400'),
  ('Electronics', 'Mobile Accessories', 'Phone Cases', '39269099'),
  ('Electronics', 'Mobile Accessories', 'Chargers', '85044090'),
  ('Electronics', 'Computers', 'Laptops', '84713010'),
  ('Electronics', 'Computers', 'Desktop PCs', '84715000'),
  ('Electronics', 'Audio', 'Headphones', '85183000'),
  ('Electronics', 'Audio', 'Bluetooth Speakers', '85182100'),
  ('Fashion', 'Men''s Clothing', 'T-Shirts', '61091000'),
  ('Fashion', 'Men''s Clothing', 'Shirts', '62052000'),
  ('Fashion', 'Women''s Clothing', 'Dresses', '62044300'),
  ('Fashion', 'Footwear', 'Sports Shoes', '64041100'),
  ('Fashion', 'Bags', 'Handbags', '42022200'),
  ('Home', 'Furniture', 'Sofas', '94016100'),
  ('Home', 'Furniture', 'Beds', '94035000'),
  ('Home', 'Kitchen', 'Cookware', '73239300'),
  ('Home', 'Kitchen', 'Dinner Sets', '69111000'),
  ('Home', 'Decor', 'Wall Art', '97011000'),
  ('Beauty', 'Skincare', 'Face Cream', '33049900'),
  ('Beauty', 'Skincare', 'Face Wash', '34013000'),
  ('Beauty', 'Hair Care', 'Shampoo', '33051000'),
  ('Beauty', 'Cosmetics', 'Lipstick', '33041000'),
  ('Sports', 'Fitness', 'Treadmills', '95069100'),
  ('Sports', 'Fitness', 'Dumbbells', '95069100'),
  ('Sports', 'Outdoor', 'Camping Tents', '63062200'),
  ('Automotive', 'Car Accessories', 'Seat Covers', '87082900'),
  ('Automotive', 'Car Electronics', 'Dash Cameras', '85258900'),
  ('Automotive', 'Motorcycle Parts', 'Helmets', '65061000'),
  ('Toys', 'Educational Toys', 'Learning Kits', '95030099'),
  ('Toys', 'Action Figures', 'Collectible Figures', '95030099'),
  ('Pets', 'Pet Food', 'Dog Food', '23091000'),
  ('Pets', 'Pet Food', 'Cat Food', '23091000'),
  ('Pets', 'Pet Accessories', 'Pet Beds', '94049090'),
  ('Grocery', 'Beverages', 'Tea', '09023000'),
  ('Grocery', 'Beverages', 'Coffee', '09012100'),
  ('Grocery', 'Food Staples', 'Rice', '10063090'),
  ('Grocery', 'Food Staples', 'Wheat Flour', '11010000'),
  ('Books', 'Printed Books', 'Educational Books', '49019900'),
  ('Books', 'Printed Books', 'Children Books', '49030000')
ON CONFLICT (category_name, sub_category_name, product_type_name)
DO UPDATE SET
  hsn_code = EXCLUDED.hsn_code,
  is_active = true,
  updated_at = NOW();
