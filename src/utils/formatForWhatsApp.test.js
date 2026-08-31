import {
  formatForWhatsApp,
  replacePlaceholders,
  decodeHtmlEntities,
  cleanExcessiveWhitespace,
  buildWhatsAppVariables,
  formatDateDdMmmYyyy,
  getWhatsAppEffectiveDate,
  dedupeRepeatedBlocks,
  resolveMessageVariable,
  stripWhatsAppMarkdownMarkers,
  buildWhatsAppOutboundContent,
} from './formatForWhatsApp';

const sampleVariables = {
  PatientName: 'John Doe',
  DoctorName: 'Dr. Sharma',
  HospitalName: 'City Care Hospital',
  Date: '04/06/2026',
  AppointmentDate: '10/06/2026',
  AppointmentTime: '10:30 AM',
  HealthTip: 'Drink 8 glasses of water daily',
  Offer: '20% Discount on Full Body Checkup',
  Message: 'Important clinic update',
};

describe('formatForWhatsApp', () => {
  test('replaces placeholders in plain text', () => {
    const { message, unresolvedPlaceholders } = formatForWhatsApp(
      'Dear {{PatientName}}, welcome to {{HospitalName}}.',
      sampleVariables
    );
    expect(message).toBe('Dear John Doe, welcome to City Care Hospital.');
    expect(unresolvedPlaceholders).toHaveLength(0);
  });

  test('converts bold and italic to WhatsApp markdown', () => {
    const { message } = formatForWhatsApp(
      '<p>Hello <strong>World</strong> and <em>you</em></p>',
      {}
    );
    expect(message).toContain('*World*');
    expect(message).toContain('_you_');
  });

  test('nested strong + em uses bold wrapper around italic', () => {
    const { message } = formatForWhatsApp('<strong><em>Hello</em></strong>', {});
    expect(message).toBe('*_Hello_*');
  });

  test('converts strikethrough and code to WhatsApp markdown', () => {
    const { message } = formatForWhatsApp(
      '<p><s>old</s> <code>fix</code></p>',
      {}
    );
    expect(message).toContain('~old~');
    expect(message).toContain('`fix`');
  });

  test('plainTextOnly strips markdown markers', () => {
    const { message } = formatForWhatsApp('<p><strong>Important</strong></p>', {}, { plainTextOnly: true });
    expect(message).toBe('Important');
    expect(stripWhatsAppMarkdownMarkers('*Important* and _note_')).toBe('Important and note');
  });

  test('converts links to Text (URL)', () => {
    const { message } = formatForWhatsApp(
      '<a href="https://example.com">Click here</a>',
      {}
    );
    expect(message).toBe('Click here (https://example.com)');
  });

  test('converts unordered list items', () => {
    const { message } = formatForWhatsApp(
      '<ul><li>One</li><li>Two</li></ul>',
      {}
    );
    expect(message).toContain('• One');
    expect(message).toContain('• Two');
  });

  test('extracts image metadata separately', () => {
    const { message, images } = formatForWhatsApp(
      '<p>Hi</p><img src="data:image/png;base64,abc" alt="Banner" />',
      {},
      { imagePlaceholder: '' }
    );
    expect(images).toHaveLength(1);
    expect(images[0].src).toContain('data:image/png');
    expect(images[0].alt).toBe('Banner');
    expect(message).not.toContain('data:image');
  });

  test('decodes HTML entities', () => {
    expect(decodeHtmlEntities('Tom &amp; Jerry&nbsp;').trimEnd()).toBe('Tom & Jerry');
  });

  test('cleans excessive whitespace', () => {
    expect(cleanExcessiveWhitespace('Hi  \n\n\n\n  there')).toBe('Hi\n\nthere');
  });

  test('full template example with variables', () => {
    const html = `Dear {{PatientName}},

Greetings from {{HospitalName}}.

Guidance from {{DoctorName}}.

📅 Effective Date: {{Date}}

{{Message}}

Warm Regards,
{{DoctorName}}`;

    const { message, unresolvedPlaceholders } = formatForWhatsApp(html, sampleVariables);
    expect(message).toContain('Dear John Doe');
    expect(message).toContain('City Care Hospital');
    expect(message).toContain('Dr. Sharma');
    expect(message).toContain('04/06/2026');
    expect(message).toContain('Important clinic update');
    expect(message).toContain('📅');
    expect(unresolvedPlaceholders).toHaveLength(0);
  });

  test('reports unresolved placeholders', () => {
    const { unresolvedPlaceholders } = formatForWhatsApp('Hello {{UnknownField}}', {});
    expect(unresolvedPlaceholders).toContain('{{UnknownField}}');
  });
});

