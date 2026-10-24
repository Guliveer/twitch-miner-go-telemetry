<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Design

UI work (TypeScript, TSX, and CSS under `src/`, plus any new UI) must follow the design system in `DESIGN.md`: colors, typography, spacing, radii, components, and its do's and don'ts. Read `DESIGN.md` before touching any UI code. If a needed token does not exist, add it to `DESIGN.md` first instead of introducing raw hex values or ad-hoc styles.
