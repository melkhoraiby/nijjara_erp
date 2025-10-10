// Dropdowns.js — dynamic dropdowns based on SYS_Dropdowns & SYS_L10N

function getDropdownOptions(categoryKey, locale = 'ar') {
  try {
    const rows = _getRows('SYS_Dropdowns');
    const localized = _getRows('SYS_L10N');

    const options = rows
      .filter((r) => r.Category_Key === categoryKey && r.IsActive === true)
      .map((opt) => {
        const localizedLabel = localized.find(
          (l) => l.Locale === locale && l.Item_Key === opt.Option_Key
        );
        return {
          key: opt.Option_Key,
          label: localizedLabel ? localizedLabel.Label_Text : opt.Option_Label,
        };
      });

    return { success: true, data: options };
  } catch (e) {
    logAction('getDropdownOptions', 'ERROR', { categoryKey, error: e.toString() });
    return { success: false, error: 'Failed to load dropdown options.' };
  }
}
