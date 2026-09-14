# Contributing

Thank you for wanting to contribute to **DSH Desktop for Linux**. This repository is a community fork of [anywhere-labs/dsh-desktop](https://github.com/anywhere-labs/dsh-desktop) focused on making DSH Desktop run reliably on Linux. Whether you are a regular user, a plugin author, or a developer, there is a way to contribute that fits you.

> Pull requests unrelated to essential desktop functionality, and plugin-listing PRs, may not be accepted. This fork mainly accepts **Linux adaptation and fixes**.

## Regular users: use, report, and spread the word

- Report problems or odd behavior in an [issue](https://github.com/Jic2007/dsh-desktop/issues): include your distribution, application version, install method (.deb / tar.gz), and reproduction steps.
- Feature ideas and improvement suggestions are welcome as issues too.
- Write tutorials or experience posts, or help improve and translate the documentation.

> This fork has no separate community space; please discuss in this repository's issues. For upstream Windows / macOS issues, use the [upstream repository](https://github.com/anywhere-labs/dsh-desktop/issues).

## Plugin authors: extend the ecosystem

DSH is built around plugins. If you write plugins, start with:

- [Plugin development](docs/plugin-development.en.md): how to write ordinary DSH plugins and Desktop plugins.
- [DSH plugin ecosystem manifesto](docs/plugin-ecosystem.en.md): our vision of an open, composable, sustainable ecosystem, and the three principles — composition first, declare clearly, compatibility first.
- [DSH Community Fabric Draft](dsh-community-fabric/README.md): join the public discussion of manifests, capabilities, Host Descriptors, and event contracts.
- [Community Market design](dsh-community-market/docs/market-shell.md): how the future market will discover plugins and why listing is not a security review.

Plugins that follow the manifesto coexist better with other plugins and will be easier to discover and trust in the marketplace when it ships.

## Developers: contribute code

### Development environment

```sh
git submodule update --init --recursive
corepack yarn install --immutable
corepack yarn check   # full headless gate: build, typecheck, tests, and smokes
corepack yarn dev     # launch the application when a graphical session is available
```

Build the unpacked Linux application:

```sh
DSH_AA_SOURCE_REF=pinned corepack yarn package:dir   # output: dsh-plugin-desktop/dist/linux-unpacked/
```

The `.deb` in this repository is built by hand with `ar` + `xz` (no `dpkg-deb`); see the root `README.md` and the Release for details.

### Repository boundaries (please read before starting)

- `deepseek-harness/` is the pinned upstream submodule. **Desktop development never edits files inside it**; upstream updates land through separate pin commits.
- Desktop code lives in `dsh-plugin-desktop/`; `dsh-community-fabric/` owns the community-standard Draft and `dsh-community-market/` owns the market-shell design. Both community packages are currently documentation-only and not loadable; all three owned packages share the outer Yarn workspace.
- Upstream third-party runtimes are patched through `patches/` and `.yarn/patches/`; when changing those patches, also update the root `package.json` `resolutions` and `yarn.lock`.
- Builds, typechecks, unit tests, and smoke checks must stay headless-safe.

### Commits and pull requests

- Use conventional commit messages (for example `fix(linux): ...`, `docs: ...`).
- Run `yarn check` and keep it green before committing; when touching packaging, also run `package:dir` once to confirm the smoke passes.
- After changing production dependencies, run `yarn workspace dsh-plugin-desktop verify:notices` to refresh the third-party notices and commit the updated `dsh-plugin-desktop/THIRD_PARTY_NOTICES.md`.
- Documentation changes should stay bilingual; after editing the README, update the `README.i18n.yaml` hash record (validated by `node scripts/verify-bilingual-docs.mjs`).
- Describe the change, its motivation, and how it was verified in the PR; merge after CI passes.

## Code of conduct

Be kind and respectful, and stick to the topic. We want a community that welcomes newcomers. The [Contributor Covenant](CODE_OF_CONDUCT.en.md) applies to all project spaces.
