# GitHub Copilot Instructions

## 🎯 Project Context

This is a Vue 3 project with comprehensive testing using Vitest. The codebase follows clean code principles and maintains high test coverage.

## 📋 Code Quality Standards

### Clean Code Principles

- **Single Responsibility**: Each function/class should have one reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Derived classes must be substitutable for base classes
- **Interface Segregation**: Many client-specific interfaces better than one general-purpose
- **Dependency Inversion**: Depend on abstractions, not concretions
- **DRY**: Don't Repeat Yourself - extract common patterns
- **YAGNI**: You Aren't Gonna Need It - don't add premature features

### 🚨 DRY Principle Enforcement (CRITICAL)

**BEFORE writing ANY code, ask these questions:**

1. **Am I duplicating template structures?** → Use `v-bind` with computed properties
2. **Am I copying similar logic?** → Extract to composables or utility functions
3. **Are there repeated patterns?** → Create reusable components or abstractions
4. **Can conditional rendering be parameterized?** → Use dynamic attributes instead

#### **DRY Checklist Before Submitting Code**

- [ ] No duplicated template blocks
- [ ] No repeated logic in methods
- [ ] Common patterns extracted to reusable functions
- [ ] Conditional rendering uses parameterization, not duplication

### Code Organization

- Use Vue 3 Composition API with `<script setup>`
- Extract reusable logic into composables (`use*` functions)
- Keep components under 100 lines when possible
- Separate concerns: UI logic, business logic, data access
- Use TypeScript

### Internationalization (i18n)

- **NEVER use hardcoded strings** directly in Vue components
- **ALWAYS use i18n** for all user-facing text
- Use `$t()` function for translations in templates
- Use `useI18n()` composable for translations in script setup

```vue
<!-- ❌ Avoid: Hardcoded strings -->
<template>
  <q-btn>Submit Form</q-btn>
  <p>Please enter your name</p>
</template>

<!-- ✅ Correct: Use i18n -->
<template>
  <q-btn>{{ $t('common.submit') }}</q-btn>
  <p>{{ $t('forms.enterName') }}</p>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const message = t('validation.required');
</script>
```

### ESLint Compliance

#### Magic Numbers Rule

- **ALWAYS use named constants** instead of magic numbers to avoid `no-magic-numbers` ESLint errors
- **Exceptions**: Only `-1`, `0`, `1`, and `2` are allowed as literal numbers
- **Constants naming**: Use SCREAMING_SNAKE_CASE for module-level constants

```javascript
// ❌ Avoid: Magic numbers
setTimeout(callback, 5000);
const users = data.slice(0, 10);
const percentage = (value / 100) * rate;

// ✅ Correct: Named constants
const TIMEOUT_DURATION = 5000; // 5 seconds
const MAX_USERS_DISPLAY = 10;
const PERCENTAGE_DIVISOR = 100;

setTimeout(callback, TIMEOUT_DURATION);
const users = data.slice(0, MAX_USERS_DISPLAY);
const percentage = (value / PERCENTAGE_DIVISOR) * rate;
```

#### Other ESLint Rules

- Use `const` for values that don't change, `let` for mutable variables
- Prefer template literals over string concatenation
- Use destructuring for object and array access
- Follow import ordering: external libraries first, then internal modules

### Naming Conventions

- Components: PascalCase (`GameBoard.vue`)
- Composables: camelCase with `use` prefix (`useGameState.js`)
- Functions/Variables: camelCase (`calculateScore`)
- Constants: SCREAMING_SNAKE_CASE (`MAX_PLAYERS`)
- CSS Classes: kebab-case (`game-board`)
- Files: kebab-case for multi-word (`game-state.js`)

## 🧪 Testing Requirements

### Testing Philosophy: Boston School (Behavior-Driven)

**CRITICAL**: All tests MUST follow the **Boston School** (classicist) approach focusing on **user behavior**, not implementation details. This ensures tests survive refactoring and provide better documentation.

#### ✅ **Boston School Principles**

**Test WHAT the user experiences, not HOW the code works:**

