INSERT INTO foods (slug, name, brand, protein_dm, fat_dm, carb_dm, ingredients_json, updated_at)
VALUES
('wellness-core-original','웰니스 코어 오리지날 포뮬라 (샘플)','Wellness',45,18,22,'["닭고기","칠면조","닭지방","완두","치커리뿌리","연어오일"]', datetime('now')),
('acana-grasslands','아카나 그라스랜드 (샘플)','ACANA',42,20,20,'["오리","닭고기","계란","청어","호박","로즈마리추출물"]', datetime('now'))
ON CONFLICT(slug) DO UPDATE SET
  name=excluded.name,
  brand=excluded.brand,
  protein_dm=excluded.protein_dm,
  fat_dm=excluded.fat_dm,
  carb_dm=excluded.carb_dm,
  ingredients_json=excluded.ingredients_json,
  updated_at=excluded.updated_at;
