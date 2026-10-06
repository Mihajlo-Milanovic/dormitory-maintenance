# Development & Contribution Guide

## 1. Getting Started
Ensure you have Node.js and npm installed (Node 18+ recommended).

### Install Dependencies
```bash
npm install
```

### Start Development Server
```bash
npm start
```
Runs the development server at `http://localhost:4200`.

---

## 2. Building & Production
### Build Project
```bash
npm run build
```
Compiles the application and stores build artifacts in the `dist/` directory.

---

## 3. Testing
Unit and component tests are executed using **Vitest** via Angular CLI.

### Run Tests
```bash
npm test
```

---

## 4. Coding Standards & Conventions
- **Strict Typing:** Always enforce strict TypeScript types. Avoid `any`.
- **Component Architecture:** Separate smart (container) components (interact with NgRx store) from dumb (presentational) components (use `@Input` and `@Output`).
- **RxJS Streams:** Prefer clean RxJS operator chains (`switchMap`, `exhaustMap`, `concatMap`, `catchError`) over imperative logic.
- **NgRx Best Practices:**
  - Use `createActionGroup` for actions.
  - Keep reducers pure and synchronous.
  - Use memoized selectors with `createSelector`.
  - Handle errors gracefully in effects.
- **Styling:** Use TailwindCSS utility classes following Material Design principles.
