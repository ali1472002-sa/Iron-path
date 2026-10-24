export const MUSCLES = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'] as const;
// p = illustration pose; sar/sen = steps separated by "|"
export const EXERCISES = [
 { id:'pushup', ar:'تمرين الضغط', en:'Push-up', m:'chest', p:'push', sar:'ضع يديك أسفل الكتفين والجسم مستقيم|انزل بالصدر نحو الأرض|ادفع للأعلى دون ارتخاء الورك', sen:'Hands under shoulders, body straight|Lower chest toward the floor|Push up without sagging hips' },
 { id:'widepush', ar:'ضغط واسع', en:'Wide push-up', m:'chest', p:'push', sar:'باعد يديك أوسع من الكتفين|انزل ببطء|ادفع بقوة للأعلى', sen:'Hands wider than shoulders|Lower slowly|Press up hard' },
 { id:'kneepush', ar:'ضغط على الركبتين', en:'Knee push-up', m:'chest', p:'push', sar:'اسند ركبتيك على الأرض|حافظ على خط مستقيم من الركبة للرأس|انزل وارتفع بتحكم', sen:'Rest knees on the floor|Keep a straight line from knees to head|Lower and rise with control' },
 { id:'pullup', ar:'عقلة', en:'Pull-up', m:'back', p:'pull', sar:'علّق بالقضيب وكتفاك مشدودان|اسحب صدرك نحو القضيب|انزل ببطء حتى تمدد ذراعيك', sen:'Hang with shoulders engaged|Pull chest toward the bar|Lower slowly to full arm extension' },
 { id:'row', ar:'تجديف بالدمبل', en:'Dumbbell row', m:'back', p:'hinge', sar:'انحنِ من الورك وظهرك مستقيم|اسحب الدمبل نحو خصرك|انزل ببطء', sen:'Hinge at hips, back flat|Pull dumbbell toward your waist|Lower slowly' },
 { id:'deadlift', ar:'الرفعة الميتة', en:'Deadlift', m:'back', p:'hinge', sar:'قف والثقل قرب ساقيك|انحنِ من الورك بظهر مستقيم|قف بدفع الأرض بقدميك', sen:'Stand with the weight close to your legs|Hinge at hips, back flat|Stand up by driving through your feet' },
 { id:'squat', ar:'سكوات', en:'Squat', m:'legs', p:'squat', sar:'قدماك بعرض الكتفين|انزل بالورك للخلف وللأسفل|اصعد بدفع الأرض', sen:'Feet shoulder-width apart|Sit hips back and down|Rise by pushing the floor away' },
 { id:'goblet', ar:'سكوات بالدمبل', en:'Goblet squat', m:'legs', p:'squat', sar:'امسك الدمبل أمام صدرك|انزل مع إبقاء الصدر مرتفعاً|اصعد بتحكم', sen:'Hold a dumbbell at your chest|Descend keeping chest tall|Rise with control' },
 { id:'rdl', ar:'رفعة رومانية', en:'Romanian deadlift', m:'legs', p:'hinge', sar:'ركبتاك مثنيتان قليلاً|ادفع الورك للخلف وانزل بالثقل|اصعد بشدّ الأرداف', sen:'Soft knees|Push hips back and lower the weight|Rise by squeezing glutes' },
 { id:'ohp', ar:'ضغط الكتف', en:'Overhead press', m:'shoulders', p:'press', sar:'ابدأ بالثقل عند الكتفين|ادفعه فوق رأسك|انزل بتحكم', sen:'Start with weights at shoulders|Press overhead|Lower with control' },
 { id:'lateral', ar:'رفرفة جانبية', en:'Lateral raise', m:'shoulders', p:'raise', sar:'دمبل في كل يد بجانبك|ارفع الذراعين جانباً حتى الكتفين|انزل ببطء', sen:'Dumbbell in each hand at your sides|Raise arms out to shoulder height|Lower slowly' },
 { id:'curl', ar:'بيسبس بالدمبل', en:'Biceps curl', m:'arms', p:'curl', sar:'ثبّت المرفقين بجانب جسمك|اثنِ الذراع نحو الكتف|انزل ببطء', sen:'Pin elbows at your sides|Curl toward the shoulder|Lower slowly' },
 { id:'hammer', ar:'تمرين المطرقة', en:'Hammer curl', m:'arms', p:'curl', sar:'اجعل راحتيك متقابلتين|اثنِ الذراع دون تحريك المرفق|انزل بتحكم', sen:'Palms face each other|Curl without moving the elbow|Lower with control' },
 { id:'plank', ar:'بلانك', en:'Plank', m:'core', p:'plank', sar:'ارتكز على ساعديك وأصابع قدميك|شدّ البطن وحافظ على جسم مستقيم|تنفس بانتظام وثبّت', sen:'Rest on forearms and toes|Brace abs, keep body straight|Breathe steadily and hold' },
];