```typescript
// ✅ CORRECT: Test user-visible behavior
it('shows recent activity status to users', () => {
  const recentTime = new Date(Date.now() - 30 * 1000).toISOString();

  const wrapper = mount(
    LastActiveCell,
    withQuasarBrowser({
      props: { lastActive: recentTime },
    }),
  );

  // User behavior: What does the user see?
  expect(wrapper.text()).toBe('Just now');

  // Visual behavior: Is it visually distinct? (flexible matching)
  expect(wrapper.html()).toMatch(/text-green|color.*green|recent/i);
});

// ✅ CORRECT: Test user interactions and outcomes
it('allows users to view user details', async () => {
  const wrapper = mount(
    UserActions,
    withQuasarBrowser({
      props: { user: sampleUser },
    }),
  );

  // Find by semantic meaning, not implementation
  const viewAction = wrapper.find('[data-testid="view-user"], .q-btn:first-child');
  await viewAction.trigger('click');

  // Test outcome user cares about
  expect(wrapper.emitted('view')).toBeTruthy();
  expect(wrapper.emitted('view')?.[0]).toEqual([sampleUser]);
});
```

#### ❌ **London School Anti-Patterns (AVOID)**

```typescript
// ❌ WRONG: Over-mocking implementation details
vi.mock('src/composables/useUserFormatters', () => ({
  useUserFormatters: () => ({
    getLastActiveClass: mockGetLastActiveClass,
  }),
}));

// ❌ WRONG: Testing mock interactions instead of behavior
expect(mockGetLastActiveClass).toHaveBeenCalledWith(lastActiveValue);

// ❌ WRONG: Testing CSS classes (implementation details)
expect(wrapper.find('span').classes()).toContain('text-green');

// ❌ WRONG: Testing DOM structure instead of behavior
expect(wrapper.find('span').exists()).toBe(true);
expect(buttons.length).toBe(3);
```

#### **Boston School Test Structure**

```typescript
describe('ComponentName - User Behavior', () => {
  describe('When [user scenario]', () => {
    it('should [expected user outcome]', () => {
      // Arrange: Set up realistic user scenario
      const userInput = 'realistic-data';

      // Act: User performs action
      const wrapper = mount(
        Component,
        withQuasarBrowser({
          props: { userInput },
        }),
      );

      // Assert: User sees expected outcome
      expect(wrapper.text()).toBe('expected-user-visible-text');

      // Assert: Behavior patterns (flexible implementation)
      expect(wrapper.html()).toMatch(/visual-indicator-pattern/i);
    });
  });

  describe('Accessibility and UX', () => {
    it('provides accessible experience for screen readers', () => {
      // Test accessibility requirements
    });
  });
});
```

#### **Behavior-Focused Test Checklist**

For EVERY test, verify:

- [ ] **Test name describes user behavior** (not code behavior)
- [ ] **Assertions test user-visible outcomes** (not implementation)
- [ ] **Would test survive refactoring?** (changing CSS, DOM structure, internal methods)
- [ ] **Uses minimal mocking** (only for external dependencies/APIs)
- [ ] **Tests realistic user scenarios** (not artificial edge cases)
- [ ] **Flexible implementation matching** (regex patterns vs exact matches)

### Coverage Goals

- **Minimum 80% code coverage** for all new code
- **90% coverage** for critical project logic
- Test all public methods and edge cases
- Include both positive and negative test scenarios

### Test Structure (Behavior-Driven AAA Pattern)

```typescript
it('should [describe user behavior/outcome]', () => {
  // Arrange - Set up realistic user scenario
  const userInput = 'realistic-user-data';

  // Act - User performs action or views component
  const wrapper = mount(
    Component,
    withQuasarBrowser({
      props: { userInput },
    }),
  );

  // Assert - User sees expected behavior/outcome
  expect(wrapper.text()).toBe('user-visible-result');
  // Flexible implementation matching for visual behavior
  expect(wrapper.html()).toMatch(/behavior-pattern/i);
});
```

### Test Categories (Boston School Focus)

- **User Behavior Tests**: What users see and experience
- **Interaction Tests**: User actions and their outcomes
- **Accessibility Tests**: Screen reader content, keyboard navigation
- **Integration Tests**: Component collaboration (minimal mocking)
- **Edge Case Behavior**: How system behaves under unusual conditions
- **Error Scenarios**: User-visible error states and recovery

## 🏗️ Architecture Patterns

### Vue 3 Component Structure

