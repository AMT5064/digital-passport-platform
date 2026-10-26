// Registration form rules shared by the admin designer, the attendee form and the register API

export type FieldMode = 'required' | 'optional' | 'hidden'
export type CustomFieldType = 'TEXT' | 'SELECT' | 'CHECKBOX'

export interface CustomField {
  id: string
  label: string
  type: CustomFieldType
  options: string[]
  required: boolean
}

export interface RegistrationForm {
  fields: Record<StandardFieldKey, FieldMode>
  customFields: CustomField[]
  welcomeText: string
}

// Name, email and password are always collected because the account needs them
export const LOCKED_FIELDS = [
  { key: 'firstName', label: 'First name' },
  { key: 'lastName', label: 'Last name' },
  { key: 'email', label: 'Email' },
  { key: 'password', label: 'Password' },
] as const

export const STANDARD_FIELDS = [
  { key: 'mobile', label: 'Mobile number', placeholder: '+91 98765 43210', type: 'tel' },
  { key: 'company', label: 'Company', placeholder: 'Your company', type: 'text' },
  { key: 'designation', label: 'Job title', placeholder: 'Your role', type: 'text' },
] as const

export type StandardFieldKey = (typeof STANDARD_FIELDS)[number]['key']

export const CUSTOM_FIELD_LABELS: Record<CustomFieldType, string> = {
  TEXT: 'Text answer',
  SELECT: 'Dropdown',
  CHECKBOX: 'Checkbox (yes / no)',
}

export const defaultRegistrationForm = (): RegistrationForm => ({
  fields: { mobile: 'optional', company: 'optional', designation: 'optional' },
  customFields: [],
  welcomeText: '',
})

const asList = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : [])

// Turns the stored RegistrationConfig row (or none) into the form shape
export function registrationFormFromConfig(config: any): RegistrationForm {
  const form = defaultRegistrationForm()
  if (!config) return form
  const required = asList(config.requiredFields)
  const hidden = asList(config.hiddenFields)
  for (const f of STANDARD_FIELDS) {
    form.fields[f.key] = required.includes(f.key) ? 'required' : hidden.includes(f.key) ? 'hidden' : 'optional'
  }
  form.customFields = Array.isArray(config.customFields)
    ? config.customFields
        .filter((c: any) => c && c.id && c.label)
        .map((c: any) => ({
          id: String(c.id),
          label: String(c.label),
          type: (['TEXT', 'SELECT', 'CHECKBOX'].includes(c.type) ? c.type : 'TEXT') as CustomFieldType,
          options: asList(c.options),
          required: !!c.required,
        }))
    : []
  form.welcomeText = config.welcomeText || ''
  return form
}

// Converts the form shape back into RegistrationConfig columns
export function configFromRegistrationForm(form: RegistrationForm) {
  const keys = STANDARD_FIELDS.map((f) => f.key)
  return {
    requiredFields: keys.filter((k) => form.fields[k] === 'required'),
    optionalFields: keys.filter((k) => form.fields[k] === 'optional'),
    hiddenFields: keys.filter((k) => form.fields[k] === 'hidden'),
    customFields: form.customFields
      .filter((c) => c.label.trim())
      .map((c) => ({
        ...c,
        label: c.label.trim(),
        options: c.type === 'SELECT' ? c.options.map((o) => o.trim()).filter(Boolean) : [],
      })),
    welcomeText: form.welcomeText.trim() || null,
  }
}

// Server-side check of a registration against the event's form. Returns an error message or null.
export function checkRegistration(form: RegistrationForm, body: any): string | null {
  for (const f of STANDARD_FIELDS) {
    if (form.fields[f.key] === 'required' && !String(body?.[f.key] || '').trim()) {
      return `${f.label} is required`
    }
  }
  const answers = body?.registrationData || {}
  for (const c of form.customFields) {
    const value = answers[c.id]
    const answered = c.type === 'CHECKBOX' ? value === true : !!String(value || '').trim()
    if (c.required && !answered) return `${c.label} is required`
    if (c.type === 'SELECT' && value && !c.options.includes(String(value))) return `Choose a valid option for ${c.label}`
  }
  return null
}
