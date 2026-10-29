import type { Cfg, Frame } from './rig';
// Maps stable exercise ids to instructional media. 'frames' = stick-figure diagrams drawn with rig.ts, 'custom' = hand-built animated scenes (customViews.tsx), both original to this project.
// 'video' / 'anim' entries are supported by the viewer but NONE are shipped: add one only after verifying the file exists and its license (scripts/check-media.ts enforces existence).
export type FramesMedia = { kind: 'frames'; cfg: Cfg; frames: Frame[]; caption: [string, string]; source: string; license: string };
export type FileMedia = { kind: 'video' | 'anim'; src: string; poster?: string; caption: [string, string]; source: string; license: string; local: boolean };
export type CustomMedia = { kind: 'custom'; view: string; caption: [string, string]; source: string; license: string; period?: number };
export type Media = FramesMedia | FileMedia | CustomMedia;
const SRC = 'Original diagram drawn for IRON PATH', LIC = 'Project original; not reviewed by a coach or clinician';
const STD = [47, 92, 53, 92];
const side: [string, string] = ['منظر جانبي', 'Side view'], front: [string, string] = ['منظر أمامي', 'Front view'];
const m = (cfg: Cfg, frames: Frame[], caption = side): FramesMedia => ({ kind: 'frames', cfg, frames, caption, source: SRC, license: LIC });
const stand = (h: number[]): Frame => [50, 52, -90, ...STD, ...h];
const push = [m({ ks: -1, es: 1, scene: 'floor' }, [[42, 75, -24.5, 6, 91, 9, 91, 69, 92, 71, 92], [45, 85, -10, 6, 91, 9, 91, 69, 92, 71, 92]])][0];
const bench = (g: 'db' | 'bb') => m({ ks: -1, es: 1, scene: 'bench', gear: g, plate: 8 }, [[60, 66, 180, 74, 91, 77, 91, 30, 37, 31, 38], [60, 66, 180, 74, 91, 77, 91, 30, 57, 31, 58]]);
const curl = m({ ks: -1, es: 1, scene: 'floor', gear: 'db' }, [stand([54, 49, 56, 50]), stand([58, 24, 60, 25])]);
const squat = (g?: 'db') => m({ ks: -1, es: 1, scene: 'floor', gear: g }, g ? [stand([61, 27, 62, 28]), [36, 74, -62, ...STD, 62, 52, 63, 53]] : [stand([74, 26, 76, 28]), [36, 74, -62, ...STD, 76, 47, 78, 49]]);
import { GYM_MEDIA } from './gymMedia';
export const MEDIA: Record<string, Media> = {
  squat: squat(), goblet: squat('db'), pushup: push, widepush: { ...push, caption: ['منظر جانبي (اليدان أوسع من الكتفين)', 'Side view (hands wider than shoulders)'] },
  pullup: m({ ks: 1, es: 1, scene: 'pullbar' }, [[50, 65, -90, 44, 92, 40, 88, 50, 6, 52, 6], [50, 52, -90, 46, 84, 42, 82, 50, 6, 52, 6]]),
  row: m({ ks: -1, es: 1, scene: 'floor', gear: 'db' }, [[36, 58, -25, 44, 92, 48, 92, 63, 74, 65, 75], [36, 58, -25, 44, 92, 48, 92, 46, 56, 48, 57]]),
  deadlift: m({ ks: -1, es: 1, scene: 'floor', gear: 'bb', plate: 11 }, [[30, 66, -25, 46, 92, 50, 92, 55, 81, 57, 82], [50, 52, -90, ...STD, 52, 51, 54, 52]]),
  rdl: m({ ks: -1, es: 1, scene: 'floor', gear: 'db' }, [stand([52, 50, 54, 51]), [32, 56, -20, ...STD, 58, 73, 60, 74]]),
  ohp: m({ ks: -1, es: 1, scene: 'floor', gear: 'db' }, [stand([55, 17, 57, 18]), stand([51, -6, 53, -5])]),
  lateral: m({ ks: -1, es: 1, scene: 'floor', gear: 'db', front: true }, [[50, 52, -90, 44, 92, 56, 92, 43, 50, 57, 50], [50, 52, -90, 44, 92, 56, 92, 16, 24, 84, 24]], front),
  curl, hammer: curl,
  plank: m({ ks: -1, es: 1, scene: 'floor' }, [[45.2, 83, -11.5, 6, 91, 9, 91, 88, 91, 90, 91]]),
  benchpress: bench('bb'), dbpress: bench('db'),
  pulldown: m({ ks: -1, es: 1, scene: 'seat', cable: [46, -8] }, [[45, 76, -82, 66, 92, 68, 92, 50, 17, 53, 18], [45, 76, -82, 66, 92, 68, 92, 60, 40, 62, 41]]),
  cablerow: m({ ks: -1, es: 1, scene: 'seat', cable: [90, 64] }, [[30, 76, -70, 62, 91, 66, 91, 64, 63, 66, 64], [30, 76, -95, 62, 91, 66, 91, 38, 62, 40, 63]]),
  facepull: m({ ks: -1, es: -1, scene: 'floor', cable: [90, 22] }, [stand([76, 24, 78, 25]), stand([60, 14, 62, 15])]),
  legpress: m({ ks: -1, es: 1, scene: 'legpress' }, [[40, 72, -150, 62, 52, 64, 54, 36, 64, 38, 66], [40, 72, -150, 69, 44, 71, 46, 36, 64, 38, 66]]),
  lunge: m({ ks: -1, es: 1, scene: 'floor', gear: 'db' }, [stand([51, 50, 53, 51]), [50, 68, -90, 68, 92, 30, 90, 51, 64, 53, 65]]),
  hipthrust: m({ ks: -1, es: 1, scene: 'floor' }, [[46, 86, 176, 72, 91, 75, 91, 44, 91, 46, 91], [44, 72, 148, 72, 91, 75, 91, 44, 91, 46, 91]]),
  calfraise: m({ ks: -1, es: 1, scene: 'floor', toe: true }, [stand([51, 50, 53, 51]), [50, 46, -90, 47, 86, 53, 86, 51, 44, 53, 45]]),
  pushdown: m({ ks: -1, es: 1, scene: 'floor', cable: [58, -8] }, [stand([62, 29, 64, 30]), stand([56, 48, 58, 49])]),
  jacks: m({ ks: -1, es: 1, scene: 'floor', front: true }, [[50, 52, -90, 44, 92, 56, 92, 44, 50, 56, 50], [50, 52, -90, 32, 90, 68, 90, 34, -5, 66, -5]], front),
};
Object.assign(MEDIA, GYM_MEDIA);
// Highlighted muscle keys -> body regions are drawn by rig.ts for these keys only.
export const HL_KEYS = ['pecs', 'lats', 'upback', 'traps', 'lowback', 'abs', 'obliques', 'delts', 'biceps', 'triceps', 'forearms', 'quads', 'hams', 'glutes', 'calves'];
