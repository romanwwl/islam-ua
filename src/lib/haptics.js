/* Тактильный отклик (Taptic Engine) — только в нативном приложении, в браузере тихо игнорируется */
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const native = Capacitor.isNativePlatform();

export const hapticCorrect = () => { if (native) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {}); };   // очень лёгкий
export const hapticWrong   = () => { if (native) Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {}); };  // чуть сильнее
