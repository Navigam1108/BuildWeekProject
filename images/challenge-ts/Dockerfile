FROM debian:bookworm-slim AS code-server

ARG CODE_SERVER_VERSION=4.121.0
ARG TARGETARCH

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends ca-certificates curl tar; \
    rm -rf /var/lib/apt/lists/*; \
    architecture="${TARGETARCH:-$(dpkg --print-architecture)}"; \
    case "$architecture" in \
      amd64) checksum="3860893f15376e5f984492c5c92e87c51975d67e3902410f422823d9f60e06af" ;; \
      arm64) checksum="de5101a3c1f86b3853431d6920dcf4daaca879f613dec9139496099e31baa569" ;; \
      *) echo "Unsupported code-server architecture: $architecture" >&2; exit 1 ;; \
    esac; \
    archive="code-server-${CODE_SERVER_VERSION}-linux-${architecture}.tar.gz"; \
    curl --fail --location --silent --show-error \
      "https://github.com/coder/code-server/releases/download/v${CODE_SERVER_VERSION}/${archive}" \
      --output "/tmp/${archive}"; \
    echo "${checksum}  /tmp/${archive}" | sha256sum --check --status; \
    tar --extract --gzip --file "/tmp/${archive}" --directory /opt; \
    mv "/opt/code-server-${CODE_SERVER_VERSION}-linux-${architecture}" /opt/code-server; \
    rm -rf /opt/code-server/lib/vscode/extensions/copilot \
      /opt/code-server/lib/vscode/extensions/github \
      /opt/code-server/lib/vscode/extensions/github-authentication \
      /opt/code-server/lib/vscode/extensions/mermaid-markdown-features \
      /opt/code-server/lib/vscode/extensions/microsoft-authentication; \
    rm "/tmp/${archive}"

FROM node:22-bookworm-slim

COPY --from=code-server /opt/code-server /opt/code-server

RUN ln -s /opt/code-server/bin/code-server /usr/local/bin/code-server

RUN apt-get update \
    && apt-get install -y --no-install-recommends bash ca-certificates git libstdc++6 make python3 \
    && ln -s /usr/bin/python3 /usr/local/bin/python \
    && useradd --create-home --shell /bin/bash candidate \
    && mkdir -p /workspace \
    && chown candidate:candidate /workspace \
    && rm -rf /var/lib/apt/lists/*

ENV HOME=/home/candidate
ENV PATH="/opt/code-server/bin:${PATH}"

USER candidate
WORKDIR /workspace
EXPOSE 8080
CMD ["code-server", "--bind-addr", "0.0.0.0:8080", "--auth", "password", "--disable-telemetry", "/workspace"]
