import React from 'react';

const getSectionId = (section) => section?.sectionId ?? section?.SectionId;
const getSectionName = (section) => section?.sectionName ?? section?.SectionName ?? '';

const normalizeSections = (item) => {
  const sections = (item.sections || item.Sections || []).map((section) => ({
    sectionId: getSectionId(section),
    sectionName: getSectionName(section),
  })).filter((section) => section.sectionId != null);

  if (sections.length > 0) {
    return sections;
  }

  const sectionIds = item.sectionIds || item.SectionIds || [];
  return sectionIds.map((id) => ({
    sectionId: id,
    sectionName: '',
  }));
};

const DiagnosisKeywordTable = ({
  items = [],
  keywordLabel,
  emptyText = 'No items added yet',
  getKeyword,
  getRubrics,
  onDeleteItem,
  onDeleteRubric,
  onRemoveSection,
}) => {
  const renderSections = (item, parentIndex) => {
    const sections = normalizeSections(item);
    if (sections.length === 0) {
      return <span className="text-muted">-</span>;
    }

    return (
      <div className="d-flex flex-wrap gap-1">
        {sections.map((section) => (
          <span
            key={section.sectionId}
            className="badge bg-light text-dark border d-inline-flex align-items-center gap-1"
            style={{ fontWeight: 500 }}
          >
            {section.sectionName || `Section ${section.sectionId}`}
            <button
              type="button"
              className="btn btn-link btn-sm p-0 text-danger lh-1"
              onClick={() => onRemoveSection(parentIndex, section.sectionId)}
              title="Remove section"
            >
              <i className="ri-close-line" />
            </button>
          </span>
        ))}
      </div>
    );
  };

  return (
    <table className="table table-responsive table-bordered table-nowrap">
      <thead>
        <tr>
          <th scope="col">{keywordLabel}</th>
          <th scope="col">Section</th>
          <th scope="col">Subsection</th>
          <th scope="col" className="text-center" style={{ width: '10%' }}>Action</th>
        </tr>
      </thead>
      <tbody>
        {items.length === 0 ? (
          <tr>
            <td colSpan="4" className="text-center">{emptyText}</td>
          </tr>
        ) : (
          items.map((item, parentIndex) => {
            const keyword = getKeyword(item);
            const rubrics = getRubrics(item) || [];
            const rowCount = Math.max(rubrics.length, 1);

            if (rubrics.length > 0) {
              return rubrics.map((rubric, childIndex) => (
                <tr key={`${parentIndex}-${childIndex}`}>
                  {childIndex === 0 ? (
                    <>
                      <td rowSpan={rowCount}>{keyword}</td>
                      <td rowSpan={rowCount}>{renderSections(item, parentIndex)}</td>
                    </>
                  ) : null}
                  <td>{rubric.subsectionName || '-'}</td>
                  <td className="text-center">
                    <div className="remove">
                      <button
                        type="button"
                        className="btn btn-sm btn-soft-danger remove-item-btn"
                        onClick={() => {
                          if (onDeleteRubric) {
                            onDeleteRubric(childIndex, rubric, item, parentIndex);
                          } else {
                            onDeleteItem(parentIndex);
                          }
                        }}
                        title={onDeleteRubric ? 'Remove this subsection' : 'Remove this item'}
                      >
                        <i className="ri-delete-bin-5-line" />
                      </button>
                    </div>
                  </td>
                </tr>
              ));
            }

            return (
              <tr key={parentIndex}>
                <td>{keyword}</td>
                <td>{renderSections(item, parentIndex)}</td>
                <td className="text-muted">-</td>
                <td className="text-center">
                  <div className="remove">
                    <button
                      type="button"
                      className="btn btn-sm btn-soft-danger remove-item-btn"
                      onClick={() => onDeleteItem(parentIndex, item)}
                      title="Remove this item"
                    >
                      <i className="ri-delete-bin-5-line" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
};

export const removeSectionFromKeywordList = (setList, parentIndex, sectionId, rubricKey, onEmptyItem) => {
  setList((prev) => {
    const updated = [...prev];
    const item = { ...updated[parentIndex] };
    const normalizedSections = normalizeSections(item).filter((section) => section.sectionId !== sectionId);
    item.sections = normalizedSections;
    item.sectionIds = normalizedSections.map((section) => section.sectionId);
    if (item.SectionIds) {
      item.SectionIds = item.sectionIds;
    }
    if (item.Sections) {
      item.Sections = normalizedSections.map((section) => ({
        SectionId: section.sectionId,
        SectionName: section.sectionName,
      }));
    }

    const rubrics = item[rubricKey] || [];
    if (normalizedSections.length === 0 && rubrics.length === 0) {
      if (onEmptyItem) {
        onEmptyItem(parentIndex, item);
      }
      updated.splice(parentIndex, 1);
    } else {
      updated[parentIndex] = item;
    }

    return updated;
  });
};

export default DiagnosisKeywordTable;
