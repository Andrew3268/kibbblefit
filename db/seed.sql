-- Seed data (optional)
INSERT INTO foods (
  slug, name, brand, life_stage,
  crude_protein, crude_fat, calcium, phosphorus, ash, crude_fiber, moisture,
  ingredients_json, updated_at
) VALUES (
  'test-food',
  '테스트 사료',
  '테스트 브랜드',
  '전연령',
  36, 18, 1.2, 1.0, 8, 3, 10,
  '["닭고기","칠면조","닭지방","완두","치커리뿌리"]',
  datetime('now')
);
