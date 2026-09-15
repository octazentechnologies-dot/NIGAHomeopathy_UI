const MINIMAL_BLUE = '#25a0e2';
const NEUTRAL_BORDER = '#dee2e6';

/** Keep in sync with themes.scss `$app-form-field-*` / `:root` CSS vars. */
export const APP_FORM_FIELD_HEIGHT = 'var(--app-form-field-height, 1.75rem)';
export const APP_FORM_FIELD_FONT_SIZE = 'var(--app-form-field-font-size, 0.6875rem)';
export const APP_FORM_FIELD_PADDING_X = 'var(--app-form-field-padding-x, 0.9rem)';

const isMultiSelect = (state) =>
  Boolean(state?.isMulti || state?.selectProps?.isMulti);

/** Injected last into <head> so multi-select height always grows with chips.
 *  react-select v5 puts --is-multi on value-container, NOT on control. */
const MULTI_SELECT_GROW_CSS = `
/* niga: multi-select auto-grow — do not remove */
.admin-form-card [class*="__control"]:has([class*="value-container--is-multi"]),
.admin-form-card [class*="__control"]:has([class*="__multi-value"]),
.admin-list-filter-card [class*="__control"]:has([class*="value-container--is-multi"]),
[class*="__control"]:has([class*="value-container--is-multi"]),
[class*="__control"]:has([class*="__multi-value"]),
[class*="__container"]:has([class*="value-container--is-multi"]) > [class*="__control"],
[class*="-container"]:has([class*="value-container--is-multi"]) > [class*="__control"],
.admin-form-select__control--is-multi,
.select__control--is-multi,
.react-select__control--is-multi,
[class*="__control--is-multi"],
div[class*="-control"][class*="--is-multi"] {
  height: auto !important;
  max-height: none !important;
  min-height: var(--app-form-field-height, 1.75rem) !important;
  align-items: center !important;
  overflow: visible !important;
}
.admin-form-card [class*="value-container--is-multi"],
.admin-list-filter-card [class*="value-container--is-multi"],
.admin-form-select__value-container--is-multi,
.select__value-container--is-multi,
[class*="__value-container--is-multi"],
[class*="value-container--is-multi"],
div[class*="-ValueContainer"][class*="--is-multi"] {
  height: auto !important;
  max-height: none !important;
  min-height: calc(var(--app-form-field-height, 1.75rem) - 2px) !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  flex-wrap: wrap !important;
  align-content: center !important;
  align-items: center !important;
  overflow: visible !important;
  flex: 1 1 auto !important;
}
.admin-form-card [class*="__control"]:has([class*="value-container--is-multi"]) [class*="__indicators"],
[class*="__control"]:has([class*="value-container--is-multi"]) [class*="__indicators"],
.admin-form-select__control--is-multi .admin-form-select__indicators,
[class*="__control--is-multi"] [class*="__indicators"],
div[class*="-control"][class*="--is-multi"] [class*="__indicators"],
div[class*="-control"][class*="--is-multi"] [class*="-IndicatorsContainer"] {
  height: auto !important;
  max-height: none !important;
  min-height: calc(var(--app-form-field-height, 1.75rem) - 2px) !important;
  align-self: stretch !important;
  align-items: center !important;
}
[class*="value-container--is-multi"] [class*="__placeholder"],
[class*="value-container--is-multi"] [class*="__input-container"],
[class*="value-container--is-multi"] [class*="__input"],
.admin-form-select__value-container--is-multi .admin-form-select__placeholder,
.admin-form-select__value-container--is-multi .admin-form-select__input {
  margin: 0 !important;
  padding: 0 !important;
  line-height: 1.25 !important;
  transform: none !important;
}
`;

export const ensureMultiSelectGrowStyles = () => {
  if (typeof document === 'undefined') return;
  const id = 'niga-multi-select-grow-styles';
  let style = document.getElementById(id);
  if (!style) {
    style = document.createElement('style');
    style.id = id;
    style.setAttribute('data-niga', 'multi-select-grow');
  }
  // Always refresh CSS + move to end of <head> so this beats Emotion + compiled SCSS
  style.textContent = MULTI_SELECT_GROW_CSS;
  document.head.appendChild(style);
};

if (typeof document !== 'undefined') {
  ensureMultiSelectGrowStyles();
  // Re-assert after React/Emotion mount
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => ensureMultiSelectGrowStyles());
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('load', ensureMultiSelectGrowStyles);
  }
}

/** Lower react-select Emotion minHeight (default 38px) to match text inputs. */
export const neutralSelectTheme = (theme) => ({
  ...theme,
  colors: {
    ...theme.colors,
    primary: MINIMAL_BLUE,
    primary25: 'rgba(37, 160, 226, 0.12)',
    primary50: 'rgba(37, 160, 226, 0.25)',
  },
  spacing: {
    ...theme.spacing,
    controlHeight: 28,
    baseUnit: 2,
  },
});

