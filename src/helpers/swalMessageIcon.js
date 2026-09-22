import Swal from 'sweetalert2';

function plain(value) {
  if (value == null) return '';
  return String(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Pick the SweetAlert icon from the words the user will read.
export function iconForMessage(raw) {
  const text = plain(raw).toLowerCase();
  if (!text) return null;
  if (/\b(failed|failure|error|unable|could not)\b/.test(text)) return 'error';
  if (
    /^(no|none|nothing)\b/.test(text)
    || /\b(not found|no data|nothing to|clipboard empty)\b/.test(text)
    || /\bempty\b/.test(text)
  ) {
    return 'info';
  }
  if (/^(please|missing)\b/.test(text) || /\b(required|warning|invalid|are you sure)\b/.test(text)) {
    return 'warning';
  }
  if (/\b(success(?:fully)?|saved|updated|deleted|restored|completed|added|created|registered)\b/.test(text)) {
    return 'success';
  }
  return null;
}

export function iconForPopup({ title, text, html } = {}) {
  const heading = plain(title);
  const body = plain(text || html);
  const bodyIcon = iconForMessage(body);
  const titleIcon = iconForMessage(heading);
  if (bodyIcon === 'error' || bodyIcon === 'info' || bodyIcon === 'warning') return bodyIcon;
  if (/^error!?$/i.test(heading)) return 'error';
  if (/^warning!?$/i.test(heading)) return 'warning';
  if (titleIcon === 'error' || titleIcon === 'warning') return titleIcon;
  if (/^success!?$/i.test(heading)) return 'success';
  return bodyIcon || titleIcon;
}

const originalFire = Swal.fire.bind(Swal);

Swal.fire = function fireWithMessageIcon(...args) {
  if (args.length >= 1 && args[0] && typeof args[0] === 'object') {
    const opts = { ...args[0] };
    if (typeof opts.didOpen === 'function') {
      return originalFire(opts);
    }
    const inferred = iconForPopup(opts);
    if (!opts.icon && inferred) {
      opts.icon = inferred;
    } else if (opts.icon === 'success' && inferred && inferred !== 'success') {
      opts.icon = inferred;
    } else if (!opts.icon && opts.showCancelButton && !opts.input) {
      opts.icon = 'question';
    }
    return originalFire(opts);
  }

  if (typeof args[0] === 'string') {
    const title = args[0];
    const text = typeof args[1] === 'string' ? args[1] : undefined;
    const icon = typeof args[2] === 'string' ? args[2] : undefined;
    const inferred = iconForPopup({ title, text });
    if (!icon && inferred) return originalFire({ title, text, icon: inferred });
    if (icon === 'success' && inferred && inferred !== 'success') {
      return originalFire({ title, text, icon: inferred });
    }
  }

  return originalFire(...args);
};

export default Swal;
