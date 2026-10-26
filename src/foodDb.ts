import { STARTER } from './foodData';
import { normText } from './refdata';
export type FPer = { k: number; p: number; c: number; f: number; fi?: number | null };
export type FoodRec = { id: string; name: string; search: string; g: number; label: string; per: FPer; src: 'starter' | 'custom' | 'imported'; cat: string; status: 'verified' | 'approximate' | 'estimate' | 'user'; srcLabel: string; prep?: string };
export const CATS: Record<string, [string, string]> = { meat:['لحوم ودواجن','Meat & poultry'], fish:['أسماك ومأكولات بحرية','Fish & seafood'], dairy:['ألبان وبيض','Dairy & eggs'], grains:['حبوب وخبز','Grains & bread'], legumes:['بقوليات','Legumes'], fruit:['فواكه','Fruit'], veg:['خضروات','Vegetables'], nuts:['مكسرات وبذور','Nuts & seeds'], oils:['زيوت ودهون','Oils & fats'], sweets:['حلويات ومشروبات','Sweets & drinks'], dish:['أطباق ووصفات','Dishes & recipes'], other:['أخرى','Other'] };
const CAT: Record<string, string> = { chicken:'meat', egg:'dairy', rice:'grains', pita:'grains', oats:'grains', milk:'dairy', yogurt:'dairy', banana:'fruit', apple:'fruit', dates:'fruit', potato:'veg', beef:'meat', salmon:'fish', tuna:'fish', lentils:'legumes', chickpeas:'legumes', oliveoil:'oils', almonds:'nuts', pbutter:'nuts', cheese:'dairy', tomato:'veg', cucumber:'veg', broccoli:'veg', pasta:'grains', hummus:'legumes', bulgur:'grains', orange:'fruit', honey:'sweets', sugar:'sweets' };
const FIB: Record<string, number | null> = { oats:10.6, apple:2.4, banana:2.6, dates:8, potato:1.8, lentils:7.9, chickpeas:7.6, almonds:12.5, broccoli:2.6, pasta:1.8, hummus:6, bulgur:4.5, orange:2.4, tomato:1.2, cucumber:0.5, rice:0.4, pbutter:6, honey:0.2, chicken:0, egg:0, milk:0, yogurt:0, beef:0, salmon:0, tuna:0, cheese:0, oliveoil:0, sugar:0, pita:null };
// [id, ar, en, cat, serving g, serving ar, serving en, kcal, protein, carbs, fat, fiber] — all per 100 g, typical/approximate values (not individually verified)
export const EXTRA: [string, string, string, string, number, string, string, number, number, number, number, number][] = [
  ['lamb','لحم غنم مطبوخ','Lamb, cooked','meat',100,'100 غ','100 g',294,25,0,21,0], ['turkey','صدر ديك رومي مطبوخ','Turkey breast, cooked','meat',100,'100 غ','100 g',135,30,0,1,0],
  ['shrimp','روبيان مطبوخ','Shrimp, cooked','fish',100,'100 غ','100 g',99,24,0.2,0.3,0], ['cod','سمك قد مطبوخ','Cod, cooked','fish',100,'100 غ','100 g',105,23,0,0.9,0],
  ['sardines','سردين معلب بالزيت','Sardines, canned in oil','fish',100,'100 غ','100 g',208,25,0,11,0], ['skimmilk','حليب خالي الدسم','Skim milk','dairy',240,'كوب','1 cup',34,3.4,5,0.1,0],
  ['feta','جبن فيتا','Feta cheese','dairy',30,'30 غ','30 g',264,14,4.1,21,0], ['mozzarella','جبن موزاريلا','Mozzarella','dairy',30,'30 غ','30 g',280,28,3.1,17,0],
  ['cottage','جبن قريش','Cottage cheese','dairy',100,'100 غ','100 g',98,11,3.4,4.3,0], ['butter','زبدة','Butter','oils',10,'ملعقة صغيرة','1 tsp',717,0.9,0.1,81,0],
  ['ghee','سمن','Ghee','oils',13,'ملعقة كبيرة','1 tbsp',900,0,0,100,0], ['tahini','طحينة','Tahini','nuts',15,'ملعقة كبيرة','1 tbsp',595,17,21,54,9.3],
  ['walnuts','جوز','Walnuts','nuts',28,'حفنة','1 handful',654,15,14,65,6.7], ['pistachio','فستق','Pistachios','nuts',28,'حفنة','1 handful',560,20,28,45,10],
  ['whitebread','خبز أبيض','White bread','grains',30,'شريحة','1 slice',265,9,49,3.2,2.7], ['wholebread','خبز قمح كامل','Whole wheat bread','grains',30,'شريحة','1 slice',247,13,41,3.4,6.8],
  ['brownrice','رز بني مطبوخ','Brown rice, cooked','grains',150,'كوب','1 cup',112,2.3,23,0.8,1.8], ['quinoa','كينوا مطبوخة','Quinoa, cooked','grains',150,'كوب','1 cup',120,4.4,21,1.9,2.8],
  ['couscous','كسكس مطبوخ','Couscous, cooked','grains',150,'كوب','1 cup',112,3.8,23,0.2,1.4], ['corn','ذرة مطبوخة','Corn, cooked','veg',100,'100 غ','100 g',96,3.4,21,1.5,2.4],
  ['peas','بازلاء مطبوخة','Green peas, cooked','veg',80,'نصف كوب','½ cup',81,5.4,14,0.4,5.7], ['kidney','فاصولياء حمراء مطبوخة','Kidney beans, cooked','legumes',180,'كوب','1 cup',127,8.7,22.8,0.5,6.4],
  ['fava','فول مطبوخ','Fava beans, cooked','legumes',170,'كوب','1 cup',110,7.6,19.7,0.4,5.4], ['spinach','سبانخ نيئة','Spinach, raw','veg',30,'كوب','1 cup',23,2.9,3.6,0.4,2.2],
  ['carrot','جزر','Carrot','veg',60,'حبة','1 medium',41,0.9,9.6,0.2,2.8], ['onion','بصل','Onion','veg',110,'حبة','1 medium',40,1.1,9.3,0.1,1.7],
  ['eggplant','باذنجان','Eggplant','veg',100,'100 غ','100 g',25,1,6,0.2,3], ['zucchini','كوسا','Zucchini','veg',100,'100 غ','100 g',17,1.2,3.1,0.3,1],
  ['okra','باميا','Okra','veg',100,'100 غ','100 g',33,1.9,7.5,0.2,3.2], ['grapes','عنب','Grapes','fruit',150,'كوب','1 cup',69,0.7,18,0.2,0.9],
  ['watermelon','رقي (بطيخ أحمر)','Watermelon','fruit',150,'كوب','1 cup',30,0.6,7.6,0.2,0.4], ['pomegranate','رمان','Pomegranate (arils)','fruit',100,'100 غ','100 g',83,1.7,19,1.2,4],
  ['strawberry','فراولة','Strawberries','fruit',150,'كوب','1 cup',32,0.7,7.7,0.3,2], ['avocado','أفوكادو','Avocado','fruit',100,'100 غ','100 g',160,2,9,15,6.7],
  ['cola','مشروب غازي (كولا)','Cola soft drink','sweets',330,'علبة','1 can',42,0,10.6,0,0], ['ojuice','عصير برتقال','Orange juice','sweets',240,'كوب','1 cup',45,0.7,10,0.2,0.2],
  ['darkchoc','شوكولاتة داكنة','Dark chocolate (70–85%)','sweets',20,'قطعتان','2 squares',546,4.9,61,31,11],
];
// Recipe templates: ingredient grams are rough estimates; totals are computed from the ingredient values, not invented per dish.
export const RECIPES: [string, string, string, [string, number][]][] = [
  ['r_okra','مرق باميا باللحم','Okra stew with meat',[['okra',200],['beef',80],['tomato',100],['onion',40],['oliveoil',10]]],
  ['r_lentil','شوربة عدس','Lentil soup',[['lentils',150],['onion',40],['carrot',50],['oliveoil',8]]],
  ['r_mujaddara','مجدرة (رز وعدس)','Mujaddara (rice & lentils)',[['rice',150],['lentils',100],['onion',40],['oliveoil',10]]],
  ['r_tashreeb','تشريب دجاج','Chicken tashreeb',[['pita',60],['chicken',100],['chickpeas',80],['onion',40],['tomato',80],['oliveoil',8]]],
];
const SL = 'Typical values (approximate, not individually verified)';
export function bundledFoods(lang: 'ar' | 'en'): FoodRec[] {
  const i = lang === 'ar' ? 0 : 1;
  const a = STARTER.map((s) => ({ id: s[0], name: s[1 + i], search: normText(s[1] + ' ' + s[2]), g: s[3], label: s[4 + i], per: { k: s[6], p: s[7], c: s[8], f: s[9], fi: FIB[s[0]] ?? null }, src: 'starter' as const, cat: CAT[s[0]] ?? 'other', status: 'approximate' as const, srcLabel: SL }));
  const b = EXTRA.map((s) => ({ id: s[0], name: s[1 + i], search: normText(s[1] + ' ' + s[2]), g: s[4], label: s[5 + i], per: { k: s[7], p: s[8], c: s[9], f: s[10], fi: s[11] }, src: 'starter' as const, cat: s[3], status: 'approximate' as const, srcLabel: SL }));
  return [...a, ...b];
}
export function recToFood(r: any, n: (k: string) => string): FoodRec {
  if (r.ref) return { id: r.id, name: r.name, search: normText(r.name), g: r.g, label: r.label, per: r.per, src: 'imported', cat: r.cat ?? 'other', status: r.status, srcLabel: `${r.src} · ${r.license}`, prep: r.prep };
  return { id: r.id, name: r.name, search: normText(r.name), g: r.g, label: `${r.g} ${n('g')}`, per: r.per, src: 'custom', cat: r.recipe ? 'dish' : r.cat ?? 'other', status: r.recipe ? 'estimate' : 'user', srcLabel: r.recipe ? 'Recipe estimate from ingredients' : 'User-entered' };
}