/** Neutral react-select: same height/font as .form-control; multi grows with chips. */
export const neutralSelectStyles = {
  control: (base, state) => {
    const isActive = state.isFocused || state.selectProps?.menuIsOpen;
    const multi = isMultiSelect(state);
    // Strip fixed height from react-select / Emotion defaults
    const { height: _h, maxHeight: _mh, ...restBase } = base;
    return {
      ...restBase,
      minHeight: APP_FORM_FIELD_HEIGHT,
      ...(multi
        ? {
            height: 'auto !important',
            maxHeight: 'none !important',
            alignItems: 'center',
            overflow: 'visible',
          }
        : {
            height: APP_FORM_FIELD_HEIGHT,
            maxHeight: APP_FORM_FIELD_HEIGHT,
            alignItems: 'center',
          }),
      fontSize: APP_FORM_FIELD_FONT_SIZE,
      borderColor: isActive ? MINIMAL_BLUE : NEUTRAL_BORDER,
      boxShadow: 'none',
      '&:hover': {
        borderColor: isActive ? MINIMAL_BLUE : NEUTRAL_BORDER,
      },
    };
  },
  valueContainer: (base, state) => {
    const multi = isMultiSelect(state);
    const { height: _h, maxHeight: _mh, ...restBase } = base;
    return {
      ...restBase,
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: APP_FORM_FIELD_PADDING_X,
      paddingRight: APP_FORM_FIELD_PADDING_X,
      ...(multi
        ? {
            height: 'auto',
            maxHeight: 'none',
            minHeight: `calc(${APP_FORM_FIELD_HEIGHT} - 2px)`,
            flexWrap: 'wrap',
            // center when empty/single-row; container grows with chips so wrap still looks fine
            alignContent: 'center',
            flex: '1 1 auto',
            overflow: 'visible',
            gap: 4,
          }
        : {
            height: '100%',
          }),
      alignItems: 'center',
      fontSize: APP_FORM_FIELD_FONT_SIZE,
    };
  },
  singleValue: (base) => ({
    ...base,
    fontSize: APP_FORM_FIELD_FONT_SIZE,
    lineHeight: 1.25,
    margin: 0,
  }),
  placeholder: (base) => ({
    ...base,
    fontSize: APP_FORM_FIELD_FONT_SIZE,
    lineHeight: 1.25,
    margin: 0,
    padding: 0,
    transform: 'none',
  }),
  input: (base) => ({
    ...base,
    margin: 0,
    padding: 0,
    fontSize: APP_FORM_FIELD_FONT_SIZE,
    lineHeight: 1.25,
  }),
  option: (base) => ({
    ...base,
    fontSize: APP_FORM_FIELD_FONT_SIZE,
    lineHeight: 1.25,
  }),
  menu: (base) => ({
    ...base,
    fontSize: APP_FORM_FIELD_FONT_SIZE,
  }),
  indicatorsContainer: (base, state) => {
    const multi = isMultiSelect(state);
    return {
      ...base,
      ...(multi
        ? {
            height: 'auto',
            minHeight: `calc(${APP_FORM_FIELD_HEIGHT} - 2px)`,
            maxHeight: 'none',
            alignSelf: 'stretch',
            alignItems: 'center',
          }
        : {
            height: '100%',
            alignSelf: 'stretch',
          }),
    };
  },
  indicatorSeparator: () => ({
    display: 'none',
  }),
  dropdownIndicator: (base) => ({
    ...base,
    padding: '0 6px',
  }),
  clearIndicator: (base) => ({
    ...base,
    padding: '0 4px',
  }),
  multiValue: (base) => ({
    ...base,
    margin: 0,
    backgroundColor: '#e8f5ff',
    borderRadius: 4,
    maxWidth: '100%',
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: '#0f6fa3',
    fontSize: APP_FORM_FIELD_FONT_SIZE,
    fontWeight: 500,
    paddingLeft: 6,
    paddingRight: 4,
    whiteSpace: 'normal',
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: '#0f6fa3',
    paddingLeft: 2,
    paddingRight: 4,
    ':hover': {
      backgroundColor: '#d6eeff',
      color: '#0a557c',
    },
  }),
};

/** Drop-in props for WhatsApp / app-wide compact selects. */
export const neutralSelectProps = {
  classNamePrefix: 'select',
  styles: neutralSelectStyles,
  theme: neutralSelectTheme,
};

/** Portal menu to body so options paint above sticky table headers / next sections. */
export const adminFormSelectPortalProps =
  typeof document !== 'undefined'
    ? { menuPortalTarget: document.body, menuPosition: 'fixed' }
    : { menuPosition: 'fixed' };

/** Admin add/edit form select styles — optional invalid border + multi-select auto height. */
export const getAdminFormSelectClassNames = ({ isMulti = false } = {}) => ({
  control: (state) =>
    isMulti || state.isMulti ? 'admin-form-select__control--is-multi' : undefined,
  valueContainer: (state) =>
    isMulti || state.isMulti ? 'admin-form-select__value-container--is-multi' : undefined,
});

export const getAdminFormSelectStyles = ({ invalid = false, isMulti = false } = {}) => {
  ensureMultiSelectGrowStyles();
  return {
    ...neutralSelectStyles,
    menu: (base) => ({
      ...neutralSelectStyles.menu(base),
      zIndex: 9999,
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),
    option: (base, state) => ({
      ...neutralSelectStyles.option(base, state),
    }),
    control: (base, state) => {
      const multi = isMulti || isMultiSelect(state);
      const next = {
        ...neutralSelectStyles.control(base, {
          ...state,
          isMulti: multi,
          selectProps: { ...state.selectProps, isMulti: multi },
        }),
        ...(invalid
          ? {
              borderColor: '#dc3545',
              '&:hover': { borderColor: '#dc3545' },
            }
          : {}),
      };
      return next;
    },
    valueContainer: (base, state) =>
      neutralSelectStyles.valueContainer(base, {
        ...state,
        isMulti: isMulti || isMultiSelect(state),
        selectProps: { ...state.selectProps, isMulti: isMulti || isMultiSelect(state) },
      }),
    indicatorsContainer: (base, state) =>
      neutralSelectStyles.indicatorsContainer(base, {
        ...state,
        isMulti: isMulti || isMultiSelect(state),
        selectProps: { ...state.selectProps, isMulti: isMulti || isMultiSelect(state) },
      }),
  };
};
