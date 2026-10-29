// Original diagrams for the gym exercises (drawn with rig.ts; every frame is [hx,hy,torsoDeg, foot1, foot2, hand1, hand2]).
// frames[0] = first position, frames[1] = second position of the movement. Machine shapes are approximate and differ between brands.
// Exercises that are NOT listed here have no diagram yet and are flagged "diagram pending" in the library (e.g. pallof, shrug).
import type { Cfg, Frame } from './rig';
import type { Media } from './media';

const SRC = 'Original diagram drawn for IRON PATH', LIC = 'Project original; not reviewed by a coach or clinician';
type C = [string, string];
const SIDE: C = ['منظر جانبي', 'Side view'], FRONT: C = ['منظر أمامي', 'Front view'];
const MC: C = ['منظر جانبي · شكل الجهاز تقريبي ويختلف بين الشركات', 'Side view · machine shape is approximate and varies by brand'];
const MCF: C = ['منظر أمامي · شكل الجهاز تقريبي ويختلف بين الشركات', 'Front view · machine shape is approximate and varies by brand'];
const mk = (cfg: Cfg, frames: Frame[], caption: C = SIDE): Media => ({ kind: 'frames', cfg, frames, caption, source: SRC, license: LIC });
const STD = [47, 92, 53, 92];
const stand = (h: number[]): Frame => [50, 52, -90, ...STD, ...h];
const seatFx = (hx: number, hy: number) => [hx + 22, 91, hx + 25, 91];

// reusable machine scenery
const seatBack = (hx: number, hy: number): Cfg['deco'] => [['r', hx - 8, hy + 5, 26, 3], ['r', hx - 7, hy - 40, 3, 46]];
const sideBase = { ks: -1, es: 1, scene: 'floor' } as const;

