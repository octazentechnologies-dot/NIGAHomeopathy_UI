import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AsyncPaginate } from 'react-select-async-paginate';
import { getSubSectionBySection } from '../../../../helpers/realbackend_helper';
import { getAdminFormSelectStyles, neutralSelectTheme } from '../../../../helpers/neutralSelectStyles';

const SUB_SECTION_OPTIONS_PAGE_SIZE = 30;

const subSectionCache = new Map();
const subSectionPending = new Map();

export const fetchSubSectionsForSection = async (sectionId) => {
  if (!sectionId) return [];

  if (subSectionCache.has(sectionId)) {
    return subSectionCache.get(sectionId);
  }

  if (subSectionPending.has(sectionId)) {
    return subSectionPending.get(sectionId);
  }

  const promise = getSubSectionBySection({ sectionId })
    .then((response) => {
      const list = Array.isArray(response) ? response : (response?.resultObject || []);
      subSectionCache.set(sectionId, list);
      subSectionPending.delete(sectionId);
      return list;
    })
    .catch((error) => {
      subSectionPending.delete(sectionId);
      console.error('Error loading subsections:', error);
      return [];
    });

  subSectionPending.set(sectionId, promise);
  return promise;
};

const loadPaginatedSubSectionOptions = (subSectionList, search, prevOptions) => {
  const options = (subSectionList || []).map((subSection) => ({
    value: subSection.subSectionId,
    label: subSection.subSectionName,
  }));

  const searchLower = (search || '').toLowerCase();
  const filteredOptions = searchLower
    ? options.filter(({ label }) => label.toLowerCase().includes(searchLower))
    : options;

  const hasMore = filteredOptions.length > prevOptions.length + SUB_SECTION_OPTIONS_PAGE_SIZE;
  const slicedOptions = filteredOptions.slice(
    prevOptions.length,
    prevOptions.length + SUB_SECTION_OPTIONS_PAGE_SIZE
  );

  return { options: slicedOptions, hasMore };
};

const DiagnosisSubSectionSelect = ({
  sectionId,
  value,
  onChange,
  isMulti = true,
  placeholder = 'Select one or more subsection',
  isClearable = true,
  isDisabled = false,
  closeMenuOnSelect = false,
  name,
}) => {
  const subSectionListRef = useRef([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sectionId) {
      subSectionListRef.current = [];
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    fetchSubSectionsForSection(sectionId)
      .then((list) => {
        if (!cancelled) {
          subSectionListRef.current = list;
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sectionId]);

  const loadOptions = useCallback(
    async (search, prevOptions) => {
      if (!sectionId) {
        return { options: [], hasMore: false };
      }

      if (!subSectionListRef.current.length) {
        const list = await fetchSubSectionsForSection(sectionId);
        subSectionListRef.current = list;
      }

      return loadPaginatedSubSectionOptions(subSectionListRef.current, search, prevOptions);
    },
    [sectionId]
  );

  return (
    <AsyncPaginate
      key={`diagnosis-subsection-${sectionId || 'none'}-${isMulti ? 'multi' : 'single'}`}
      name={name}
      value={value}
      onChange={onChange}
      loadOptions={loadOptions}
      debounceTimeout={300}
      additional={{ page: 1 }}
      isMulti={isMulti}
      isClearable={isClearable}
      closeMenuOnSelect={isMulti ? closeMenuOnSelect : true}
      isDisabled={isDisabled || !sectionId}
      isLoading={loading}
      placeholder={
        !sectionId
          ? 'Select Section first'
          : loading
            ? 'Loading subsections...'
            : placeholder
      }
      className="diagnosis-subsection-select"
      classNamePrefix="admin-form-select"
      theme={neutralSelectTheme}
      styles={{
        ...getAdminFormSelectStyles({ isMulti }),
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
      }}
      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
      menuPosition="fixed"
    />
  );
};

export default DiagnosisSubSectionSelect;
