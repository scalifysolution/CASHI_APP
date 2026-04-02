import React, { createContext, useContext, useMemo, useState } from 'react';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';

export type HomeMenuContextValue = {
  menuVisible: boolean;
  setMenuVisible: (v: boolean) => void;
  rootNavigation: NavigationProp<ParamListBase> | null;
};

const HomeMenuContext = createContext<HomeMenuContextValue>({
  menuVisible: false,
  setMenuVisible: () => {},
  rootNavigation: null,
});

export function HomeMenuProvider({
  children,
  rootNavigation,
}: {
  children: React.ReactNode;
  rootNavigation: NavigationProp<ParamListBase> | null;
}) {
  const [menuVisible, setMenuVisible] = useState(false);
  const value = useMemo(
    () => ({ menuVisible, setMenuVisible, rootNavigation }),
    [menuVisible, rootNavigation],
  );
  return <HomeMenuContext.Provider value={value}>{children}</HomeMenuContext.Provider>;
}

export function useHomeMenu() {
  return useContext(HomeMenuContext);
}