// ---- seated presses / rows ----
const chestPress = mk({ ...sideBase, gear: 'db', deco: seatBack(42, 76) }, [[42, 76, -90, ...seatFx(42, 76), 52, 48, 53, 49], [42, 76, -90, ...seatFx(42, 76), 70, 47, 71, 48]], MC);
const inclineM = mk({ ...sideBase, gear: 'db', deco: [['r', 34, 81, 26, 3], ['l', 38, 80, 20, 38, 3]] }, [[42, 76, -120, ...seatFx(42, 76), 40, 54, 41, 55], [42, 76, -120, ...seatFx(42, 76), 50, 32, 51, 33]], MC);
const shoulderM = mk({ ...sideBase, gear: 'db', deco: seatBack(42, 76) }, [[42, 76, -90, ...seatFx(42, 76), 50, 40, 51, 41], [42, 76, -90, ...seatFx(42, 76), 50, 18, 51, 19]], MC);
const smithOhp = mk({ ...sideBase, gear: 'bb', plate: 6, deco: [...seatBack(42, 76)!, ['l', 52, -10, 52, 92, 1.2]] }, [[42, 76, -90, ...seatFx(42, 76), 52, 40, 53, 41], [42, 76, -90, ...seatFx(42, 76), 52, 18, 53, 19]], MC);
const smithBench = mk({ ks: -1, es: 1, scene: 'bench', gear: 'bb', plate: 8, deco: [['l', 30, -6, 30, 66, 1.2]] }, [[60, 66, 180, 74, 91, 77, 91, 30, 37, 31, 38], [60, 66, 180, 74, 91, 77, 91, 30, 57, 31, 58]], MC);
const incDb = mk({ ks: -1, es: 1, scene: 'floor', gear: 'db', deco: [['l', 56, 78, 24, 60, 3], ['r', 50, 78, 20, 3], ['l', 40, 70, 40, 92, 1.8]] }, [[58, 72, 210, 74, 91, 77, 91, 33, 29, 34, 30], [58, 72, 210, 74, 91, 77, 91, 38, 50, 39, 51]]);
const pecDeck = mk({ ks: 1, es: 1, scene: 'floor', front: true, gear: 'db', deco: [['r', 32, 81, 36, 3]] }, [[50, 76, -90, 40, 91, 60, 91, 22, 42, 78, 42], [50, 76, -90, 40, 91, 60, 91, 46, 38, 54, 38]], MCF);
const rearDelt = mk({ ks: 1, es: 1, scene: 'floor', front: true, gear: 'db', deco: [['r', 32, 81, 36, 3]] }, [[50, 76, -90, 40, 91, 60, 91, 46, 38, 54, 38], [50, 76, -90, 40, 91, 60, 91, 22, 40, 78, 40]], MCF);
const cableFly = mk({ ks: -1, es: 1, scene: 'floor', front: true, link: [[6, -8, 'h0'], [94, -8, 'h1']] }, [[50, 52, -90, 44, 92, 56, 92, 24, 26, 76, 26], [50, 52, -90, 44, 92, 56, 92, 46, 44, 54, 44]], FRONT);
const lateralM = mk({ ks: 1, es: 1, scene: 'floor', front: true, gear: 'db', deco: [['r', 32, 81, 36, 3]] }, [[50, 76, -90, 40, 91, 60, 91, 42, 68, 58, 68], [50, 76, -90, 40, 91, 60, 91, 22, 42, 78, 42]], MCF);
const cableLat = mk({ ks: -1, es: 1, scene: 'floor', front: true, link: [[96, 90, 'h1']] }, [[50, 52, -90, 44, 92, 56, 92, 44, 66, 60, 64], [50, 52, -90, 44, 92, 56, 92, 44, 66, 80, 38]], FRONT);
const chestRow = mk({ ...sideBase, gear: 'db', deco: [['r', 33, 81, 26, 3], ['r', 49, 38, 4, 28]] }, [[40, 78, -84, ...seatFx(40, 78), 70, 60, 71, 61], [40, 78, -84, ...seatFx(40, 78), 48, 62, 49, 63]], MC);
const plateRow = mk({ ...sideBase, gear: 'db', deco: [['r', 33, 81, 26, 3], ['r', 49, 38, 4, 28], ['c', 76, 74, 7], ['c', 76, 74, 2.5]], link: [[76, 74, 'h0']] }, [[40, 78, -84, ...seatFx(40, 78), 70, 60, 71, 61], [40, 78, -84, ...seatFx(40, 78), 48, 62, 49, 63]], MC);
const straightArm = mk({ ks: -1, es: 1, scene: 'floor', cable: [86, -6] }, [[40, 52, -50, 38, 92, 43, 92, 80, 16, 81, 17], [40, 52, -50, 38, 92, 43, 92, 60, 56, 61, 57]]);
const backExt = mk({ ks: -1, es: 1, scene: 'floor', deco: [['l', 24, 92, 52, 56, 2.6], ['l', 46, 62, 60, 52, 3]] }, [[50, 52, 50, 28, 88, 25, 88, 66, 74, 67, 75], [50, 52, -62, 28, 88, 25, 88, 62, 30, 63, 31]], MC);
const assistedPull = mk({ ks: 1, es: 1, scene: 'pullbar', deco: [['r', 24, 88, 32, 3]] }, [[50, 65, -90, 36, 85, 33, 85, 50, 6, 52, 6], [50, 52, -90, 36, 80, 33, 80, 46, 6, 48, 6]], MC);
const pulldownF: Media = mk({ ks: -1, es: 1, scene: 'seat', cable: [46, -8] }, [[45, 76, -82, 66, 92, 68, 92, 50, 17, 53, 18], [45, 76, -82, 66, 92, 68, 92, 60, 40, 62, 41]]);
const cableRowF: Media = mk({ ks: -1, es: 1, scene: 'seat', cable: [90, 64] }, [[30, 76, -70, 62, 91, 66, 91, 64, 63, 66, 64], [30, 76, -95, 62, 91, 66, 91, 38, 62, 40, 63]]);

// ---- arms ----
const preacher = mk({ ...sideBase, deco: [['r', 33, 81, 24, 3], ['l', 46, 52, 62, 72, 3]] }, [[40, 78, -88, ...seatFx(40, 78), 62, 68, 63, 69], [40, 78, -88, ...seatFx(40, 78), 48, 40, 49, 41]], MC);
const bicepsM = mk({ ...sideBase, deco: [['r', 33, 81, 24, 3], ['l', 50, 54, 58, 74, 3]] }, [[40, 78, -88, ...seatFx(40, 78), 60, 68, 61, 69], [40, 78, -88, ...seatFx(40, 78), 48, 40, 49, 41]], MC);
const cableCurl = mk({ ks: -1, es: 1, scene: 'floor', cable: [90, 88] }, [stand([54, 49, 56, 50]), stand([58, 24, 60, 25])]);
const ezCurl = mk({ ks: -1, es: 1, scene: 'floor', gear: 'bb', plate: 4 }, [stand([54, 49, 56, 50]), stand([58, 24, 60, 25])]);
const overheadTri = mk({ ks: -1, es: 1, scene: 'floor', cable: [4, 88] }, [stand([46, 14, 47, 15]), stand([64, 0, 65, 1])]);
const assistedDip = mk({ ks: -1, es: 1, scene: 'floor', deco: [['r', 24, 86, 24, 3], ['c', 54, 46, 3]] }, [[50, 48, -90, 38, 82, 35, 82, 54, 46, 55, 47], [50, 60, -90, 38, 88, 35, 88, 54, 46, 55, 47]], MC);

