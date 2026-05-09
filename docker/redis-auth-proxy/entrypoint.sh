#!/bin/sh
set -e

# Generate htpasswd from env vars at container startup
if [ -z "$HTPASSWD_USER" ] || [ -z "$HTPASSWD_PASSWORD" ]; then
  echo "ERROR: HTPASSWD_USER and HTPASSWD_PASSWORD must be set"
  exit 1
fi

htpasswd -cbB /etc/nginx/.htpasswd "$HTPASSWD_USER" "$HTPASSWD_PASSWORD"
echo "==> Basic auth configured for user '$HTPASSWD_USER'"

exec "$@"
