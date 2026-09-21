# v6 Deprecation Shims

Skills in this folder are forwarders kept for backward compatibility with v6 skill IDs.
Each one holds no logic of its own — it forwards to the skill that replaced it, pinning
the legacy output contract so existing callers keep working.

| Shim                              | Forwards to                              |
| --------------------------------- | ---------------------------------------- |
| `acl-editorial-review`           | `acl-review` (structure + prose lenses) |
| `acl-editorial-review-prose`     | `acl-review` (prose lens)               |
| `acl-editorial-review-structure` | `acl-review` (structure lens)           |
| `acl-review-adversarial-general` | `acl-review` (adversarial lens)         |
| `acl-review-edge-case-hunter`    | `acl-review` (edge-case lens)           |
| `acl-review-verification-gap`    | `acl-review` (verification-gap lens)    |

`acl-editorial-review` keeps its `customize.toml` so existing team and user
overrides still resolve; the shim forwards those resolved values to `acl-review`.

External module repos (gds, loop, tea, bmb, os-utils) still invoke these IDs, so they
ship by default. Removal rides the v7 cut — never a 6.x minor.

The folder is grouping only: the installer discovers skills recursively and installs each
one under its own `name`, so nesting here does not change any installed path or skill ID.
A future install option will let users include or exclude this folder before it is removed
outright.
