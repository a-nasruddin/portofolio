# ═══════════════════════════════════════════════════════════
# Stage 1 — Build static site with Hugo
# ═══════════════════════════════════════════════════════════
FROM alpine:3.19 AS builder

ARG HUGO_VERSION=0.124.1

# Install dependencies & download Hugo extended binary
RUN apk add --no-cache curl tar libc6-compat libstdc++ && \
    ARCH=$(uname -m) && \
    if [ "$ARCH" = "x86_64" ]; then HUGO_ARCH="linux-amd64"; \
    elif [ "$ARCH" = "aarch64" ]; then HUGO_ARCH="linux-arm64"; \
    else HUGO_ARCH="linux-amd64"; fi && \
    curl -fsSL "https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_${HUGO_ARCH}.tar.gz" \
      -o /tmp/hugo.tar.gz && \
    tar -xzf /tmp/hugo.tar.gz -C /tmp && \
    mv /tmp/hugo /usr/local/bin/hugo && \
    chmod +x /usr/local/bin/hugo && \
    rm /tmp/hugo.tar.gz

WORKDIR /site

# Copy all project files
COPY . .

# Build the site (minified)
RUN hugo --minify --gc

# ═══════════════════════════════════════════════════════════
# Stage 2 — Serve with Nginx Alpine (~25MB final image)
# ═══════════════════════════════════════════════════════════
FROM nginx:1.25-alpine

# Copy built static files
COPY --from=builder /site/public /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Remove default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf.bak

# Use non-root user for security
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
