# Quill PoC (Angular)

Quick proof-of-concept Angular project with ngx-quill that:

- Shows an editor with a custom toolbar **below** containing only an Add Link button and character count.
- Clicking Add Link opens a dialog to add text + URL.
- Clicking an existing link opens a dialog with Modify / Remove options.
- Modify replaces link text & href. Remove removes link but keeps text.
- Max 250 characters enforced (prevents typing/pasting beyond 250).

## How to use

1. Extract the zip.
2. Run `npm install`.
3. Run `npx ng serve --open` (or `npm start` if you have Angular CLI).

Notes: This is a minimal PoC. If `ng` is not available globally, use `npx ng` as above.
