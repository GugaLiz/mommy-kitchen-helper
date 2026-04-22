-- mommy-kitchen-helper seed data
-- Safe to run multiple times. Existing recipes with the same name will be updated.

insert into public.recipes (
  name,
  min_age_months,
  max_age_months,
  cooking_time,
  tags,
  allergens,
  ingredients,
  steps,
  tips,
  nutrition_info,
  image_url
)
values
(
  '番茄鸡蛋蝴蝶面',
  10,
  48,
  15,
  array['补蛋白', '易消化'],
  array['鸡蛋'],
  '[
    {"name":"蝴蝶面","quantity":"30","unit":"g"},
    {"name":"番茄","quantity":"1","unit":"个（约100g）"},
    {"name":"鸡蛋黄","quantity":"1","unit":"个"},
    {"name":"核桃油","quantity":"2","unit":"滴"}
  ]'::jsonb,
  '[
    {"step":1,"description":"番茄划十字烫去皮，切成小丁。"},
    {"step":2,"description":"锅中倒入核桃油，炒番茄至出汁。"},
    {"step":3,"description":"加适量清水煮开，下蝴蝶面煮软。"},
    {"step":4,"description":"淋入蛋黄液，搅拌1分钟即可出锅。"}
  ]'::jsonb,
  '番茄尽量选择熟透的，味道更柔和。',
  '番茄富含维生素C，蛋黄补铁补蛋白。',
  null
),
(
  '西兰花炒虾仁 + 软米饭',
  12,
  60,
  20,
  array['补钙', '高蛋白'],
  array['海鲜'],
  '[
    {"name":"西兰花","quantity":"50","unit":"g"},
    {"name":"虾仁","quantity":"6","unit":"只"},
    {"name":"软米饭","quantity":"1","unit":"小碗"}
  ]'::jsonb,
  '[
    {"step":1,"description":"西兰花焯水切碎，虾仁去虾线。"},
    {"step":2,"description":"锅中少油，先炒虾仁再下西兰花。"},
    {"step":3,"description":"加少量温水焖2分钟，搭配软米饭食用。"}
  ]'::jsonb,
  '虾仁可切碎后再炒，更适合小龄宝宝。',
  '虾仁补充优质蛋白和钙，西兰花补充维生素。',
  null
),
(
  '南瓜小米粥 + 蒸鳕鱼',
  10,
  60,
  25,
  array['易消化', '补锌'],
  array['鱼类'],
  '[
    {"name":"南瓜","quantity":"80","unit":"g"},
    {"name":"小米","quantity":"25","unit":"g"},
    {"name":"鳕鱼","quantity":"60","unit":"g"}
  ]'::jsonb,
  '[
    {"step":1,"description":"南瓜切块与小米同煮成粥。"},
    {"step":2,"description":"鳕鱼去刺，隔水蒸8分钟。"},
    {"step":3,"description":"将蒸好的鳕鱼撕成小块搭配粥食用。"}
  ]'::jsonb,
  '鳕鱼蒸后检查鱼刺，确保入口安全。',
  '南瓜富含胡萝卜素，鳕鱼补充优质蛋白。',
  null
),
(
  '奶酪虾仁饼',
  14,
  60,
  18,
  array['补钙', '手指食物'],
  array['海鲜', '牛奶'],
  '[
    {"name":"虾仁","quantity":"80","unit":"g"},
    {"name":"奶酪碎","quantity":"20","unit":"g"},
    {"name":"土豆泥","quantity":"50","unit":"g"}
  ]'::jsonb,
  '[
    {"step":1,"description":"虾仁剁碎，与土豆泥、奶酪碎拌匀。"},
    {"step":2,"description":"整理成小圆饼，平底锅小火两面煎熟。"}
  ]'::jsonb,
  '奶酪用低钠款，煎制时少油即可。',
  '补钙和优质蛋白兼具，适合食欲一般时补营养。',
  null
),
(
  '牛油果香蕉奶昔',
  12,
  60,
  8,
  array['增重', '高能量'],
  array['牛奶'],
  '[
    {"name":"牛油果","quantity":"1/2","unit":"个"},
    {"name":"香蕉","quantity":"1/2","unit":"根"},
    {"name":"配方奶","quantity":"150","unit":"ml"}
  ]'::jsonb,
  '[
    {"step":1,"description":"牛油果与香蕉切块。"},
    {"step":2,"description":"加入配方奶打成细腻奶昔。"}
  ]'::jsonb,
  '现打现喝，口感最佳。',
  '提供优质脂肪和能量，适合作为加餐。',
  null
),
(
  '菠菜猪肝面',
  11,
  60,
  18,
  array['补铁', '高蛋白'],
  array['小麦'],
  '[
    {"name":"猪肝","quantity":"20","unit":"g"},
    {"name":"菠菜","quantity":"35","unit":"g"},
    {"name":"宝宝面","quantity":"30","unit":"g"}
  ]'::jsonb,
  '[
    {"step":1,"description":"猪肝浸泡去腥，焯水后剁泥。"},
    {"step":2,"description":"菠菜焯水切碎，下面条煮软。"},
    {"step":3,"description":"加入猪肝泥和菠菜再煮2分钟。"}
  ]'::jsonb,
  '猪肝一周1-2次即可，不宜过量。',
  '富含铁和叶酸，对补铁期友好。',
  null
),
(
  '胡萝卜肉末蒸蛋',
  9,
  60,
  16,
  array['补蛋白', '细腻口感'],
  array['鸡蛋'],
  '[
    {"name":"鸡蛋","quantity":"1","unit":"个"},
    {"name":"肉末","quantity":"20","unit":"g"},
    {"name":"胡萝卜","quantity":"20","unit":"g"}
  ]'::jsonb,
  '[
    {"step":1,"description":"鸡蛋打散加温水，过滤后入碗。"},
    {"step":2,"description":"肉末和胡萝卜碎焯熟后放表面。"},
    {"step":3,"description":"冷水入锅蒸10分钟。"}
  ]'::jsonb,
  '加盖保鲜膜可减少蜂窝，口感更嫩。',
  '蛋白质和胡萝卜素丰富。',
  null
),
(
  '牛奶燕麦粥',
  12,
  60,
  10,
  array['早餐快手', '补钙'],
  array['牛奶', '燕麦'],
  '[
    {"name":"燕麦片","quantity":"25","unit":"g"},
    {"name":"配方奶","quantity":"180","unit":"ml"},
    {"name":"蓝莓","quantity":"4","unit":"颗"}
  ]'::jsonb,
  '[
    {"step":1,"description":"燕麦加入温奶小火煮4分钟。"},
    {"step":2,"description":"出锅后撒少量蓝莓碎即可。"}
  ]'::jsonb,
  '蓝莓可替换成熟香蕉，更柔软。',
  '补钙同时兼顾膳食纤维。',
  null
)
on conflict (name) do update set
  min_age_months = excluded.min_age_months,
  max_age_months = excluded.max_age_months,
  cooking_time = excluded.cooking_time,
  tags = excluded.tags,
  allergens = excluded.allergens,
  ingredients = excluded.ingredients,
  steps = excluded.steps,
  tips = excluded.tips,
  nutrition_info = excluded.nutrition_info,
  image_url = excluded.image_url,
  updated_at = now();
