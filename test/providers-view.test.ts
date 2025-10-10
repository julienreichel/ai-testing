import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import ProvidersView from '../src/features/providers/ProvidersView.vue'
import { useProvidersStore } from '../src/store/providers'
import type { ProviderKeyStatus } from '../src/store/providers'

// Mock the providers store
vi.mock('../src/store/providers', () => ({
  useProvidersStore: vi.fn(),
}))

const mockProvidersStore = {
  providerStatuses: [],
  supportedProviderTypes: ['openai', 'claude', 'mock'],
  isLoading: false,
  error: null,
  testingProvider: null,
  addKey: vi.fn(),
  removeKey: vi.fn(),
  testKey: vi.fn(),
  initialize: vi.fn(),
  clearError: vi.fn(),
  hasShownEncryptionNotice: vi.fn(() => false),
  markEncryptionNoticeShown: vi.fn(),
}

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      providers: {
        title: 'AI Providers',
        addProvider: 'Add Provider',
        securityNotice: {
          title: 'Security Notice',
          message: 'Your API keys are stored securely in your browser\'s local storage:',
          point1: 'Keys never leave your browser or device',
          point2: 'No data is transmitted to our servers',
          point3: 'Clear browser data will remove all stored keys',
          acknowledge: 'I Understand',
        },
        noProviders: 'No providers configured. Add one to get started.',
        apiKey: 'API Key',
        configured: 'Configured',
        notConfigured: 'Not Configured',
        validation: 'Validation',
        lastTested: 'Last Tested',
        testing: 'Testing...',
        test: 'Test',
        edit: 'Edit',
        remove: 'Remove',
        providerType: 'Provider Type',
        selectType: 'Select a provider type',
        name: 'Name',
        namePlaceholder: 'e.g., OpenAI GPT-4',
        baseUrl: 'Base URL',
        optional: 'optional',
        baseUrlPlaceholder: 'https://api.openai.com/v1',
        add: 'Add',
        adding: 'Adding...',
      },
      common: {
        cancel: 'Cancel',
      },
    },
  },
})

function createWrapper(storeOverrides = {}): ReturnType<typeof mount> {
  const pinia = createPinia()
  const mockStore = { ...mockProvidersStore, ...storeOverrides }
  vi.mocked(useProvidersStore).mockReturnValue(mockStore as unknown as ReturnType<typeof useProvidersStore>)

  return mount(ProvidersView, {
    global: {
      plugins: [pinia, i18n],
    },
  })
}

