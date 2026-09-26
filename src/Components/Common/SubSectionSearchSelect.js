import React, { useCallback, useMemo } from "react";
import AsyncSelect from "react-select/async";
import { searchRubricsByKeyword } from "../../helpers/realbackend_helper";

const mapOption = (row) => {
  const id = row.subSectionID ?? row.SubSectionID ?? row.subSectionId ?? row.SubSectionId;
  const name = row.subSectionName ?? row.SubSectionName ?? "";
  const section = row.sectionName ?? row.SectionName ?? "";
  if (id == null) return null;
  return {
    value: Number(id),
    label: section ? `${name} (${section}) · #${id}` : `${name} · #${id}`,
  };
};

/**
 * Searchable SubSection picker for admin forms (New-API SearchRubricsByKeyword).
 */
const SubSectionSearchSelect = ({ value, onChange, isClearable = true, placeholder = "Search rubric / subsection..." }) => {
  const selected = useMemo(() => {
    if (value == null || value === "") return null;
    if (typeof value === "object" && value.value != null) return value;
    return { value: Number(value), label: `SubSection #${value}` };
  }, [value]);

  const loadOptions = useCallback(async (inputValue) => {
    const keyword = (inputValue || "").trim();
    if (keyword.length < 2) return [];
    try {
      const response = await searchRubricsByKeyword({
        keyword,
        pageNumber: 1,
        pageSize: 25,
      });
      const payload = response?.resultObject ?? response?.ResultObject ?? response?.data ?? response ?? {};
      const items = payload.items ?? payload.Items ?? (Array.isArray(payload) ? payload : []);
      return (Array.isArray(items) ? items : []).map(mapOption).filter(Boolean);
    } catch {
      return [];
    }
  }, []);

  return (
    <AsyncSelect
      cacheOptions
      defaultOptions={false}
      loadOptions={loadOptions}
      value={selected}
      onChange={(option) => onChange(option)}
      isClearable={isClearable}
      placeholder={placeholder}
      noOptionsMessage={({ inputValue }) =>
        (inputValue || "").trim().length < 2 ? "Type at least 2 characters" : "No rubrics found"
      }
      classNamePrefix="react-select"
    />
  );
};

export default SubSectionSearchSelect;
