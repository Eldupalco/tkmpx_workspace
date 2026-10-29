import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

/**
 * 🎨 60-30-10 Web Design Palette:
 * - 60% Dominant (Neutral Canvas): slate.50 (#F8FAFC) - Backgrounds, canvas, whitespace
 * - 30% Secondary (Structural Surfaces): white (#FFFFFF) & slate.100/200 - Cards, navbars, tables, borders, secondary buttons
 * - 10% Accent (High-Priority CTA & Focus): brand.600 (#4F46E5) - Primary action buttons, active states, focus rings
 */
export const theme = extendTheme({
  config,
  fonts: {
    heading: 'var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    body: 'var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  colors: {
    // 10% ACCENT: Reserved for primary CTAs, active highlights, key interactions
    brand: {
      50: '#EEF2FF',
      100: '#E0E7FF',
      200: '#C7D2FE',
      300: '#A5B4FC',
      400: '#818CF8',
      500: '#6366F1',
      600: '#4F46E5', // Primary accent hero color
      700: '#4338CA',
      800: '#3730A3',
      900: '#312E81',
    },
    // 60% DOMINANT (50) & 30% SECONDARY (100-300 borders/surfaces, 700-900 typography)
    slate: {
      50: '#F8FAFC',  // 60% Dominant canvas background
      100: '#F1F5F9', // 30% Secondary subtle fills & dividers
      200: '#E2E8F0', // 30% Secondary card & component borders
      300: '#CBD5E1', // 30% Secondary muted borders
      400: '#94A3B8', // Secondary helper text
      500: '#64748B', // Secondary body labels
      600: '#475569', // Secondary subtitle text
      700: '#334155', // Secondary headings
      800: '#1E293B', // High contrast body
      900: '#0F172A', // High contrast titles
    },
  },
  styles: {
    global: {
      body: {
        bg: 'slate.50', // 60% Dominant background
        color: 'slate.800',
        fontFeatureSettings: '"cv02", "cv03", "cv04", "cv11"',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: '600',
        borderRadius: 'lg',
      },
      variants: {
        // 10% Accent CTA Button
        solid: (props: any) => {
          if (props.colorScheme === 'brand') {
            return {
              bg: 'brand.600',
              color: 'white',
              _hover: { bg: 'brand.700', _disabled: { bg: 'brand.600' } },
              _active: { bg: 'brand.800' },
            };
          }
        },
        // 30% Secondary Outline Button
        outline: {
          bg: 'white',
          borderColor: 'slate.200',
          color: 'slate.700',
          _hover: {
            bg: 'slate.50',
            borderColor: 'slate.300',
            color: 'slate.900',
          },
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'white', // 30% Secondary structure
          borderRadius: 'xl',
          borderWidth: '1px',
          borderColor: 'slate.200',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
        },
      },
    },
    Table: {
      variants: {
        simple: {
          th: {
            borderColor: 'slate.200',
            color: 'slate.500',
            letterSpacing: 'wider',
          },
          td: {
            borderColor: 'slate.100',
          },
        },
      },
    },
  },
});


