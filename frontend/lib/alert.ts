import { Alert, Platform } from 'react-native';

type Btn = { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void };

/**
 * Cross-platform alert.
 * - Native: uses Alert.alert
 * - Web: uses window.confirm (for 2-button) or window.alert (1-button)
 */
export function showAlert(title: string, message?: string, buttons?: Btn[]) {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons as any);
    return;
  }
  if (typeof window === 'undefined') return;

  const btns = buttons || [{ text: 'OK' }];
  const body = [title, message].filter(Boolean).join('\n\n');

  if (btns.length <= 1) {
    window.alert(body);
    btns[0]?.onPress?.();
    return;
  }
  // For 2-button dialogs use window.confirm (OK / Cancel)
  const destructive = btns.find(b => b.style === 'destructive');
  const cancel = btns.find(b => b.style === 'cancel');
  const primary = destructive || btns[btns.length - 1];
  const other = cancel || btns.find(b => b !== primary);

  const ok = window.confirm(body + (primary.text ? `\n\n[OK = ${primary.text}]` : ''));
  if (ok) primary.onPress?.();
  else other?.onPress?.();
}
