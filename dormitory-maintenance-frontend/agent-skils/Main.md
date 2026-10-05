# Project Context – NgRx Angular App

## Project Overview
- **Framework:** Angular (v22+) & TypeScript
- **State Management:** NgRx (Store, Effects, ComponentStore, Entity)
- **Styling / UI:** TailwindCSS

## Architectural & Coding Standards
- **Strict Typing:** Enforce strict TypeScript types. Never use `any`.
- **Component Pattern:** Separate Smart (Container) components (interact with Store) from Dumb (Presentational) components (use `@Input` and `@Output`).
- **RxJS Operators:** Use `switchMap` for read/search operations, `exhaustMap` for non-repeatable writes (like logins), and `concatMap` for sequential writes. Always manage subscriptions using `takeUntilDestroyed()` or the `async` pipe.
- **Components:** Put components into their name directory. Always separate HTML, CSS, and TS files.

## NgRx State Management Best Practices
- **Actions:** Use the `createActionGroup` factory. Name events in the format `[Source] Event Name` (e.g., `[Product Page] Load Items`).
- **Reducers:** Keep reducers pure, synchronous, and lean. Use `@ngrx/entity` for managing collections.
- **Selectors:** Always write strongly typed, memoized selectors using `createSelector`. Prefer granular selectors to avoid unnecessary component rerenders.
- **Effects:** Use `createEffect`. Ensure all effects handle errors gracefully using `catchError` so the effect stream doesn't crash and always returns a valid action unless `{ dispatch: false }` is explicitly set.

## Code Style
- Use modern Angular syntax (e.g., self-closing tags, control flow `@if`/`@for`).
- Group NgRx files into features (e.g., `+state/products.actions.ts`, `products.effects.ts`, `products.reducer.ts`, `products.selectors.ts`).

## Response Preferences
- Provide a complete NgRx boilerplate (Actions, Reducer, Selector, Effect) when a new state feature is requested.
- Prioritize clean RxJS streams over imperative logic.

## Git & Source Control Conventions
- **Conventional Commits:** Enforce the [Conventional Commits Specification](https://www.conventionalcommits.org/ "Conventional Commits Specification"). Every message must follow: `<type>(<scope>): <description>`.
  - *Types:* `feat`, `fix`, `refactor`, `style`, `docs`, `perf`, `test`, `build`, `ci`, `chore`.
- **Granular Commits:** Do not bundle multiple unrelated files or changes into a single generic commit.Break the response down into distinct, granular commits with concise, clear, and descriptive messages.
- **Log Context & Pattern Matching:** Before drafting any message, analyze the repository's recent commit history (the current log). Mimic the existing team conventions:
  - Match how `<scope>` is defined (e.g., matching actual folder names like `+state`, domain features like `products`, or architectural layers like `shared/ui`).
  - Match casing preferences (e.g., lower-case descriptions, imperative mood such as "add feature" instead of "added feature").
- **Safety Formatting:** Output plain text options. Never wrap commit messages in extra Markdown code blocks or backticks unless requested, ensuring the text can be piped directly into `git commit -m`.
