import React, { createContext, useContext, useState, useMemo } from 'react';

const ThemeCustomizerContext = createContext(null);

export const ThemeCustomizerProvider = ({ children }) => {
    const [open, setOpen] = useState(false);
    const toggle = () => setOpen((prev) => !prev);

    const value = useMemo(() => ({ open, setOpen, toggle }), [open]);

    return (
        <ThemeCustomizerContext.Provider value={value}>
            {children}
        </ThemeCustomizerContext.Provider>
    );
};

export const useThemeCustomizer = () => {
    const context = useContext(ThemeCustomizerContext);
    if (!context) {
        throw new Error('useThemeCustomizer must be used within ThemeCustomizerProvider');
    }
    return context;
};
