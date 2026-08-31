import React from "react";
import { Button, Table } from "reactstrap";

const formatLastUsed = (value) => value || "—";

export default function SavedTemplatesList({
  templates,
  onEdit,
  onDelete,
  onSend,
}) {
  const list = Array.isArray(templates) ? templates : [];

  return (
    <div className="table-responsive">
      <Table className="table align-middle mb-0 table-sm">
        <thead className="table-light">
          <tr>
            <th style={{ width: "40%" }}>Template Name</th>
            <th style={{ width: "15%" }}>Language</th>
            <th style={{ width: "20%" }}>Last Used</th>
            <th style={{ width: "25%" }} className="text-end">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {list.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center text-muted py-3">
                No templates saved yet.
              </td>
            </tr>
          ) : (
            list.map((t) => (
              <tr key={t.templateID ?? t.id}>
                <td className="fw-semibold">{t.templateName || "—"}</td>
                <td className="text-muted">{t.languageName || "—"}</td>
                <td className="text-muted">{formatLastUsed(t.lastUsed)}</td>
                <td className="text-end">
                  <div className="d-inline-flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="btn btn-soft-success"
                      onClick={() => onEdit?.(t)}
                      aria-label="Edit template"
                    >
                      <i className="ri-pencil-fill" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="btn btn-soft-primary"
                      onClick={() => onSend?.(t)}
                      aria-label="Send template"
                    >
                      <i className="ri-send-plane-fill" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="btn btn-soft-danger"
                      onClick={() => onDelete?.(t)}
                      aria-label="Delete template"
                    >
                      <i className="ri-delete-bin-5-line" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  );
}

