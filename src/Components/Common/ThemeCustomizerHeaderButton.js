import React from 'react';
import { useThemeCustomizer } from './ThemeCustomizerContext';

const ThemeCustomizerHeaderButton = () => {
    const { toggle } = useThemeCustomizer();

    return (
        <>
            <button
                type="button"
                className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle header-item"
                onClick={toggle}
                aria-label="Theme settings"
            >
                <i className="mdi mdi-cog-outline fs-22 text-info"></i>
            </button>
        </>
    );
};

export default ThemeCustomizerHeaderButton;
