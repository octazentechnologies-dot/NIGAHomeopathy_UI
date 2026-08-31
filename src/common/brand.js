export const APP_TITLE = 'Niga Homeocentrum';

export const pageTitle = (pageName) => (pageName ? `${pageName} | ${APP_TITLE}` : APP_TITLE);

const VELZON_TITLE_PATTERN = /\s*\|\s*Velzon[\s\S]*$/i;
const VELZON_ONLY_PATTERN = /^Velzon[\s\S]*$/i;

export const normalizeDocumentTitle = (title) => {
  if (!title || VELZON_ONLY_PATTERN.test(title.trim())) {
    return APP_TITLE;
  }
  if (VELZON_TITLE_PATTERN.test(title)) {
    return title.replace(VELZON_TITLE_PATTERN, ` | ${APP_TITLE}`);
  }
  return title;
};

export const installDocumentTitleBrand = () => {
  const titleElement = document.querySelector('title');
  if (!titleElement) return;

  let currentTitle = normalizeDocumentTitle(document.title);
  titleElement.textContent = currentTitle;

  try {
    Object.defineProperty(document, 'title', {
      configurable: true,
      get() {
        return currentTitle;
      },
      set(value) {
        currentTitle = normalizeDocumentTitle(value);
        titleElement.textContent = currentTitle;
      },
    });
  } catch {
    // Fallback if title property cannot be redefined
    const observer = new MutationObserver(() => {
      const next = normalizeDocumentTitle(titleElement.textContent);
      if (titleElement.textContent !== next) {
        titleElement.textContent = next;
      }
    });
    observer.observe(titleElement, { childList: true });
  }
};
