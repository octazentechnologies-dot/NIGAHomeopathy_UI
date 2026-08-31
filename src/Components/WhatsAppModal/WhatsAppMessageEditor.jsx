import React, { useEffect, useRef, useState } from "react";
import { convertToRaw, EditorState, ContentState, Modifier } from "draft-js";
import draftToHtml from "draftjs-to-html";
import htmlToDraft from "html-to-draftjs";
import { Editor } from "react-draft-wysiwyg";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

export function getMessageBodyPlainLength(htmlOrText) {
  if (!htmlOrText) return 0;
  if (!String(htmlOrText).includes("<")) return String(htmlOrText).length;
  const el = document.createElement("div");
  el.innerHTML = htmlOrText;
  return (el.textContent || "").replace(/\n$/, "").length;
}

export function convertHtmlToEditorState(html) {
  if (!html) {
    return EditorState.createEmpty();
  }
  const contentBlock = htmlToDraft(html);
  if (contentBlock) {
    const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
    return EditorState.createWithContent(contentState);
  }
  return EditorState.createEmpty();
}

export function getHtmlFromEditorState(editorState) {
  return draftToHtml(convertToRaw(editorState.getCurrentContent()));
}

/** Minimal WhatsApp toolbar: Bold, Italic, links, clear formatting, and emoji. */
export const WHATSAPP_EDITOR_TOOLBAR_CONFIG = {
  options: ["inline", "link", "remove", "emoji"],
  inline: {
    inDropdown: false,
    options: ["bold", "italic"],
  },
  link: {
    inDropdown: false,
    options: ["link", "unlink"],
  },
};

export default function WhatsAppMessageEditor({
  value,
  onChange,
  onEditorReady,
  placeholder = "Write message...",
}) {
  const [editorState, setEditorState] = useState(() => convertHtmlToEditorState(value));
  const editorStateRef = useRef(editorState);
  const lastEmittedHtml = useRef(value || "");
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    editorStateRef.current = editorState;
  }, [editorState]);

  useEffect(() => {
    if (!onEditorReady) return undefined;

    onEditorReady({
      insertText: (token) => {
        const current = editorStateRef.current;
        const contentState = current.getCurrentContent();
        const selection = current.getSelection();
        const nextContent = Modifier.insertText(contentState, selection, token);
        const nextState = EditorState.push(current, nextContent, "insert-characters");
        setEditorState(nextState);
        editorStateRef.current = nextState;
        const html = getHtmlFromEditorState(nextState);
        lastEmittedHtml.current = html;
        onChangeRef.current?.(html);
      },
    });

    return () => onEditorReady(null);
  }, [onEditorReady]);

  useEffect(() => {
    const next = value || "";
    if (next === lastEmittedHtml.current) return;
    const converted = convertHtmlToEditorState(next);
    setEditorState(converted);
    editorStateRef.current = converted;
    lastEmittedHtml.current = next;
  }, [value]);

  const handleEditorChange = (newEditorState) => {
    setEditorState(newEditorState);
    const html = getHtmlFromEditorState(newEditorState);
    lastEmittedHtml.current = html;
    onChange?.(html);
  };

  return (
    <div className="whatsapp-modal__editor">
      <Editor
        editorState={editorState}
        onEditorStateChange={handleEditorChange}
        placeholder={placeholder}
        toolbar={WHATSAPP_EDITOR_TOOLBAR_CONFIG}
        wrapperClassName="whatsapp-modal__editor-wrapper"
        editorClassName="whatsapp-modal__editor-main"
        toolbarClassName="whatsapp-modal__editor-toolbar"
        wrapperStyle={{
          borderRadius: 6,
          border: "1px solid #dee2e6",
        }}
        editorStyle={{
          borderRadius: 2,
          border: "1px solid #e9ecef",
          backgroundColor: "#ffffff",
          minHeight: 180,
          height: 180,
          padding: "8px 12px",
        }}
      />
    </div>
  );
}
