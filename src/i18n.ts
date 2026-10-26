export type Lang = 'ar' | 'en';
const d = {
  ar: { gl:'الأهداف', db:'اللوحة', nu:'التغذية', pl:'الخطة', st:'الأداء', wk:'التمرين', lib:'التمارين',search:'ابحث عن تمرين…',all:'الكل',fav:'المفضلة',favs:'مفضلة',mine:'تمريناتي',newEx:'تمرين مخصص',exName:'اسم التمرين',exSteps:'الخطوات (كل سطر خطوة)',save:'حفظ',start:'البداية',end:'النهاية',chest:'الصدر',back:'الظهر',legs:'الأرجل',shoulders:'الأكتاف',arms:'الذراعان',core:'البطن', app:'آيرون باث', home:'الرئيسية', data:'بياناتي', weight:'تتبع الوزن', kg:'الوزن (كغم)', add:'إضافة', empty:'لا توجد قياسات بعد',
    lang:'English', theme:'الثيم', export:'تصدير JSON', csv:'تصدير CSV', import:'استيراد JSON', wipe:'حذف كل البيانات',
    confirmWipe:'سيتم حذف كل بياناتك من هذا الجهاز نهائياً. هل أنت متأكد؟', ok:'تمت العملية', fail:'فشل الاستيراد: ',
    persist:'حماية التخزين', persisted:'مفعّلة', notPersisted:'غير مضمونة',
    warn:'بياناتك محفوظة داخل متصفح جهازك فقط، ولا توجد مزامنة سحابية. مسح بيانات المواقع من إعدادات Safari يحذفها، لذلك صدّر نسخة احتياطية بانتظام.',
    recovery:'الاستعادة: افتح بياناتي ← استيراد JSON ← اختر آخر ملف نسخة احتياطية من تطبيق الملفات.' },
  en: { gl:'Goals', db:'Dashboard', nu:'Nutrition', pl:'Plan', st:'Stats', wk:'Workout', lib:'Exercises',search:'Search exercises…',all:'All',fav:'Favorites',favs:'Favorite',mine:'My exercises',newEx:'Custom exercise',exName:'Exercise name',exSteps:'Steps (one per line)',save:'Save',start:'Start',end:'End',chest:'Chest',back:'Back',legs:'Legs',shoulders:'Shoulders',arms:'Arms',core:'Core', app:'IRON PATH', home:'Home', data:'My Data', weight:'Weight tracking', kg:'Weight (kg)', add:'Add', empty:'No measurements yet',
    lang:'العربية', theme:'Theme', export:'Export JSON', csv:'Export CSV', import:'Import JSON', wipe:'Delete all data',
    confirmWipe:'All your data on this device will be permanently deleted. Are you sure?', ok:'Done', fail:'Import failed: ',
    persist:'Storage protection', persisted:'Enabled', notPersisted:'Not guaranteed',
    warn:'Your data is stored only in this browser on your device; there is no cloud sync. Clearing website data in Safari deletes it, so export backups regularly.',
    recovery:'Recovery: My Data → Import JSON → pick your latest backup file from the Files app.' },
};
export const t = (l: Lang, k: keyof typeof d.ar) => d[l][k];
