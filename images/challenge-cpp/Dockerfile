FROM debian:bookworm-slim AS code-server

ARG CODE_SERVER_VERSION=4.121.0
ARG TARGETARCH

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl tar \
    && rm -rf /var/lib/apt/lists/* \
    && architecture="${TARGETARCH:-$(dpkg --print-architecture)}" \
    && case "${architecture}" in \
      amd64) code_server_sha256="3860893f15376e5f984492c5c92e87c51975d67e3902410f422823d9f60e06af" ;; \
      arm64) code_server_sha256="de5101a3c1f86b3853431d6920dcf4daaca879f613dec9139496099e31baa569" ;; \
      *) echo "Unsupported code-server architecture: ${architecture}" >&2; exit 1 ;; \
    esac \
    && curl --fail --location --silent --show-error \
      "https://github.com/coder/code-server/releases/download/v${CODE_SERVER_VERSION}/code-server-${CODE_SERVER_VERSION}-linux-${architecture}.tar.gz" \
      --output /tmp/code-server.tar.gz \
    && echo "${code_server_sha256}  /tmp/code-server.tar.gz" | sha256sum --check --status \
    && mkdir -p /opt/code-server \
    && tar -xzf /tmp/code-server.tar.gz --strip-components=1 -C /opt/code-server \
    && rm -rf /opt/code-server/lib/vscode/extensions/copilot \
      /opt/code-server/lib/vscode/extensions/github \
      /opt/code-server/lib/vscode/extensions/github-authentication \
      /opt/code-server/lib/vscode/extensions/mermaid-markdown-features \
      /opt/code-server/lib/vscode/extensions/microsoft-authentication \
    && rm /tmp/code-server.tar.gz

FROM debian:bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends bash ca-certificates g++ git make python3 \
    && ln -s /usr/bin/python3 /usr/local/bin/python \
    && useradd --create-home --shell /bin/bash candidate \
    && mkdir /workspace \
    && chown candidate:candidate /workspace \
    && rm -rf /var/lib/apt/lists/*

COPY --from=code-server /opt/code-server /opt/code-server

RUN ln -s /opt/code-server/bin/code-server /usr/local/bin/code-server

ENV HOME=/home/candidate
ENV PATH="/opt/code-server/bin:${PATH}"

USER candidate
WORKDIR /workspace
EXPOSE 8080

CMD ["code-server", "--bind-addr", "0.0.0.0:8080", "--auth", "password", "--disable-telemetry", "/workspace"]
