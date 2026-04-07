import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/** Extra bottom padding so ScrollView content stays above the keyboard. */
export function useKeyboardBottomInset() {
  const [bottom, setBottom] = useState(0);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const subShow = Keyboard.addListener(showEvt, (e) => {
      setBottom(e.endCoordinates?.height ?? 0);
    });
    const subHide = Keyboard.addListener(hideEvt, () => setBottom(0));

    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  return bottom;
}
