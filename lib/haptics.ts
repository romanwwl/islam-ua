/* Тактильный отклик — только на устройстве; в вебе тихо игнорируется */
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const native = Platform.OS !== 'web';
export const hapticCorrect = () => { if (native) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); };   // очень лёгкий
export const hapticWrong   = () => { if (native) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}); };  // чуть сильнее
export const hapticTap     = () => { if (native) Haptics.selectionAsync().catch(() => {}); };
