# Mainasu - Discord Community Web App# React + TypeScript + Vite



A full-stack web application for your Discord community, built with React, Vite, TypeScript, and GSAP animations.This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.



## 🚀 Tech StackCurrently, two official plugins are available:



### Frontend- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh

- **React 18** - UI library- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

- **TypeScript** - Type safety

- **Vite** - Build tool & dev server## React Compiler

- **GSAP** - Animation library

- **React Router** - Client-side routingThe React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).



### Backend (Coming Soon)## Expanding the ESLint configuration

- **Supabase** - Backend as a Service

  - AuthenticationIf you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

  - PostgreSQL Database

  - Real-time subscriptions```js

  - Storageexport default defineConfig([

  globalIgnores(['dist']),

## 📦 Installation  {

    files: ['**/*.{ts,tsx}'],

1. Install dependencies:    extends: [

```bash      // Other configs...

npm install

```      // Remove tseslint.configs.recommended and replace with this

      tseslint.configs.recommendedTypeChecked,

2. Start the development server:      // Alternatively, use this for stricter rules

```bash      tseslint.configs.strictTypeChecked,

npm run dev      // Optionally, add this for stylistic rules

```      tseslint.configs.stylisticTypeChecked,



3. Open your browser and navigate to `http://localhost:5173`      // Other configs...

    ],

## 🎨 Project Structure    languageOptions: {

      parserOptions: {

```        project: ['./tsconfig.node.json', './tsconfig.app.json'],

src/        tsconfigRootDir: import.meta.dirname,

├── animations/        # GSAP animation utilities      },

│   └── gsapAnimations.ts      // other options...

├── components/        # Reusable components    },

│   └── Navbar.tsx  },

├── pages/            # Page components])

│   ├── Home.tsx```

│   └── Dashboard.tsx

├── styles/           # CSS modulesYou can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

│   ├── Navbar.css

│   ├── Home.css```js

│   └── Dashboard.css// eslint.config.js

├── App.tsx           # Main app componentimport reactX from 'eslint-plugin-react-x'

├── main.tsx          # Entry pointimport reactDom from 'eslint-plugin-react-dom'

└── index.css         # Global styles

```export default defineConfig([

  globalIgnores(['dist']),

## 🎯 Features  {

    files: ['**/*.{ts,tsx}'],

- ✅ Modern React with TypeScript    extends: [

- ✅ Smooth GSAP animations      // Other configs...

- ✅ Responsive design      // Enable lint rules for React

- ✅ Client-side routing      reactX.configs['recommended-typescript'],

- ⏳ Supabase authentication (coming soon)      // Enable lint rules for React DOM

- ⏳ Real-time chat (coming soon)      reactDom.configs.recommended,

- ⏳ User profiles (coming soon)    ],

- ⏳ Event management (coming soon)    languageOptions: {

      parserOptions: {

## 🔧 Available Scripts        project: ['./tsconfig.node.json', './tsconfig.app.json'],

        tsconfigRootDir: import.meta.dirname,

- `npm run dev` - Start development server      },

- `npm run build` - Build for production      // other options...

- `npm run preview` - Preview production build    },

- `npm run lint` - Run ESLint  },

])

## 📝 Next Steps: Supabase Integration```


Once you're ready to add the backend, we'll integrate Supabase for:
1. User authentication (login/signup)
2. Database for storing user data, posts, events
3. Real-time features for chat and notifications
4. File storage for avatars and media

## 🤝 Contributing

This is a community project! Feel free to contribute.

## 📄 License

MIT
