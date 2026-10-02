FROM kestra/kestra:v2.0.4@sha256:3db5e0110babe75bdf6d9e5f030e1df9f7da2a148c47b5197ba233f3f0d6e8f5

USER root

# A new Docker volume inherits this directory and its ownership.
RUN mkdir -p /app/storage && chown 1000:1000 /app/storage

USER kestra
