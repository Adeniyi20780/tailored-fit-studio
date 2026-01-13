-- Make tailor_id nullable to allow sample products without a real tailor
ALTER TABLE products ALTER COLUMN tailor_id DROP NOT NULL;

-- Add policy to allow viewing all active products (already exists but confirming)
-- Insert sample products without tailor_id for testing
INSERT INTO products (name, description, category, base_price, currency, images, fabrics, colors, sizes) VALUES
(
  'Classic Oxford Shirt',
  'A timeless oxford shirt crafted from premium cotton. Perfect for business or casual occasions with a comfortable fit and durable construction.',
  'shirts',
  85.00,
  'USD',
  ARRAY['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800'],
  ARRAY['Cotton', 'Linen', 'Oxford Weave'],
  ARRAY['White', 'Light Blue', 'Pink', 'Cream'],
  ARRAY['S', 'M', 'L', 'XL', 'XXL']
),
(
  'Executive Business Shirt',
  'Elegant dress shirt designed for the modern professional. Features a crisp finish and refined details for a polished look.',
  'shirts',
  95.00,
  'USD',
  ARRAY['https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800'],
  ARRAY['Egyptian Cotton', 'Poplin', 'Twill'],
  ARRAY['White', 'French Blue', 'Lavender'],
  ARRAY['S', 'M', 'L', 'XL', 'XXL']
),
(
  'Casual Linen Shirt',
  'Breathable linen shirt perfect for warm weather. Relaxed fit with a soft texture that gets better with each wash.',
  'shirts',
  75.00,
  'USD',
  ARRAY['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800'],
  ARRAY['Pure Linen', 'Cotton-Linen Blend'],
  ARRAY['White', 'Beige', 'Light Grey', 'Sage Green'],
  ARRAY['S', 'M', 'L', 'XL']
),
(
  'Premium Two-Piece Suit',
  'Impeccably tailored two-piece suit made from fine Italian wool. Features a modern slim fit with expert craftsmanship.',
  'suits',
  650.00,
  'USD',
  ARRAY['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800'],
  ARRAY['Italian Wool', 'Cashmere Blend', 'Super 120s'],
  ARRAY['Navy', 'Charcoal', 'Black', 'Dark Grey'],
  ARRAY['38R', '40R', '42R', '44R', '46R', '48R']
),
(
  'Three-Piece Wedding Suit',
  'Luxurious three-piece suit perfect for weddings and special occasions. Includes jacket, vest, and trousers with premium lining.',
  'suits',
  850.00,
  'USD',
  ARRAY['https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800'],
  ARRAY['Premium Wool', 'Silk Blend', 'Mohair'],
  ARRAY['Midnight Blue', 'Burgundy', 'Forest Green', 'Classic Black'],
  ARRAY['38R', '40R', '42R', '44R', '46R']
),
(
  'Business Blazer',
  'Versatile blazer that pairs perfectly with dress pants or jeans. Structured shoulders with a comfortable contemporary fit.',
  'suits',
  380.00,
  'USD',
  ARRAY['https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=800'],
  ARRAY['Wool Blend', 'Cotton Tweed', 'Linen'],
  ARRAY['Navy', 'Tan', 'Grey', 'Olive'],
  ARRAY['38R', '40R', '42R', '44R', '46R']
),
(
  'Royal Agbada Set',
  'Magnificent traditional Agbada set featuring intricate embroidery. Complete with flowing outer robe, inner shirt, and matching trousers.',
  'kaftans',
  420.00,
  'USD',
  ARRAY['https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=800'],
  ARRAY['Guinea Brocade', 'Lace', 'Aso-Oke'],
  ARRAY['Gold', 'Royal Blue', 'Ivory', 'Wine'],
  ARRAY['M', 'L', 'XL', 'XXL']
),
(
  'Senator Kaftan',
  'Sophisticated senator-style kaftan with detailed neck embroidery. A modern take on traditional Nigerian attire for distinguished occasions.',
  'kaftans',
  280.00,
  'USD',
  ARRAY['https://images.unsplash.com/photo-1578932750294-f5075e85f44a?w=800'],
  ARRAY['Soft Cotton', 'Voile', 'Cashmere Cotton'],
  ARRAY['White', 'Cream', 'Sky Blue', 'Olive Green'],
  ARRAY['M', 'L', 'XL', 'XXL']
),
(
  'Moroccan Djellaba',
  'Elegant Moroccan-style kaftan with hood and traditional geometric patterns. Perfect for cultural events and celebrations.',
  'kaftans',
  320.00,
  'USD',
  ARRAY['https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800'],
  ARRAY['Fine Cotton', 'Wool Blend', 'Silk'],
  ARRAY['Beige', 'Brown', 'Navy', 'Maroon'],
  ARRAY['M', 'L', 'XL', 'XXL']
);