const MINIMAL_BLUE = '#25a0e2';
const NEUTRAL_BORDER = '#dee2e6';

/** Same calc as .form-control in themes.scss (0.8rem font + Bootstrap padding + border). */
export const APP_FORM_FIELD_HEIGHT = 'calc(0.8rem * 1.5 + 0.5rem * 2 + 2px)';
export const APP_FORM_FIELD_FONT_SIZE = '0.8rem';

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
    controlHeight: 35,
    baseUnit: 2,
  },
});

/** Neutral react-select: same height/font as .form-control, grey border, blue on focus only. */
export const neutralSelectStyles = {
  control: (base, state) => {
    const isActive = state.isFocused || state.selectProps?.menuIsOpen;
    return {
      ...base,
      minHeight: APP_FORM_FIELD_HEIGHT,
      height: APP_FORM_FIELD_HEIGHT,
      maxHeight: APP_FORM_FIELD_HEIGHT,
      fontSize: APP_FORM_FIELD_FONT_SIZE,
      borderColor: isActive ? MINIMAL_BLUE : NEUTRAL_BORDER,
      boxShadow: 'none',
      '&:hover': {
        borderColor: isActive ? MINIMAL_BLUE : NEUTRAL_BORDER,
      },
    };
  },
  valueContainer: (base) => ({
    ...base,
    paddingTop: 0,
    paddingBottom: 0,
    // Match Bootstrap $input-padding-x (.9rem)
    paddingLeft: '0.9rem',
    paddingRight: '0.9rem',
    height: '100%',
    fontSize: APP_FORM_FIELD_FONT_SIZE,
  }),
  singleValue: (base) => ({
    ...base,
    fontSize: APP_FORM_FIELD_FONT_SIZE,
    lineHeight: 1.5,
    margin: 0,
  }),
  placeholder: (base) => ({
    ...base,
    fontSize: APP_FORM_FIELD_FONT_SIZE,
    lineHeight: 1.5,
    margin: 0,
  }),
  input: (base) => ({
    ...base,
    margin: 0,
    padding: 0,
    fontSize: APP_FORM_FIELD_FONT_SIZE,
    lineHeight: 1.5,
  }),
  indicatorsContainer: (base) => ({
    ...base,
    height: '100%',
    alignSelf: 'stretch',
  }),
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
};

/** Drop-in props for WhatsApp / app-wide compact selects. */
export const neutralSelectProps = {
  classNamePrefix: 'select',
  styles: neutralSelectStyles,
  theme: neutralSelectTheme,
};

/** Admin add/edit form select styles — optional invalid border + multi-select auto height. */
export const getAdminFormSelectStyles = ({ invalid = false, isMulti = false } = {}) => ({
  ...neutralSelectStyles,
  control: (base, state) => {
    const next = {
      ...neutralSelectStyles.control(base, state),
      ...(isMulti
        ? {
            height: 'auto',
            minHeight: APP_FORM_FIELD_HEIGHT,
            maxHeight: 'none',
            alignItems: 'flex-start',
          }
        : {}),
      ...(invalid
        ? {
            borderColor: '#dc3545',
            '&:hover': { borderColor: '#dc3545' },
          }
        : {}),
    };
    return next;
  },
  valueContainer: (base, state) => ({
    ...neutralSelectStyles.valueContainer(base, state),
    ...(isMulti
      ? {
          height: 'auto',
          minHeight: `calc(${APP_FORM_FIELD_HEIGHT} - 2px)`,
          paddingTop: 4,
          paddingBottom: 4,
          paddingLeft: '0.9rem',
          paddingRight: '0.9rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 4,
        }
      : {}),
  }),
  ...(isMulti
    ? {
        multiValue: (base) => ({
          ...base,
          margin: 0,
          backgroundColor: '#e8f5ff',
          borderRadius: 4,
        }),
        multiValueLabel: (base) => ({
          ...base,
          color: '#0f6fa3',
          fontSize: APP_FORM_FIELD_FONT_SIZE,
          fontWeight: 500,
          paddingLeft: 6,
          paddingRight: 4,
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
      }
    : {}),
});