describe('getWhatsAppEffectiveDate', () => {
  test('offers tab uses validUntil not messageDate', () => {
    const messageDate = new Date(2026, 5, 4);
    const validUntil = new Date(2026, 5, 6);
    expect(
      getWhatsAppEffectiveDate({ messageDate, validUntil }, 'offers')
    ).toEqual(validUntil);
  });
});

describe('buildWhatsAppVariables', () => {
  test('offers tab maps Date and ValidUntil from validUntil in dd-MMM-yyyy', () => {
    const vars = buildWhatsAppVariables({
      compose: {
        validUntil: new Date(2026, 5, 6),
        messageDate: new Date(2026, 5, 4),
        offerTitle: '10% off',
      },
      activeTab: 'offers',
    });
    expect(vars.Date).toBe('06-Jun-2026');
    expect(vars.ValidUntil).toBe('06-Jun-2026');
  });

  test('maps compose and patient fields', () => {
    const vars = buildWhatsAppVariables({
      compose: {
        doctorName: 'Dr. A',
        hospitalName: 'Clinic',
        messageDate: new Date(2026, 5, 4),
        offerTitle: '10% off',
      },
      patient: { patientName: 'Jane' },
      formattedMessage: 'Body text',
    });
    expect(vars.PatientName).toBe('Jane');
    expect(vars.DoctorName).toBe('Dr. A');
    expect(vars.Offer).toBe('10% off');
    expect(vars.Message).toBe('Body text');
  });
});

describe('replacePlaceholders', () => {
  test('supports legacy snake_case tokens', () => {
    const { text } = replacePlaceholders('Hi {{patient_name}}', { PatientName: 'X' });
    expect(text).toBe('Hi X');
  });
});

describe('dedupeRepeatedBlocks', () => {
  test('removes duplicated second half of letter', () => {
    const letter = 'Dear John,\n\nGreetings from Clinic.\n\nWarm Regards,\nDr. A';
    const duplicated = `${letter}\n\n${letter}`;
    expect(dedupeRepeatedBlocks(duplicated)).toBe(letter);
  });
});

describe('resolveMessageVariable', () => {
  test('extracts only custom block when editor contains full template', () => {
    const template = 'Dear X,\nGreetings from H.\nImportant Information:\n{{Message}}\nWarm Regards';
    const editor =
      'Dear test,\nGreetings from Homeo Centrum.\nImportant Information:\nThis is test messsage\nWarm Regards';
    expect(resolveMessageVariable(editor, template)).toBe('This is test messsage');
  });
});

describe('buildWhatsAppOutboundContent', () => {
  test('does not duplicate template inside preview when editor has full letter', () => {
    const templateBody = `Dear {{PatientName}},

Greetings from {{HospitalName}}.

Important Information:
{{Message}}

Warm Regards,
{{DoctorName}}`;

    const compose = {
      templateID: 1,
      templateBody,
      messageBody: '<p>Dear test,</p><p>Greetings from Homeo Centrum.</p><p>Important Information:</p><p><strong>This is test messsage</strong></p>',
      doctorName: 'Dr. A',
      hospitalName: 'Homeo Centrum',
      messageDate: new Date(2026, 5, 4),
    };

    const { previewMessage, message } = buildWhatsAppOutboundContent({
      compose,
      patient: { patientName: 'test by gourav test' },
      activeTab: 'services',
    });

    expect(message).toContain('This is test messsage');
    expect(message).not.toContain('Greetings from Homeo Centrum');
    const dearCount = (previewMessage.match(/Dear test by gourav test/g) || []).length;
    expect(dearCount).toBe(1);
  });
});
