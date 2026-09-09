import { mount } from '@vue/test-utils';
import {
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { nextTick, ref } from 'vue';
import VFormGroup from './VFormGroup.vue';
import VFormInput from './VFormInput.vue';
import VFormTextarea from './VFormTextarea.vue';
import VFormInputPassword from './VFormInputPassword.vue';
import VFormInputSearch from './VFormInputSearch.vue';
import VFormDatePicker from './VFormDatePicker.vue';
import VFormCheckbox from './VFormCheckbox.vue';
import VFormRadio from './VFormRadio.vue';
import VFormInputOtp from './VInputOtp/VFormInputOtp.vue';

beforeAll(() => {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  vi.stubGlobal('ResizeObserver', ResizeObserverMock);
});

describe('form primitive accessibility', () => {
  it('reacts to mask changes after mount', async () => {
    const wrapper = mount(VFormInput, {
      props: {
        mask: '##-##',
        modelValue: '1234',
      },
    });

    expect(wrapper.get('input').element.value).toBe('12-34');

    await wrapper.setProps({ mask: '###-#' });

    expect(wrapper.get('input').element.value).toBe('123-4');
  });

  it('filters arrays of disallowed characters while preserving explicit exceptions', async () => {
    const wrapper = mount(VFormInput, {
      props: {
        allowChars: ['@'],
        disallowChars: ['x', '-'],
        disallowSpecialChars: true,
        modelValue: '',
      },
    });
    const input = wrapper.get('input');

    await input.setValue('name@x-test');

    expect(input.element.value).toBe('name@test');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['name@test']);
  });

  it('publishes the exact browser value from a single input event', async () => {
    const wrapper = mount(VFormInput, {
      props: { modelValue: '' },
    });
    const input = wrapper.get('input');

    input.element.value = 'autofilled@example.test';
    await input.trigger('input');

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([
      'autofilled@example.test',
    ]);
  });

  it('synchronizes a parent v-model from one browser input event', async () => {
    const wrapper = mount({
      components: { VFormInput },
      setup() {
        const value = ref('');
        return { value };
      },
      template: '<VFormInput v-model="value" />',
    });
    const input = wrapper.get('input');

    input.element.value = 'one-event-value';
    await input.trigger('input');

    expect((wrapper.vm as unknown as { value: string }).value).toBe('one-event-value');
    expect(input.element.value).toBe('one-event-value');
  });

  it('filters pasted text synchronously without leaving an unmanaged timer', async () => {
    const wrapper = mount(VFormInput, {
      props: {
        disallowChars: ['x'],
        modelValue: '',
      },
    });
    const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(pasteEvent, 'clipboardData', {
      value: { getData: () => '  safe  x value  ' },
    });

    wrapper.get('input').element.dispatchEvent(pasteEvent);
    await nextTick();

    expect(pasteEvent.defaultPrevented).toBe(true);
    expect(wrapper.get('input').element.value).toBe('safe value');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['safe value']);
  });

  it('formats money with caller-provided locale and currency', async () => {
    const wrapper = mount(VFormInput, {
      props: {
        modelValue: '',
        moneyCurrency: 'EUR',
        moneyFormat: true,
        moneyLocale: 'de-DE',
      },
    });

    await wrapper.get('input').setValue('1234');

    expect(wrapper.get('input').element.value).toBe(
      Intl.NumberFormat('de-DE', {
        currency: 'EUR',
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
        style: 'currency',
      }).format(1234),
    );
  });

  it('associates labels, errors, and helper text with text inputs', () => {
    const wrapper = mount({
      components: { VFormGroup, VFormInput },
      template: `
        <VFormGroup
          label="Email Address"
          helper-text="Use your work email."
          :required="true"
          :error-text="['Email is required']"
        >
          <VFormInput model-value="" />
        </VFormGroup>
      `,
    });

    const label = wrapper.get('label');
    const input = wrapper.get('input');
    const error = wrapper.get('[data-testid="input-error"]');
    const helper = wrapper.get('.v-form-group__helper');

    expect(label.attributes('for')).toBe(input.attributes('id'));
    expect(input.attributes('aria-invalid')).toBe('true');
    expect(input.attributes('aria-required')).toBe('true');
    expect(input.attributes('aria-describedby')).toContain(error.attributes('id'));
    expect(input.attributes('aria-describedby')).toContain(helper.attributes('id'));
  });

  it('lets explicit ids and aria attributes win over generated form context', () => {
    const wrapper = mount({
      components: { VFormGroup, VFormInput },
      template: `
        <VFormGroup label="Email Address" :error-text="['Email is required']">
          <VFormInput
            id="caller-email"
            aria-describedby="caller-description"
            aria-invalid="false"
            model-value=""
          />
        </VFormGroup>
      `,
    });

    const input = wrapper.get('input');

    expect(input.attributes('id')).toBe('caller-email');
    expect(input.attributes('aria-describedby')).toBe('caller-description');
    expect(input.attributes('aria-invalid')).toBe('false');
  });

  it('uses native disabled semantics on text inputs and textareas', () => {
    const wrapper = mount({
      components: { VFormInput, VFormTextarea },
      template: `
        <div>
          <VFormInput model-value="" disabled />
          <VFormTextarea model-value="" disabled />
        </div>
      `,
    });

    expect(wrapper.get('input').attributes('disabled')).toBeDefined();
    expect(wrapper.get('textarea').attributes('disabled')).toBeDefined();
  });

  it('uses real named buttons for password reveal and can skip them in Tab order', async () => {
    const wrapper = mount({
      components: { VFormGroup, VFormInputPassword },
      template: `
        <VFormGroup label="Password">
          <VFormInputPassword model-value="secret" :reveal-tabbable="false" />
        </VFormGroup>
      `,
    });

    const input = wrapper.get('input');
    const button = wrapper.get('button[aria-label="Show password"]');

    expect(button.attributes('type')).toBe('button');
    expect(button.attributes('tabindex')).toBe('-1');
    expect(button.attributes('aria-pressed')).toBe('false');
    expect(button.attributes('aria-controls')).toBe(input.attributes('id'));

    await button.trigger('click');

    expect(wrapper.get('input').attributes('type')).toBe('text');
    expect(wrapper.get('button[aria-label="Hide password"]').attributes('aria-pressed')).toBe('true');
  });

  it('supplies reactive visibility state to custom password artwork', async () => {
    const wrapper = mount({
      components: { VFormInputPassword },
      template: `<VFormInputPassword model-value="secret">
        <template #visibility-icon="{ visible }"><span data-artwork>{{ visible ? 'visible' : 'hidden' }}</span></template>
      </VFormInputPassword>`,
    });
    expect(wrapper.get('[data-artwork]').text()).toBe('hidden');
    await wrapper.get('button[aria-label="Show password"]').trigger('click');
    expect(wrapper.get('[data-artwork]').text()).toBe('visible');
    expect(wrapper.get('input').attributes('type')).toBe('text');
  });

  it('exposes date picker as a labelled native button', async () => {
    const wrapper = mount({
      components: { VFormGroup, VFormDatePicker },
      template: `
        <VFormGroup label="Date of Birth" :error-text="['Required']">
          <VFormDatePicker model-value="" />
        </VFormGroup>
      `,
    });

    const label = wrapper.get('label');
    const button = wrapper.get('button.VFormDatePicker');

    expect(button.attributes('type')).toBe('button');
    expect(button.attributes('id')).toBe(label.attributes('for'));
    expect(button.attributes('aria-invalid')).toBe('true');
    expect(button.attributes('aria-haspopup')).toBe('dialog');

    await button.trigger('click');

    expect(button.attributes('aria-expanded')).toBe('true');
  });

  it('labels checkbox and radio controls and applies native disabled state', () => {
    const wrapper = mount({
      components: { VFormGroup, VFormCheckbox, VFormRadio },
      template: `
        <div>
          <VFormGroup label="Agreement" :error-text="['Required']">
            <VFormCheckbox disabled>Accept terms</VFormCheckbox>
          </VFormGroup>
          <VFormGroup label="Investor type">
            <VFormRadio
              :model-value="'retail'"
              name="investor-type"
              :options="['retail', 'professional']"
              disabled
            />
          </VFormGroup>
        </div>
      `,
    });

    const checkbox = wrapper.get('.VCheckbox');
    const radioGroup = wrapper.get('[role="radiogroup"]');
    // the primitive radio is a button with role=radio (a hidden input only appears inside a form)
    const radios = wrapper.findAll('[role="radio"]');

    expect(wrapper.get('label[for]').attributes('for')).toBe(checkbox.attributes('id'));
    expect(checkbox.attributes('aria-invalid')).toBe('true');
    expect(radioGroup.attributes('aria-labelledby')).toBeDefined();
    expect(radios).toHaveLength(2);
    expect(radios.every((radio) => radio.attributes('disabled') !== undefined)).toBe(true);
  });

  it('keeps checkbox labels and model updates when the host supplies indicator artwork', async () => {
    const wrapper = mount({
      components: { VFormCheckbox },
      setup() {
        const checked = ref(true);
        return { checked };
      },
      template: `<VFormCheckbox v-model="checked">
        Accept terms
        <template #indicator><svg data-test="approved-check" aria-hidden="true" /></template>
      </VFormCheckbox>`,
    });
    const checkbox = wrapper.get('[role="checkbox"]');
    expect(wrapper.find('[data-slot="checkbox-indicator"] [data-test="approved-check"]').exists()).toBe(true);
    expect(wrapper.find('.lucide-check').exists()).toBe(false);
    expect(wrapper.get('label').text()).toBe('Accept terms');
    expect(wrapper.get('label').attributes('for')).toBe(checkbox.attributes('id'));
    await checkbox.trigger('click');
    expect(wrapper.vm.checked).toBe(false);
    expect(checkbox.attributes('aria-checked')).toBe('false');

    const standard = mount(VFormCheckbox, { props: { modelValue: true }, slots: { default: 'Standard terms' } });
    expect(standard.find('[data-slot="checkbox-indicator"] .lucide-check').exists()).toBe(true);
  });

  it('keeps checkboxes in Safari sequential Tab order and honors caller overrides', () => {
    const wrapper = mount({
      components: { VFormCheckbox },
      template: `
        <div>
          <VFormCheckbox>Accept terms</VFormCheckbox>
          <VFormCheckbox :tabindex="-1">Optional agreement</VFormCheckbox>
        </div>
      `,
    });

    const checkboxes = wrapper.findAll('.VCheckbox');

    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[0].attributes('tabindex')).toBe('0');
    expect(checkboxes[1].attributes('tabindex')).toBe('-1');
  });

  it('names the search clear button and keeps it out of submit behavior', () => {
    const wrapper = mount(VFormInputSearch, {
      props: {
        modelValue: 'query',
      },
    });

    const clearButton = wrapper.get('button[aria-label="Clear search"]');

    expect(clearButton.attributes('type')).toBe('button');
  });

  it('passes group labels to OTP inputs', async () => {
    const wrapper = mount({
      components: { VFormGroup, VFormInputOtp },
      template: `
        <VFormGroup label="Verification Code">
          <VFormInputOtp model-value="" />
        </VFormGroup>
      `,
    });

    try {
      await new Promise((resolve) => setTimeout(resolve, 75));
      const otp = wrapper.get('.VInputOtp');

      expect(otp.attributes('aria-labelledby')).toBe(wrapper.get('label').attributes('id'));
    } finally {
      wrapper.unmount();
    }
  });
});
