// Extra data for each built-in exercise in exercises.ts. To add an exercise: add it there, then add its row in META.
import { EXTRA_META, TIPS as EXTRA_TIPS } from './exercisesExtra';
import { GYM_META, GYM_TIPS, EXTRA_LB } from './gymLib';
export const LB: Record<string, [string, string]> = {
  calves:['السمانة','Calves'], obliques:['العضلات المائلة','Obliques'], traps:['شبه المنحرف','Trapezius'], neck:['الرقبة','Neck'], abductors:['المبعِّدات','Abductors'], adductors:['المقرِّبات','Adductors'],
  cable:['كابل','Cable'], machine:['جهاز','Machine'], band:['شريط مقاومة','Resistance band'], kettlebell:['كيتلبل','Kettlebell'], other:['أخرى','Other'],
  t_mob:['مرونة','Mobility'], t_cond:['لياقة / كارديو','Conditioning'], t_warm:['إحماء','Warm-up'],
  pecs:['عضلات الصدر','Pectorals'], lats:['الظهرية العريضة','Latissimus dorsi'], upback:['أعلى الظهر','Upper back'], lowback:['أسفل الظهر','Lower back'],
  quads:['الفخذ الأمامية','Quadriceps'], glutes:['الألوية','Glutes'], hams:['الفخذ الخلفية','Hamstrings'], delts:['الكتف','Deltoids'],
  biceps:['ذات الرأسين','Biceps'], triceps:['ثلاثية الرؤوس','Triceps'], forearms:['الساعدان','Forearms'], abs:['عضلات البطن','Abdominals'],
  bodyweight:['وزن الجسم','Bodyweight'], dumbbell:['دمبل','Dumbbell'], barbell:['بار','Barbell'], bar:['عقلة','Pull-up bar'],
  t_push:['دفع','Push'], t_pull:['سحب','Pull'], t_legs:['أرجل','Legs'], t_core:['جذع','Core'], t_iso:['عزل','Isolation'],
  b:['مبتدئ','Beginner'], i:['متوسط','Intermediate'], a:['متقدم','Advanced'],
};
export const U: Record<string, [string, string]> = {
  muscles:['العضلات المستهدفة','Target muscles'], muscleNote:['تظليل العضلات مبسّط وغير مراجَع من مختص؛ يعتمد على بيانات التمرين في المكتبة.','Simplified muscle shading, not reviewed by a specialist; based on the exercise data in the library.'], muscleImp:['بيانات العضلات مستوردة وتحتاج إلى مراجعة قبل الاعتماد عليها.','Muscle data was imported and needs review before you rely on it.'],
  muscleRev:['تظليل العضلات لهذه الحركة تقريبي ويحتاج إلى مراجعة مختص قبل الاعتماد عليه.','Muscle shading for this movement is approximate and needs a specialist review before you rely on it.'],
  pat:['نمط الحركة','Movement pattern'], setup:['ضبط الجهاز ووضع الجسم','Setup and body position'], startP:['وضع البداية','Start position'], endP:['وضع النهاية','End position'], need:['المعدات المطلوبة','Equipment needed'], noMach:['إن لم يتوفر الجهاز','If the machine is not available'], doseT:['الجرعة الإرشادية حسب الهدف','Indicative dose by goal'], dStr:['قوة','Strength'], dHyp:['تضخيم','Hypertrophy'], dEnd:['تحمّل','Endurance'], sets:['مجموعات','sets'], reps:['تكرار','reps'], doseNote:['أرقام إرشادية عامة وليست وصفة؛ عدّلها حسب مستواك وتعافيك.','General guide figures, not a prescription; adjust to your level and recovery.'], uni:['أحادي الجانب: كرّر على الجانبين','Unilateral: repeat on both sides'], dataFull:['بيانات مكتملة','Complete data'], dataNoMedia:['شرح نصي مكتمل، الرسم لم يكتمل','Full text; illustration pending'], dataPart:['بيانات غير مكتملة','Incomplete data'], mediaOk:['رسم توضيحي متحرك','Animated diagram'], mediaNo:['بلا رسم','No diagram'], pt:['نمط','Pattern'], withMedia:['مع رسم فقط','With diagram only'], count:['تمرين','exercises'], clear:['مسح الفلاتر','Clear filters'], uniTag:['جانب واحد','Single side'], 
  all:['الكل','All'], rx:['الجرعة المقترحة (للتضخيم، قابلة للتعديل)','Suggested dose (hypertrophy, adjustable)'], prog:['التدرّج: عند إكمال كل المجموعات بأعلى تكرار، زد الحمل زيادة صغيرة. توقف عند الألم ولا تتمرّن رغمه.','Progression: when every set reaches the top of the range, add a small load. Stop at pain; never train through it.'], alts:['بدائل من المكتبة','Alternatives from the library'], restW:['راحة','rest'], noFig:['لا يتوفر رسم لهذا التمرين؛ اتبع الخطوات النصية.','No illustration for this exercise; follow the text steps.'], more:['عرض المزيد','Show more'],
  importEx:['استيراد تمارين (free-exercise-db JSON)','Import exercises (free-exercise-db JSON)'], importHelp:['نزّل exercises.json من مستودع yuhonas/free-exercise-db (ترخيص Unlicense) ثم اخترها هنا. الإنجليزية فقط، بدون صور.','Download exercises.json from yuhonas/free-exercise-db (Unlicense), then pick it here. English only, no images.'], repKey:['أُضيف / حُدِّث / تُجوهل / رُفض / شبه مكرر','imported / updated / skipped / rejected / near-dup'], delImp:['حذف كل التمارين المستوردة','Delete all imported exercises'], m:['العضلة','Muscle'], eq:['المعدات','Equipment'], ty:['النوع','Type'], lv:['المستوى','Level'], back:['رجوع','Back'],
  primary:['العضلات الرئيسية','Primary muscles'], secondary:['العضلات الثانوية','Secondary muscles'], steps:['خطوات الأداء','How to perform'],
  breath:['التنفس','Breathing'], mistakes:['أخطاء شائعة','Common mistakes'], safety:['السلامة','Safety'],
  diagram:['مخطط توضيحي مبسّط وليس صورة واقعية','Simplified diagram, not a realistic image'],
  plan:['الخطة الحالية','Current plan'], addPlan:['أضف إلى الخطة','Add to plan'], inPlan:['في الخطة ','In plan '],
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

Object.assign(META, EXTRA_META, GYM_META);
Object.assign(LB, EXTRA_LB);
export const TIPS = { ...EXTRA_TIPS, ...GYM_TIPS };