// ---- legs ----
const hack = mk({ ks: -1, es: 1, scene: 'floor', deco: [['l', 22, 18, 40, 76, 3], ['l', 52, 78, 62, 92, 3]] }, [[32, 52, -107, 54, 84, 57, 85, 40, 60, 41, 61], [38, 70, -107, 54, 84, 57, 85, 44, 76, 45, 77]], MC);
const smithSquat = mk({ ks: -1, es: 1, scene: 'floor', gear: 'bb', plate: 5, deco: [['l', 54, -10, 54, 92, 1.2]] }, [stand([53, 24, 54, 25]), [36, 74, -62, ...STD, 53, 46, 54, 47]], MC);
const bbSquat = mk({ ks: -1, es: 1, scene: 'floor', gear: 'bb', plate: 8 }, [stand([53, 24, 54, 25]), [36, 74, -62, ...STD, 53, 46, 54, 47]]);
const legExt = mk({ ...sideBase, deco: [['r', 30, 81, 24, 3], ['r', 29, 38, 3, 44]] }, [[38, 76, -88, 60, 92, 63, 92, 50, 70, 51, 71], [38, 76, -88, 77, 74, 80, 75, 50, 70, 51, 71]], MC);
const seatedCurl = mk({ ...sideBase, deco: [['r', 30, 75, 24, 3], ['r', 29, 32, 3, 44], ['r', 44, 66, 20, 3]] }, [[38, 70, -88, 76, 74, 79, 75, 50, 64, 51, 65], [38, 70, -88, 50, 90, 53, 90, 50, 64, 51, 65]], MC);
const lyingCurl = mk({ ks: 1, es: 1, scene: 'floor', deco: [['r', 14, 79, 62, 3]] }, [[56, 76, 180, 94, 76, 97, 76, 36, 70, 37, 71], [56, 76, 180, 66, 44, 69, 45, 36, 70, 37, 71]], MC);
const rdlBb = mk({ ks: -1, es: 1, scene: 'floor', gear: 'bb', plate: 8 }, [stand([52, 50, 54, 51]), [32, 56, -20, ...STD, 58, 73, 60, 74]]);
const hipThrustM = mk({ ks: -1, es: 1, scene: 'floor', deco: [['r', 12, 76, 22, 16]] }, [[53.5, 87, 204.5, 72, 91, 75, 91, 62, 82, 63, 83], [55.9, 72, 175, 72, 91, 75, 91, 60, 70, 61, 71]], MC);
const gluteDrive = mk({ ks: -1, es: 1, scene: 'floor', deco: [['r', 12, 76, 22, 16], ['l', 54, 84, 58, 66, 1.4]] }, [[53.5, 87, 204.5, 72, 91, 75, 91, 62, 82, 63, 83], [55.9, 72, 175, 72, 91, 75, 91, 60, 70, 61, 71]], MC);
const hipAbd = mk({ ks: 1, es: 1, scene: 'floor', front: true, gear: 'db', deco: [['r', 30, 81, 40, 3]] }, [[50, 76, -90, 40, 91, 60, 91, 40, 70, 60, 70], [50, 76, -90, 26, 91, 74, 91, 40, 70, 60, 70]], MCF);
const hipAdd = mk({ ks: 1, es: 1, scene: 'floor', front: true, gear: 'db', deco: [['r', 30, 81, 40, 3]] }, [[50, 76, -90, 26, 91, 74, 91, 40, 70, 60, 70], [50, 76, -90, 40, 91, 60, 91, 40, 70, 60, 70]], MCF);
const calfM = mk({ ks: -1, es: 1, scene: 'floor', toe: true, deco: [['r', 36, 88, 32, 4], ['r', 43, 13, 14, 4]] }, [[50, 50, -90, 47, 89, 53, 89, 51, 38, 52, 39], [50, 44, -90, 47, 83, 53, 83, 51, 32, 52, 33]], MC);
const calfSeated = mk({ ks: -1, es: 1, scene: 'floor', toe: true, deco: [['r', 32, 71, 18, 3], ['r', 55, 59, 14, 4], ['r', 48, 90, 24, 3]] }, [[40, 66, -90, 62, 89, 66, 89, 58, 62, 59, 63], [40, 66, -90, 62, 84, 66, 84, 58, 62, 59, 63]], MC);
const bulgarian = mk({ ks: -1, es: 1, scene: 'floor', gear: 'db', deco: [['r', 8, 78, 20, 3], ['l', 12, 81, 12, 92, 1.8]] }, [[50, 56, -90, 60, 92, 24, 77, 52, 54, 53, 55], [50, 72, -90, 60, 92, 24, 77, 52, 70, 53, 71]]);
const kickback = mk({ ks: -1, es: 1, scene: 'floor', link: [[92, 86, 'f0']], deco: [['l', 70, 20, 70, 92, 1.8]] }, [[50, 52, -78, 58, 88, 50, 92, 62, 40, 63, 41], [50, 52, -78, 30, 80, 50, 92, 62, 40, 63, 41]], MC);
const stepUp = mk({ ks: -1, es: 1, scene: 'floor', gear: 'db', deco: [['r', 56, 74, 30, 18]] }, [[56, 54, -90, 68, 74, 46, 92, 58, 80, 59, 81], [68, 36, -90, 68, 74, 74, 70, 70, 62, 71, 63]]);