```vue
<template>
  <!-- Keep template simple and declarative -->
</template>

<script setup>
// 1. Imports
import { ref, computed, onMounted } from 'vue';

// 2. Props with validation
const props = defineProps({
  // Always include type and validation
});

// 3. Emits
const emit = defineEmits(['event-name']);

// 4. Composables
const { state, methods } = useComposable();

// 5. Local reactive state
const localState = ref();

// 6. Computed properties
const computed = computed(() => {});

// 7. Methods (pure functions when possible)
const method = () => {};

// 8. Lifecycle hooks
onMounted(() => {});
</script>

<style scoped>
/* Component-specific styles */
</style>
```

### Composable Pattern

```javascript
export function useFeature(dependencies) {
  // Private state
  const state = ref();

  // Private methods
  const privateMethod = () => {};

  // Public API (return only what consumers need)
  return {
    // Computed state
    computedValue: computed(() => state.value),
    // Methods
    publicMethod,
  };
}
```

## 🔧 Function Design

### Pure Functions (Preferred)

```javascript
// Good: Pure function
function calculateDamage(attack, defense) {
  return Math.max(0, attack - defense);
}

// Avoid: Side effects
function calculateDamage(player) {
  player.health -= damage; // Mutates input
}
```

### Error Handling

```javascript
function validateInput(data) {
  if (!data) {
    throw new Error('Data is required');
  }

  if (typeof data !== 'object') {
    throw new TypeError('Data must be an object');
  }

  // Continue with validation
}
```

### Async/Await Pattern

```javascript
async function fetchData() {
  try {
    const response = await api.getData();
    return response.data;
  } catch (error) {
    console.error('Failed to fetch data:', error);
    throw new Error('Data fetch failed');
  }
}
```

## 📝 Commit Message Format (Conventional Commits 1.0.0)

### Structure

```
type(scope): description

[optional body]

[optional footer]
```

### Formatting Rules (CRITICAL - Enforced by commitlint)

- **Subject MUST be sentence-case**: First word capitalized, rest lowercase unless proper nouns
- **Description MUST start with capital letter**: "Add feature" not "add feature"
- **Body lines MUST be sentence-case**: Each line starts with capital letter
- **Use imperative mood**: "Add" not "Added" or "Adds"

### Examples

✅ **Correct:**

```
feat(auth): Add user authentication system

- Add login and logout functionality
- Implement JWT token validation
- Create user session management
```

❌ **Incorrect (will fail commitlint):**

```
feat(auth): add user authentication system

- add login and logout functionality
- implement JWT token validation
- create user session management
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code change that neither fixes bug nor adds feature
- `test`: Adding missing tests
- `chore`: Changes to build process or auxiliary tools
- `ci`: Changes to CI configuration files and scripts

## 🔍 Code Review Checklist

Before suggesting code, ensure:

- [ ] Follows Single Responsibility Principle
- [ ] Has proper error handling
- [ ] Includes JSDoc comments for public APIs
- [ ] No code duplication (DRY principle)
- [ ] Variables and functions have descriptive names
- [ ] Edge cases are considered
- [ ] Tests are included for new functionality
- [ ] No magic numbers or hardcoded strings
- [ ] Uses i18n for all user-facing text
- [ ] Proper separation of concerns

## 🚫 Anti-Patterns to Avoid

### Don't

```javascript
// Avoid: Long parameter lists
function createPlayer(name, age, level, health, mana, items, skills) {}

// Avoid: Deeply nested conditions
if (user) {
  if (user.permissions) {
    if (user.permissions.canEdit) {
      // Logic here
    }
  }
}

// Avoid: Magic numbers (ESLint no-magic-numbers rule)
setTimeout(callback, 300000); // What is 300000?
const items = data.slice(0, 20); // Why 20?
const threshold = value > 0.85; // What does 0.85 represent?

// Avoid: Hardcoded strings (use i18n)
<q-btn>Submit Form</q-btn>;
const errorMessage = 'Please enter a valid email';

// Avoid: Mutating props
props.user.name = 'New Name';

// Avoid: Template duplication (violates DRY)
<template>
  <div v-if="isActive" class="card active">
    <h3>{{ title }}</h3>
    <p>{{ content }}</p>
  </div>
  <div v-else class="card inactive">
    <h3>{{ title }}</h3>
    <p>{{ content }}</p>
  </div>
</template>;
```

### Do

```javascript
// Good: Object parameter
function createPlayer({ name, age, level, health, mana, items, skills }) {}

// Good: Early returns
function canUserEdit(user) {
  if (!user) return false;
  if (!user.permissions) return false;
  return user.permissions.canEdit;
}

