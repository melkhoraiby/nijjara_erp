// FormRenderer.js — dynamic form builder using SYS_Dynamic_Forms & SYS_Dropdowns

function getFormDefinition(formId, locale = 'ar') {
  try {
    const forms = _getRows('SYS_Dynamic_Forms');
    const localized = _getRows('SYS_L10N');
    const form = forms.find((f) => f.Form_Id === formId);

    if (!form) return { success: false, error: 'Form not found.' };

    const fields = _getRows('SYS_Dynamic_Forms')
      .filter((f) => f.Form_Id === formId && f.IsActive === true)
      .map((f) => {
        const localizedLabel = localized.find(
          (l) => l.Locale === locale && l.Item_Key === f.Field_Key
        );
        const label = localizedLabel ? localizedLabel.Label_Text : f.Field_Label;
        let options = [];
        if (f.Field_Type === 'dropdown') {
          const dd = getDropdownOptions(f.Dropdown_Category, locale);
          options = dd.success ? dd.data : [];
        }
        return {
          key: f.Field_Key,
          label,
          type: f.Field_Type,
          required: f.IsRequired,
          options,
          default: f.Default_Value,
        };
      });

    return { success: true, data: { formId, fields } };
  } catch (e) {
    logAction('getFormDefinition', 'ERROR', { formId, error: e.toString() });
    return { success: false, error: 'Failed to load form definition.' };
  }
}
