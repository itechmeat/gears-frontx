export default {
  plugins: {
    // Runs before Tailwind on purpose. `@constructor/react-kit` ships one CSS
    // Module per component and writes them in native nested CSS; Tailwind v3
    // does not understand nesting and warns on every one of them. The plugin
    // flattens the nesting first, so the warning is gone and the output is
    // equivalent - verified by diffing the emitted stylesheet's rule set
    // against the un-flattened build.
    'tailwindcss/nesting': {},
    tailwindcss: {},
    autoprefixer: {},
  },
};