// Good: Named constants for magic numbers
const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const MAX_ITEMS_PER_PAGE = 20;
const SUCCESS_THRESHOLD = 0.85; // 85% success rate

setTimeout(callback, CACHE_TIMEOUT);
const items = data.slice(0, MAX_ITEMS_PER_PAGE);
const isSuccessful = value > SUCCESS_THRESHOLD;

// Good: Use i18n for all user-facing text
<q-btn>{{ $t('common.submit') }}</q-btn>
const { t } = useI18n();
const errorMessage = t('validation.emailInvalid');

// Good: Immutable updates
const updatedUser = { ...user, name: 'New Name' };

// Good: DRY template with computed attributes
<template>
  <div :class="['card', { active: isActive, inactive: !isActive }]">
    <h3>{{ title }}</h3>
    <p>{{ content }}</p>
  </div>
</template>
```

## 🎮 Projet-Specific Patterns

### Component Communication

- Use props down, events up pattern
- Emit semantic events (`card-selected`, not `click`)
- Validate all props with proper types
- Use provide/inject for deep prop drilling

## 📚 Documentation Standards

### JSDoc Examples

```javascript
/**
 * Calculates the probability of successfully defusing the bomb
 * @param {Object} gameState - Current game state
 * @param {number} gameState.timeRemaining - Seconds left on timer
 * @param {Array<Player>} gameState.players - Active players
 * @param {number} difficultyLevel - Game difficulty (1-5)
 * @returns {number} Probability between 0 and 1
 * @throws {Error} When gameState is invalid
 * @example
 * const probability = calculateDefuseChance(gameState, 3)
 * console.log(`Success chance: ${probability * 100}%`)
 */
function calculateDefuseChance(gameState, difficultyLevel) {
  // Implementation
}
```

### README Sections

When updating documentation:

- Clear installation instructions
- Usage examples with code
- API documentation for public functions
- Contributing guidelines
- Testing instructions

---

## 💡 General Guidelines for AI Assistance

### When I Ask for Code:

1. **Check for DRY violations FIRST** - never duplicate templates, logic, or patterns
2. **Ask for clarification** if requirements are unclear
3. **Suggest architecture** before implementing
4. **Include Boston School tests** with the implementation
5. **Explain design decisions** and trade-offs
6. **Follow the established patterns** in the codebase
7. **Consider edge cases** and error scenarios
8. **Optimize for readability** over clever solutions

**MANDATORY DRY CHECK**: Before submitting any Vue component code, verify:

- ✅ No duplicated template blocks (use `v-bind` with computed properties)
- ✅ No repeated logic in methods (extract to composables)
- ✅ Conditional rendering is parameterized, not duplicated
- ✅ Common patterns are abstracted into reusable functions

**MANDATORY BOSTON SCHOOL CHECK**: Before submitting any test code, verify:

- ✅ Tests describe user behavior, not code behavior
- ✅ Assertions test user-visible outcomes, not implementation
- ✅ Tests would survive refactoring (CSS changes, DOM restructuring)
- ✅ Minimal mocking (only external dependencies/APIs)
- ✅ Test names describe user scenarios and expected outcomes
- ✅ Uses flexible implementation matching (regex patterns vs exact matches)

### When I Ask for Tests:

1. **Follow Boston School principles** - test behavior, not implementation
2. **Focus on user experience** - what does the user see/do?
3. **Use realistic scenarios** - test actual use cases
4. **Minimize mocking** - only mock external boundaries
5. **Test accessibility** - screen reader content, keyboard navigation
6. **Write resilient assertions** - flexible matching for implementation details
7. **Group by user scenarios** - organize tests around user journeys

### When I Ask for Refactoring:

1. **Preserve existing functionality**
2. **Improve code structure** without breaking changes
3. **Update tests to be more behavior-focused** if they're brittle
4. **Document any breaking changes**
5. **Follow SOLID principles**
6. **Extract reusable patterns**

### When I Ask for Bug Fixes:

1. **Identify root cause** before fixing symptoms
2. **Add behavior-focused tests** to prevent regression
3. **Consider related edge cases**
4. **Update documentation** if needed
5. **Use minimal changes** to fix the issue

Remember: **Quality over quantity**. It's better to write less code that is well-tested, documented, and maintainable than to write more code quickly.