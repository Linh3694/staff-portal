module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
      extend: {
        animation: {
          fadeIn: "fadeIn 0.3s ease-in-out",
          fadeOut: "fadeOut 0.3s ease-in-out",
        },
        keyframes: {
          fadeIn: {
            from: { opacity: 0 },
            to: { opacity: 1 },
          },
          fadeOut: {
            from: { opacity: 1 },
            to: { opacity: 0 },
          },
        },
        colors: {
          'navy-700': '#1B2559',
          'blue-500': '#3B82F6',
          'blue-600': '#2563EB',
          'gray-200': '#E2E8F0',
          'gray-400': '#A0AEC0',
          'green-500': '#22C55E',    // Adjust if needed
          'red-500': '#EF4444',      // Adjust if needed
          'red-600': '#DC2626',
          'amber-500': '#F59E0B',    // Adjust if needed
          'white': '#FFFFFF',
          'oxford-blue': '#002147',
          'oxford-blue-dark': '#001a33', // Define a darker shade for hover
          'orange-red': '#FF4500',
          'orange-red-dark': '#cc3700', // Define a darker shade for hover
          lightPrimary: "#F4F7FE",
          },
      }
    },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};

