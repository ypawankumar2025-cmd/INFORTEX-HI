#!/bin/sh
# The image runs both programs in one *free* Render Web Service.
set -eu
PORT="${PORT:-10000}"
case "$PORT" in
  ''|*[!0-9]*) echo 'ERROR: PORT must be numeric' >&2; exit 1 ;;
esac
if [ "$PORT" -eq 8081 ]; then
  echo 'ERROR: PORT=8081 conflicts with the internal C++ backend port' >&2
  exit 1
fi
export PORT
# Substitute ONLY ${PORT}; preserve Nginx variables like $host and $uri.
envsubst '${PORT}' < /app/render-nginx.conf.template > /tmp/hi-nginx.conf
nginx -t -c /tmp/hi-nginx.conf
PORT=8081 ./hi_server &
backend_pid=$!
nginx -c /tmp/hi-nginx.conf -g 'daemon off;' &
nginx_pid=$!
stop_children() {
  kill "$nginx_pid" "$backend_pid" 2>/dev/null || true
  wait "$nginx_pid" "$backend_pid" 2>/dev/null || true
}
trap 'stop_children; exit 0' INT TERM
# Exit if either important process fails, so the host can restart the service.
while kill -0 "$backend_pid" 2>/dev/null && kill -0 "$nginx_pid" 2>/dev/null; do
  sleep 2 & wait "$!"
done
echo 'ERROR: C++ backend or Nginx exited unexpectedly' >&2
stop_children
exit 1
