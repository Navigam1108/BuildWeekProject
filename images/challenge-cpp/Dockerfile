FROM gcc:14-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends bash git make ripgrep ca-certificates curl python3 \
    && rm -rf /var/lib/apt/lists/* \
    && ln -s /usr/bin/python3 /usr/local/bin/python \
    && useradd --create-home --shell /bin/bash candidate
RUN curl -fsSL https://code-server.dev/install.sh | sh
USER candidate
WORKDIR /workspace
EXPOSE 8080
CMD ["code-server", "--bind-addr", "0.0.0.0:8080", "--auth", "password", "/workspace"]
