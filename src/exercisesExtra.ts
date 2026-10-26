// Additional curated exercises (appended to the built-in list; ids are stable). Pose illustrations exist only for the original 14; these show text instructions.
const E = (id: string, ar: string, en: string, m: string, sar: string, sen: string) => ({ id, ar, en, m, p: undefined as string | undefined, sar, sen });
export const EXTRA_EX = [
  E('benchpress','ضغط البار على المقعد','Barbell bench press','chest','استلقِ وكتفاك مشدودان وقدماك ثابتتان|أنزل البار إلى منتصف الصدر بتحكم|ادفعه للأعلى حتى فرد الذراعين','Lie back with shoulders set and feet planted|Lower the bar to mid-chest under control|Press up until your arms are straight'),
  E('dbpress','ضغط الدمبل على المقعد','Dumbbell bench press','chest','استلقِ والدمبلان عند جانبي الصدر|ادفعهما للأعلى حتى يتقاربا فوق الصدر|انزل ببطء حتى يعود الدمبلان لمستوى الصدر','Lie back with dumbbells at chest level|Press them up until they meet above your chest|Lower slowly back to chest level'),
  E('dbfly','فتح الدمبل','Dumbbell fly','chest','استلقِ والدمبلان فوق الصدر وكوعاك مثنيان قليلاً|افتح ذراعيك حتى مستوى الكتفين|اضمّهما للأعلى بحركة قوسية','Lie back with dumbbells above your chest, elbows slightly bent|Open your arms to shoulder level|Bring them back up in an arc'),
  E('pulldown','سحب علوي','Lat pulldown','back','أمسك القضيب بعرض أوسع من الكتفين|اسحبه نحو أعلى الصدر مع ضم لوحي الكتف|أرجعه للأعلى ببطء','Grip the bar wider than shoulders|Pull it to upper chest, squeezing shoulder blades|Return slowly'),
  E('cablerow','تجديف بالكابل جالساً','Seated cable row','back','اجلس بصدر مرتفع وركبتين مثنيتين قليلاً|اسحب المقبض نحو بطنك|أرجعه ببطء دون انحناء الظهر','Sit tall with soft knees|Pull the handle toward your belly|Return slowly without rounding your back'),
  E('facepull','سحب نحو الوجه','Face pull','shoulders','اضبط الكابل بمستوى الوجه|اسحب الحبل نحو وجهك مع فتح المرفقين|أرجعه بتحكم','Set the cable at face height|Pull the rope toward your face, elbows wide|Return with control'),
  E('legpress','ضغط الأرجل (جهاز)','Leg press','legs','ضع قدميك بعرض الكتفين على المنصة|انزل حتى تنثني الركبتان بزاوية مريحة|ادفع المنصة دون قفل الركبتين كاملاً','Place feet shoulder-width on the platform|Lower until knees bend to a comfortable angle|Press without fully locking your knees'),
  E('lunge','اندفاع بالدمبل (أحادي)','Dumbbell lunge (unilateral)','legs','قف ممسكاً دمبلاً في كل يد|اخطُ للأمام وانزل حتى تنثني الركبتان|ادفع للعودة وبدّل الساق','Stand holding a dumbbell in each hand|Step forward and lower until both knees bend|Push back and switch legs'),
  E('hipthrust','رفع الورك','Glute bridge / hip thrust','legs','استلقِ وركبتاك مثنيتان وقدماك على الأرض|ارفع الورك حتى يستقيم الجسم من الكتف للركبة|اعصر الأرداف ثم انزل ببطء','Lie with knees bent and feet flat|Lift hips until shoulder-to-knee is a straight line|Squeeze glutes, then lower slowly'),
  E('calfraise','رفع السمانة واقفاً','Standing calf raise','legs','قف وقدماك بعرض الورك|ارتفع على أطراف أصابعك|انزل ببطء حتى مد كامل','Stand with feet hip-width|Rise onto your toes|Lower slowly to a full stretch'),
  E('pushdown','دفع الترايسبس بالكابل','Cable triceps pushdown','arms','ثبّت مرفقيك بجانب جسمك|ادفع المقبض للأسفل حتى فرد الذراعين|ارجع ببطء دون تحريك الكتفين','Pin elbows at your sides|Push the handle down until arms are straight|Return slowly without moving shoulders'),
  E('crunch','تمرين الكرنش','Crunch','core','استلقِ وركبتاك مثنيتان ويداك قرب الأذنين|ارفع الكتفين عن الأرض بتقلص البطن|انزل ببطء','Lie with knees bent, hands near ears|Lift shoulders by contracting abs|Lower slowly'),
  E('russian','التفاف روسي','Russian twist','core','اجلس بميلان خفيف للخلف وقدماك على الأرض|لف الجذع جانباً بتحكم|بدّل الجانبين دون تأرجح','Sit leaning back slightly, feet on the floor|Rotate your torso to one side with control|Alternate sides without swinging'),
  E('bandpull','سحب الشريط للخارج','Band pull-apart','shoulders','أمسك الشريط أمامك بذراعين مستقيمتين|افتح الذراعين جانباً حتى مستوى الصدر|أرجعهما ببطء','Hold the band in front with straight arms|Pull it apart to chest level|Return slowly'),
  E('jacks','قفز الجاك (إحماء)','Jumping jacks (warm-up)','legs','قف وقدماك معاً ويداك بجانبك|اقفز بفتح الساقين ورفع الذراعين|اقفز للعودة بإيقاع ثابت','Stand with feet together, arms at sides|Jump feet apart while raising your arms|Jump back at a steady rhythm'),
  E('catcow','القط والبقرة (مرونة)','Cat–cow (mobility)','core','ابدأ على اليدين والركبتين|قوّس الظهر للأعلى مع زفير|انتقل لتقعير الظهر مع شهيق','Start on hands and knees|Round your back up while exhaling|Arch it down while inhaling'),
];
export const EXTRA_META: Record<string, string[]> = {
  benchpress:['pecs','triceps,delts','barbell','t_push','i'], dbpress:['pecs','triceps,delts','dumbbell','t_push','b'], dbfly:['pecs','delts','dumbbell','t_iso','i'],
  pulldown:['lats','biceps,upback,forearms','cable','t_pull','b'], cablerow:['lats','upback,biceps','cable','t_pull','b'], facepull:['delts','upback','cable','t_pull','b'],
  legpress:['quads','glutes,hams','machine','t_legs','b'], lunge:['quads','glutes,hams','dumbbell','t_legs','b'], hipthrust:['glutes','hams,abs','bodyweight','t_legs','b'],
  calfraise:['calves','','bodyweight','t_legs','b'], pushdown:['triceps','forearms','cable','t_iso','b'], crunch:['abs','obliques','bodyweight','t_core','b'],
  russian:['obliques','abs','bodyweight','t_core','i'], bandpull:['delts','upback','band','t_pull','b'], jacks:['quads','calves,delts','bodyweight','t_warm','b'], catcow:['lowback','abs','bodyweight','t_mob','b'],
};
const T: Record<string, [string, string][]> = {
  press: [['شهيق عند النزول وزفير عند الدفع.','Inhale on the way down, exhale as you press.'],['ارتداد الثقل|رفع الكتفين نحو الأذنين','Bouncing the weight|Shrugging shoulders toward ears'],['استخدم وزناً تتحكم فيه وتوقف عند ألم الكتف أو الصدر.','Use a weight you control; stop at shoulder or chest pain.']],
  pull: [['زفير أثناء السحب وشهيق أثناء العودة.','Exhale as you pull, inhale as you return.'],['استخدام الزخم|رفع الكتفين','Using momentum|Shrugging the shoulders'],['عد بتحكم ولا تترك الثقل يسحبك فجأة.','Return with control; do not let the weight yank you.']],
  legs: [['شهيق عند النزول وزفير عند الصعود.','Inhale going down, exhale coming up.'],['انهيار الركبتين للداخل|قفل الركبتين بقوة','Knees caving inward|Locking knees hard'],['وزن مناسب وظهر محايد؛ توقف عند ألم الركبة.','Suitable weight and neutral spine; stop at knee pain.']],
  iso: [['زفير أثناء الجهد وشهيق أثناء العودة.','Exhale on effort, inhale on return.'],['تأرجح الجسم|تحريك المرفقين','Swinging the body|Moving the elbows'],['لا تستخدم وزناً يجبرك على التأرجح.','Avoid a weight that forces you to swing.']],
  core: [['زفير أثناء التقلص وشهيق أثناء العودة.','Exhale as you contract, inhale as you return.'],['سحب الرقبة باليدين|التسرّع في الحركة','Pulling the neck with your hands|Rushing the movement'],['توقف عند ألم أسفل الظهر.','Stop at lower-back pain.']],
  mob: [['تنفس ببطء وعمق مع الحركة.','Breathe slowly and deeply with the movement.'],['إجبار الحركة|حبس النفس','Forcing the range|Holding your breath'],['حرّك ضمن مدى مريح ولا تدفع عبر الألم.','Move within a comfortable range; never push through pain.']],
  cond: [['تنفس بانتظام دون حبس النفس.','Breathe steadily without holding your breath.'],['الهبوط بقوة على الكعبين|سرعة تفوق لياقتك','Landing hard on heels|Pace beyond your fitness'],['خفّف الوتيرة إن شعرت بدوار أو ألم.','Slow down if you feel dizzy or pain.']],
};
export const TIPS: Record<string, [string, string][]> = {
  benchpress:T.press, dbpress:T.press, dbfly:T.press, pulldown:T.pull, cablerow:T.pull, facepull:T.pull, bandpull:T.pull, legpress:T.legs, lunge:T.legs, hipthrust:T.legs, calfraise:T.legs,
  pushdown:T.iso, crunch:T.core, russian:T.core, catcow:T.mob, jacks:T.cond,
};
