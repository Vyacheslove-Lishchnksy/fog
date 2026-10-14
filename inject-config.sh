#!/bin/bash
# Build-команда для Render (і локальної прод-симуляції):
# генерує config.js з env-змінних, щоб ключі не лежали в репозиторії.
#   SUPABASE_URL, SUPABASE_ANON_KEY — з Supabase Project Settings -> API
#   APP_DEBUG — "true" для dev-збірки, "false" (або пусто) для prod
set -e
cat > config.js <<EOF
// згенеровано на збірці, не редагувати вручну
window.FOW_CONFIG = {
  SUPABASE_URL: "${SUPABASE_URL:-}",
  SUPABASE_ANON_KEY: "${SUPABASE_ANON_KEY:-}",
  DEBUG: ${APP_DEBUG:-false}
};
EOF
echo "config.js згенеровано (DEBUG=${APP_DEBUG:-false})"