// ---- core + free-weight basics ----
const crunchM = mk({ ...sideBase, deco: [['r', 33, 81, 26, 3], ['r', 33, 40, 3, 42]] }, [[40, 76, -88, ...seatFx(40, 76), 48, 50, 49, 51], [40, 76, -45, ...seatFx(40, 76), 62, 60, 63, 61]], MC);
const cableCrunch = mk({ ks: -1, es: 1, scene: 'floor', cable: [60, -8] }, [[48, 72, -88, 28, 92, 25, 92, 52, 36, 53, 37], [48, 72, -35, 28, 92, 25, 92, 72, 54, 73, 55]]);
const captain = mk({ ks: -1, es: 1, scene: 'floor', deco: [['r', 32, 18, 4, 52], ['r', 42, 44, 12, 3]] }, [[40, 56, -90, 40, 92, 43, 92, 50, 46, 51, 47], [40, 56, -90, 52, 72, 55, 73, 50, 46, 51, 47]], MC);
const bbRow = mk({ ks: -1, es: 1, scene: 'floor', gear: 'bb', plate: 7 }, [[36, 58, -25, 44, 92, 48, 92, 63, 74, 65, 75], [36, 58, -25, 44, 92, 48, 92, 46, 56, 48, 57]]);
const bbOhp = mk({ ks: -1, es: 1, scene: 'floor', gear: 'bb', plate: 8 }, [stand([55, 17, 57, 18]), stand([51, -6, 53, -5])]);

const pallof: Media = { kind: 'custom', view: 'pallof', period: 4200, caption: ['منظر علوي (من الأعلى): الشخص يقف جانبياً للكابل ويقاوم الدوران', 'Top view: standing side-on to the cable, resisting rotation'], source: SRC, license: LIC };
export const GYM_MEDIA: Record<string, Media> = {
  pallof,
  chestpressm: chestPress, inclinem: inclineM, shoulderm: shoulderM, smithohp: smithOhp, smithpress: smithBench, incdb: incDb, pecdeck: pecDeck, reardelt: rearDelt,
  cablefly: cableFly, lateralm: lateralM, cablelat: cableLat, chestrow: chestRow, platerow: plateRow, straightarm: straightArm, backext: backExt, assistedpull: assistedPull,
  closepull: { ...pulldownF, caption: ['منظر جانبي (المقبض المحايد لا يظهر في هذا المنظر)', 'Side view (the neutral handle is not visible from this angle)'] } as Media,
  onecable: { ...cableRowF, caption: ['منظر جانبي (بذراع واحدة تبدو الحركة نفسها من الجانب)', 'Side view (one arm looks the same from the side)'] } as Media,
  preacherm: preacher, cablecurl: cableCurl, bicepsm: bicepsM, ezcurl: ezCurl, overheadtri: overheadTri, assisteddip: assistedDip,
  hacksquat: hack, smithsquat: smithSquat, bbsquat: bbSquat, legext: legExt, seatedcurl: seatedCurl, lyingcurl: lyingCurl, rdlbb: rdlBb, hipthrustm: hipThrustM, glutedrive: gluteDrive,
  hipabd: hipAbd, hipadd: hipAdd, calfm: calfM, calfseated: calfSeated, bulgarian, kickback, stepup: stepUp,
  crunchm: crunchM, cablecrunch: cableCrunch, captain, bbrow: bbRow, bbohp: bbOhp,
};
