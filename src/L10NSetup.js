// L10NSetup.js — Arabic UI localization helper

function translateLabel(itemKey, locale = 'ar') {
  const l10n = _getRows('SYS_L10N');
  const row = l10n.find((r) => r.Item_Key === itemKey && r.Locale === locale);
  return row ? row.Label_Text : itemKey;
}

function localizeInterface(elements, locale = 'ar') {
  try {
    const l10n = _getRows('SYS_L10N');
    elements.forEach((el) => {
      const translation = l10n.find((l) => l.Item_Key === el.dataset.key && l.Locale === locale);
      if (translation) el.textContent = translation.Label_Text;
    });
  } catch (e) {
    logAction('localizeInterface', 'ERROR', { error: e.toString() });
  }
}
