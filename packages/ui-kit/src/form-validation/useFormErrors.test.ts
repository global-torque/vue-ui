import type { ErrorObject } from 'ajv';
import { describe, expect, it } from 'vitest';
import { useFormErrors } from './useFormErrors';

function error(instancePath: string, message: string): ErrorObject {
  return {
    instancePath,
    keyword: 'custom',
    params: {},
    schemaPath: '#/properties',
    message,
  };
}

function restoreObjectPrototypeProperty(
  name: string,
  descriptor: PropertyDescriptor | undefined,
) {
  if (descriptor) Object.defineProperty(Object.prototype, name, descriptor);
  else Reflect.deleteProperty(Object.prototype, name);
}

describe('useFormErrors', () => {
  it('keeps reserved field names visible without mutating Object.prototype', () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(Object.prototype, '__errors');
    try {
      const form = useFormErrors();
      form.setErrors([
        error('/__proto__', 'Proto error'),
        error('/constructor/name', 'Constructor error'),
        error('/prototype/value', 'Prototype error'),
        error('/nested/__proto__/value', 'Nested proto error'),
      ]);

      const fields = form.fieldErrors.value;
      expect(Object.getPrototypeOf(fields)).toBeNull();
      expect(Object.keys(fields)).toEqual(['__proto__', 'constructor', 'prototype', 'nested']);
      expect(fields['__proto__']).toBe('Proto error');
      expect(Object.getPrototypeOf(fields.constructor)).toBeNull();
      expect(Object.getPrototypeOf(fields.prototype)).toBeNull();
      const nested = fields.nested as Record<string, unknown>;
      expect(Object.getPrototypeOf(nested['__proto__'])).toBeNull();
      expect(form.hasErrors.value).toBe(true);
      expect(form.getFieldError('__proto__')).toBe('Proto error');
      expect(form.getFieldError('constructor.name')).toBe('Constructor error');
      expect(form.getFieldError('prototype.value')).toBe('Prototype error');
      expect(form.getFieldError('nested.__proto__.value')).toBe('Nested proto error');
      expect(form.hasFieldError('__proto__')).toBe(true);
      expect(form.hasFieldError('constructor.name')).toBe(true);
      expect(form.hasFieldError('prototype.value')).toBe(true);
      expect(Object.getOwnPropertyDescriptor(Object.prototype, '__errors')).toEqual(originalDescriptor);
      expect(Object.prototype.hasOwnProperty.call({}, '__errors')).toBe(false);
    } finally {
      restoreObjectPrototypeProperty('__errors', originalDescriptor);
    }
    expect(Object.getOwnPropertyDescriptor(Object.prototype, '__errors')).toEqual(originalDescriptor);
  });

  it('uses only own values when checking external form errors', () => {
    const form = useFormErrors();
    const inherited = Object.create({ profile: { name: 'inherited error' } });
    const ownNested = Object.create(null) as Record<string, unknown>;
    ownNested.name = 'own error';
    const own = Object.create(null) as Record<string, unknown>;
    own.profile = ownNested;

    expect(form.hasFormErrors(inherited, ['profile'])).toBe(false);
    expect(form.hasFormErrors({ profile: Object.create({ name: 'inherited error' }) }, ['profile.name'])).toBe(false);
    expect(form.hasFormErrors(own, ['profile'])).toBe(true);
    expect(form.hasFormErrors(own, ['profile.name'])).toBe(true);
    expect(form.hasFormErrors(JSON.parse('{"__proto__":{"name":"own error"}}'), ['__proto__'])).toBe(true);
  });

  it('preserves bracket path semantics while scanning malformed paths forward', () => {
    const form = useFormErrors();
    const malformedPath = `long${'['.repeat(10_000)}tail`;
    form.setErrors([
      error('/a[b]c', 'bracket error'),
      error('/items[0].name', 'index error'),
      error('/empty[]', 'empty error'),
      error('/unmatched[tail', 'unmatched error'),
      error('/nested[[b]c', 'nested opening error'),
      error(`/${malformedPath}`, 'long malformed error'),
    ]);

    expect(form.getFieldError('a.bc')).toBe('bracket error');
    expect(form.getFieldError('items.0.name')).toBe('index error');
    expect(form.getFieldError('empty[]')).toBe('empty error');
    expect(form.getFieldError('unmatched[tail')).toBe('unmatched error');
    expect(form.getFieldError('nested.[bc')).toBe('nested opening error');
    expect(form.getFieldError(malformedPath)).toBe('long malformed error');
    expect(form.hasFieldError('items[0].name')).toBe(true);
  });

  it('clears a field and all errors, then resets ignored fields on new errors', () => {
    const form = useFormErrors();
    form.setErrors([error('/name', 'Name error'), error('/email', 'Email error')]);
    form.clearFieldError('name');
    expect(form.getFieldError('name')).toBe('');
    expect(form.getFieldError('email')).toBe('Email error');

    form.setErrors([error('/name', 'Name error again')]);
    expect(form.getFieldError('name')).toBe('Name error again');
    form.clearErrors();
    expect(form.hasErrors.value).toBe(false);
    expect(Object.keys(form.fieldErrors.value)).toEqual([]);

    form.setErrors([error('/name', 'Ordinary error after clear')]);
    expect(form.hasErrors.value).toBe(true);
    expect(form.getFieldError('name')).toBe('Ordinary error after clear');
  });

  it('keeps error trees isolated between hook instances', () => {
    const first = useFormErrors();
    const second = useFormErrors();
    first.setErrors([error('/first', 'First error')]);
    second.setErrors([error('/second', 'Second error')]);

    expect(first.getFieldError('first')).toBe('First error');
    expect(first.getFieldError('second')).toBe('');
    expect(second.getFieldError('second')).toBe('Second error');
    expect(second.getFieldError('first')).toBe('');
    first.clearErrors();
    expect(second.getFieldError('second')).toBe('Second error');
  });
});