describe('ProvidersView - User Behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('When user first visits the page', () => {
    it('should show security notice if not acknowledged', () => {
      const wrapper = createWrapper({ hasShownEncryptionNotice: () => false })

      expect(wrapper.text()).toContain('Security Notice')
      expect(wrapper.text()).toContain('Keys never leave your browser')
      expect(wrapper.find('.security-notice').exists()).toBe(true)
    })

    it('should hide security notice if already acknowledged', () => {
      const wrapper = createWrapper({ hasShownEncryptionNotice: () => true })

      expect(wrapper.find('.security-notice').exists()).toBe(false)
    })

    it('should display empty state when no providers are configured', () => {
      const wrapper = createWrapper({ providerStatuses: [] })

      expect(wrapper.text()).toContain('No providers configured')
      expect(wrapper.find('.empty-state').exists()).toBe(true)
    })
  })

  describe('When user has configured providers', () => {
    const mockProviders: ProviderKeyStatus[] = [
      {
        id: 'openai-test',
        type: 'openai',
        name: 'OpenAI Test',
        hasKey: true,
        isValid: true,
        lastTested: new Date('2024-01-01T12:00:00Z'),
        isActive: true,
      },
      {
        id: 'claude-test',
        type: 'claude',
        name: 'Claude Test',
        hasKey: false,
        isValid: null,
        lastTested: null,
        isActive: false,
      },
    ]

    it('should display provider cards with correct information', () => {
      const wrapper = createWrapper({ providerStatuses: mockProviders })

      expect(wrapper.text()).toContain('OpenAI Test')
      expect(wrapper.text()).toContain('Claude Test')
      expect(wrapper.text()).toContain('OPENAI')
      expect(wrapper.text()).toContain('CLAUDE')
    })

    it('should show different status indicators for configured vs unconfigured providers', () => {
      const wrapper = createWrapper({ providerStatuses: mockProviders })

      // Should show "Configured" for provider with key
      expect(wrapper.text()).toContain('Configured')

      // Should show "Not Configured" for provider without key
      expect(wrapper.text()).toContain('Not Configured')
    })

    it('should display validation status for tested providers', () => {
      const wrapper = createWrapper({ providerStatuses: mockProviders })

      // Should show validation status for the tested provider
      expect(wrapper.text()).toMatch(/Valid|Invalid|Not tested/)
    })
  })

  describe('When user wants to add a new provider', () => {
    it('should open add dialog when add button is clicked', async () => {
      const wrapper = createWrapper()

      const addButton = wrapper.find('[data-testid="add-provider"], .btn-primary')
      await addButton.trigger('click')

      expect(wrapper.find('.dialog').exists()).toBe(true)
      expect(wrapper.text()).toContain('Provider Type')
    })

    it('should show base URL field for OpenAI provider type', async () => {
      const wrapper = createWrapper()

      // Open dialog
      const addButton = wrapper.find('.btn-primary')
      await addButton.trigger('click')

      // Select OpenAI
      const typeSelect = wrapper.find('select')
      await typeSelect.setValue('openai')

      expect(wrapper.text()).toContain('Base URL')
    })

    it('should not show base URL field for other provider types', async () => {
      const wrapper = createWrapper()

      // Open dialog
      const addButton = wrapper.find('.btn-primary')
      await addButton.trigger('click')

      // Select Claude
      const typeSelect = wrapper.find('select')
      await typeSelect.setValue('claude')

      // Base URL should not be shown for Claude
      const baseUrlFields = wrapper.findAll('input[type="url"]')
      expect(baseUrlFields.length).toBe(0)
    })
  })

  describe('When user tests a provider', () => {
    const mockProviders: ProviderKeyStatus[] = [
      {
        id: 'openai-test',
        type: 'openai',
        name: 'OpenAI Test',
        hasKey: true,
        isValid: null,
        lastTested: null,
        isActive: true,
      },
    ]

    it('should show testing state during provider test', () => {
      const wrapper = createWrapper({
        providerStatuses: mockProviders,
        testingProvider: 'openai-test',
      })

      expect(wrapper.text()).toContain('Testing...')
    })

    it('should allow testing providers with API keys', () => {
      const wrapper = createWrapper({ providerStatuses: mockProviders })

      const testButton = wrapper.find('.btn-outline')
      expect(testButton.text()).toBe('Test')
      expect(testButton.attributes('disabled')).toBeUndefined()
    })
  })

  describe('Accessibility and UX', () => {
    it('should provide meaningful labels for form fields', async () => {
      const wrapper = createWrapper()

      // Open dialog
      const addButton = wrapper.find('.btn-primary')
      await addButton.trigger('click')

      const labels = wrapper.findAll('label')
      const labelTexts = labels.map(label => label.text())

      expect(labelTexts).toContain('Provider Type')
      expect(labelTexts).toContain('Name')
    })

    it('should show helpful placeholder text for inputs', async () => {
      const wrapper = createWrapper()

      // Open dialog and select OpenAI
      const addButton = wrapper.find('.btn-primary')
      await addButton.trigger('click')

      const typeSelect = wrapper.find('select')
      await typeSelect.setValue('openai')

      // Check for helpful placeholders
      expect(wrapper.html()).toMatch(/sk-\.\.\./) // API key placeholder
      expect(wrapper.html()).toMatch(/OpenAI GPT-4/) // Name placeholder
    })
  })
})
