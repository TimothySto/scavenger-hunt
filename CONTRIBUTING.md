# Contributing

Thank you for your interest in contributing to Scavenger Hunt. Contributions of all kinds are welcome — bug reports, documentation improvements, and pull requests.

---

## Reporting bugs

Please open a GitHub issue and include:

- A clear description of the problem and what you expected to happen
- Steps to reproduce
- Your Node.js version (`node -v`), OS, and browser (if relevant)
- Any relevant error output from the terminal or browser console

---

## Suggesting features

Open a GitHub issue with the label `enhancement`. Describe the use case you are trying to solve rather than jumping straight to the proposed solution — this helps discussion focus on whether the problem is worth solving and the best way to approach it.

---

## Pull requests

### Setup

Follow the [Quick Start](README.md#quick-start) in the README to get a local development environment running.

```bash
git clone https://github.com/your-username/scavenger-hunt.git
cd scavenger-hunt
pnpm install
cp .env.example .env   # fill in DATABASE_URL, ADMIN_SECRET, and SMTP values
pnpm exec prisma migrate deploy
pnpm exec prisma generate
pnpm dev
```

### Before submitting

- Run `pnpm lint` and fix any reported issues
- Test your changes manually against the affected flows (participant journey, admin panel, or both)
- Keep PRs focused — one logical change per PR makes review faster
- Update or add documentation in `docs/` if your change affects user-facing behaviour or the import format

### Schema changes

If your PR changes `prisma/schema.prisma`, include a migration:

```bash
pnpm exec prisma migrate dev --name describe-your-change
```

Commit the generated migration file alongside your code changes.

### Commit style

Plain, descriptive commit messages in the imperative mood work well:

```
Add conversion bonus points to exhibit checkpoints
Fix sponsor logo not rendering on mobile Safari
Update CHECKPOINT_FORMAT.md with acceptedAnswers field
```

---

## Code style

- TypeScript throughout — avoid `any` where possible
- Server components and Server Actions for data fetching and mutations; client components only where interactivity requires it
- Tailwind CSS for all styling — avoid inline styles
- Follow the existing file and folder naming conventions in `src/app/`

---

## License

By contributing, you agree that your contributions will be licensed under the [GNU Affero General Public License v3.0](LICENSE).
