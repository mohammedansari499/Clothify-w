/** @type {import('tailwindcss').Config} */
export default {
    darkMode: "class",
    content: [
        "./index.html",
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--app-background)",
                darker: "var(--app-darker)",
                dark: "var(--app-dark)",

                card: "var(--app-card)",
                "card-hover": "var(--app-card-hover)",

                surface: "var(--app-card)", // ✅ IMPORTANT FIX

                primary: "var(--app-primary)",
                "primary-dark": "var(--app-primary-dark)",
                "primary-hover": "var(--app-primary-hover)",

                secondary: "var(--app-secondary)",
                "secondary-dark": "var(--app-secondary-dark)",

                text: "var(--app-text)",
                "text-muted": "var(--app-text-muted)",

                "border-subtle": "var(--app-border-subtle)",

                error: "var(--app-error)",
            }
        }
    },
    plugins: [],
};