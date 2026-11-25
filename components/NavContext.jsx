'use client';
import { createContext, useContext } from 'react';

const NavCtx = createContext({ exams: [] });
export function NavProvider({ exams, children }) { return <NavCtx.Provider value={{ exams }}>{children}</NavCtx.Provider>; }
export const useNav = () => useContext(NavCtx);
