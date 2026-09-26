import React, { useState } from "react";
import { Alert, Button, Card, CardBody, Container, Input, Label } from "reactstrap";
import { saveHelpArticle } from "../../helpers/realbackend_helper";

const HelpAdminPage = () => {
  const [form, setForm] = useState({ title: "", slug: "", body: "", isPublished: true });
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  document.title = "Help articles | Niga Homeocentrum";

  const save = async () => {
    setError("");
    setNote("");
    if (!form.title.trim() || !form.slug.trim()) {
      setError("Title and slug are required.");
      return;
    }
    try {
      await saveHelpArticle({
        title: form.title.trim(),
        slug: form.slug.trim(),
        body: form.body,
        isPublished: form.isPublished,
      });
      setNote("Help article saved.");
    } catch (err) {
      setError(err?.message || "Could not save the article.");
    }
  };

  return (
    <div className="page-content">
      <Container fluid>
        <h4>Publish help article</h4>
        <p className="text-muted">Public help centre reads published articles from /help.</p>
        {error ? <Alert color="danger">{error}</Alert> : null}
        {note ? <Alert color="success">{note}</Alert> : null}
        <Card>
          <CardBody>
            <Label>Title</Label>
            <Input className="mb-2" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
            <Label>Slug</Label>
            <Input className="mb-2" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} />
            <Label>Body (HTML allowed)</Label>
            <Input type="textarea" rows={8} className="mb-2" value={form.body} onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))} />
            <Label className="d-flex align-items-center gap-2">
              <Input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm((p) => ({ ...p, isPublished: e.target.checked }))}
              />
              Published
            </Label>
            <Button className="mt-2" color="primary" onClick={save}>
              Save
            </Button>
          </CardBody>
        </Card>
      </Container>
    </div>
  );
};

export default HelpAdminPage;
