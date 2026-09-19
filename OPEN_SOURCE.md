# Open-Source Export Notes

This repository was prepared from a private deployment as a clean source-only
export.

## Removed Data

- Production posts, pages, categories, tags, images, videos, and media metadata
- User accounts, password hashes, sessions, and audit records
- PostgreSQL dumps, SQLite files, Docker volumes, and backup archives
- Agent knowledge documents, vector records, sessions, caches, and API keys
- Real `.env` files, certificates, private keys, tokens, and local credentials
- Private reports, handover notes, publishing scripts, and operating logs

## Removed Brand Assets

- Team logos, generated campaign artwork, photographs, and video posters
- Original virtual-character PSD derivatives and transparent WebP layers
- Production domains, public IP addresses, and deployment-specific certificates

## Runtime Behavior

The database starts empty except for the configured administrator and site
settings. Public pages render empty states until content is created through the
admin workspace. Optional guide-agent features remain disabled until their
tokens and endpoint are configured.

If you add media or a digital-human PSD, confirm that you have the right to
license and redistribute those assets separately. The MIT license in this
repository applies to the source code, not to assets added by downstream users.
