// Import plugin packages directly. The "ckeditor5" entry re-exports every CKEditor package, and the dev server
// then processes all of them with their source maps, which fills gigabytes of node_modules/.cache.
import { ClassicEditor as ClassicEditorBase } from "@ckeditor/ckeditor5-editor-classic";
import { Autoformat } from "@ckeditor/ckeditor5-autoformat";
import { Bold, Italic } from "@ckeditor/ckeditor5-basic-styles";
import { BlockQuote } from "@ckeditor/ckeditor5-block-quote";
import { Essentials } from "@ckeditor/ckeditor5-essentials";
import { Heading } from "@ckeditor/ckeditor5-heading";
import { Image, ImageCaption, ImageStyle, ImageToolbar } from "@ckeditor/ckeditor5-image";
import { Indent } from "@ckeditor/ckeditor5-indent";
import { Link } from "@ckeditor/ckeditor5-link";
import { List } from "@ckeditor/ckeditor5-list";
import { MediaEmbed } from "@ckeditor/ckeditor5-media-embed";
import { Paragraph } from "@ckeditor/ckeditor5-paragraph";
import { PasteFromOffice } from "@ckeditor/ckeditor5-paste-from-office";
import { Table, TableToolbar } from "@ckeditor/ckeditor5-table";
import { TextTransformation } from "@ckeditor/ckeditor5-typing";
import "ckeditor5/ckeditor5.css";

// Same toolbar and features as the retired @ckeditor/ckeditor5-build-classic, without its cloud upload plugins.
export default class ClassicEditor extends ClassicEditorBase {
  static builtinPlugins = [
    Essentials,
    Autoformat,
    Bold,
    Italic,
    BlockQuote,
    Heading,
    Image,
    ImageCaption,
    ImageStyle,
    ImageToolbar,
    Indent,
    Link,
    List,
    MediaEmbed,
    Paragraph,
    PasteFromOffice,
    Table,
    TableToolbar,
    TextTransformation,
  ];

  static defaultConfig = {
    licenseKey: "GPL",
    toolbar: {
      items: [
        "undo", "redo",
        "|", "heading",
        "|", "bold", "italic",
        "|", "link", "insertTable", "blockQuote", "mediaEmbed",
        "|", "bulletedList", "numberedList", "outdent", "indent",
      ],
    },
    image: {
      toolbar: ["imageStyle:inline", "imageStyle:block", "imageStyle:side", "|", "toggleImageCaption", "imageTextAlternative"],
    },
    table: {
      contentToolbar: ["tableColumn", "tableRow", "mergeTableCells"],
    },
    language: "en",
  };
}
