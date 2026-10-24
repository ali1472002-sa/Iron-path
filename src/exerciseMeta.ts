// Extra data for each built-in exercise in exercises.ts. To add an exercise: add it there, then add its row in META.
export const LB: Record<string, [string, string]> = {
  pecs:['عضلات الصدر','Pectorals'], lats:['الظهرية العريضة','Latissimus dorsi'], upback:['أعلى الظهر','Upper back'], lowback:['أسفل الظهر','Lower back'],
  quads:['الفخذ الأمامية','Quadriceps'], glutes:['الألوية','Glutes'], hams:['الفخذ الخلفية','Hamstrings'], delts:['الكتف','Deltoids'],
  biceps:['ذات الرأسين','Biceps'], triceps:['ثلاثية الرؤوس','Triceps'], forearms:['الساعدان','Forearms'], abs:['عضلات البطن','Abdominals'],
  bodyweight:['وزن الجسم','Bodyweight'], dumbbell:['دمبل','Dumbbell'], barbell:['بار','Barbell'], bar:['عقلة','Pull-up bar'],
  t_push:['دفع','Push'], t_pull:['سحب','Pull'], t_legs:['أرجل','Legs'], t_core:['جذع','Core'], t_iso:['عزل','Isolation'],
  b:['مبتدئ','Beginner'], i:['متوسط','Intermediate'], a:['متقدم','Advanced'],
};
export const U: Record<string, [string, string]> = {
  all:['الكل','All'], m:['العضلة','Muscle'], eq:['المعدات','Equipment'], ty:['النوع','Type'], lv:['المستوى','Level'], back:['رجوع','Back'],
  primary:['العضلات الرئيسية','Primary muscles'], secondary:['العضلات الثانوية','Secondary muscles'], steps:['خطوات الأداء','How to perform'],
  breath:['التنفس','Breathing'], mistakes:['أخطاء شائعة','Common mistakes'], safety:['السلامة','Safety'],
  diagram:['مخطط توضيحي مبسّط وليس صورة واقعية','Simplified diagram, not a realistic image'],
  plan:['الخطة الحالية','Current plan'], addPlan:['أضف إلى الخطة','Add to plan'], inPlan:['في الخطة ✔','In plan ✔'],
  favOnly:['المفضلة فقط','Favorites only'], none:['لا توجد نتائج','No results'],
};
// [primary, secondary (comma list), equipment, type, level]
export const META: Record<string, string[]> = {
  pushup:['pecs','triceps,delts,abs','bodyweight','t_push','b'], widepush:['pecs','delts,triceps','bodyweight','t_push','b'],
  kneepush:['pecs','triceps,delts','bodyweight','t_push','b'], pullup:['lats','biceps,upback,forearms','bar','t_pull','i'],
  row:['lats','upback,biceps,forearms','dumbbell','t_pull','b'], deadlift:['glutes','hams,lowback,upback,forearms','barbell','t_pull','i'],
  squat:['quads','glutes,hams,abs','bodyweight','t_legs','b'], goblet:['quads','glutes,abs,delts','dumbbell','t_legs','b'],
  rdl:['hams','glutes,lowback,forearms','dumbbell','t_legs','i'], ohp:['delts','triceps,upback,abs','dumbbell','t_push','i'],
  lateral:['delts','upback','dumbbell','t_iso','b'], curl:['biceps','forearms','dumbbell','t_iso','b'],
  hammer:['biceps','forearms','dumbbell','t_iso','b'], plank:['abs','delts,glutes,lowback','bodyweight','t_core','b'],
};
// per movement pattern: [breathing, mistakes ("|" separated), safety] each as [ar, en]
export const POSE: Record<string, [string, string][]> = {
  push:[['شهيق أثناء النزول وزفير أثناء الدفع للأعلى.','Inhale as you lower, exhale as you press up.'],['ارتخاء الورك أو رفعه|إبعاد المرفقين كثيراً عن الجسم','Hips sagging or piking|Elbows flaring far from the body'],['توقف عند ألم حاد في الكتف أو المعصم وانتقل لنسخة أسهل.','Stop at sharp shoulder or wrist pain and switch to an easier variation.']],
  squat:[['شهيق أثناء النزول وزفير أثناء الصعود.','Inhale on the way down, exhale on the way up.'],['انهيار الركبتين للداخل|رفع الكعبين عن الأرض','Knees caving inward|Heels lifting off the floor'],['حافظ على ظهر محايد ولا تنزل أعمق مما تسمح به حركتك دون ألم.','Keep a neutral spine and only go as deep as you can without pain.']],
  hinge:[['شهيق مع شدّ البطن قبل النزول وزفير أثناء الصعود.','Inhale and brace before lowering, exhale as you rise.'],['تقوّس أسفل الظهر|ابتعاد الثقل عن الساقين','Rounding the lower back|Weight drifting away from the legs'],['ابدأ بوزن خفيف لتتقن الوضعية، ولا ترفع إن لم تستطع إبقاء ظهرك مستقيماً.','Start light to learn the form; do not lift if you cannot keep your back flat.']],
  pull:[['زفير أثناء السحب وشهيق أثناء النزول.','Exhale as you pull, inhale as you lower.'],['التأرجح بالجسم لاكتساب زخم|رفع الكتفين نحو الأذنين','Swinging the body for momentum|Shrugging shoulders toward the ears'],['انزل بتحكم ولا تسقط فجأة لحماية المرفقين والكتفين.','Lower with control; do not drop suddenly, to protect elbows and shoulders.']],
  press:[['شهيق قبل الدفع وزفير أثناء الرفع.','Inhale before pressing, exhale as you lift.'],['تقوّس الظهر للخلف|دفع الثقل أمام الرأس بدل فوقه','Arching the back|Pressing in front of the head instead of overhead'],['استخدم وزناً تتحكم فيه بالكامل وتوقف عند ألم الكتف.','Use a weight you fully control and stop at shoulder pain.']],
  curl:[['زفير أثناء الثني وشهيق أثناء النزول.','Exhale as you curl, inhale as you lower.'],['تأرجح الجذع|تحريك المرفقين للأمام','Swinging the torso|Letting the elbows drift forward'],['لا تستخدم وزناً يجبرك على التأرجح.','Avoid a weight that forces you to swing.']],
  raise:[['زفير أثناء الرفع وشهيق أثناء النزول.','Exhale as you raise, inhale as you lower.'],['رفع الذراعين فوق مستوى الكتفين|وزن ثقيل مع تأرجح','Raising above shoulder height|Heavy weight with swinging'],['ارفع حتى مستوى الكتف فقط وبوزن خفيف.','Raise only to shoulder height, using light weight.']],
  plank:[['تنفس بانتظام ولا تحبس النفس.','Breathe steadily; do not hold your breath.'],['ارتفاع الورك أو هبوطه|حبس النفس','Hips rising or dropping|Holding your breath'],['توقف عند ألم أسفل الظهر وقصّر مدة التثبيت.','Stop at lower-back pain and shorten the hold.']],
};
