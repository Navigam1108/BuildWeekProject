ARG CODE_SERVER_VERSION=4.121.0

FROM debian:bookworm-slim AS code-server-download

ARG CODE_SERVER_VERSION
ARG TARGETARCH

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl tar \
    && architecture="${TARGETARCH:-$(dpkg --print-architecture)}" \
    && case "$architecture" in \
        amd64) code_server_sha256="3860893f15376e5f984492c5c92e87c51975d67e3902410f422823d9f60e06af" ;; \
        arm64) code_server_sha256="de5101a3c1f86b3853431d6920dcf4daaca879f613dec9139496099e31baa569" ;; \
        *) echo "Unsupported architecture: $architecture" >&2; exit 1 ;; \
    esac \
    && curl --fail --location --silent --show-error --retry 3 \
        --output /tmp/code-server.tar.gz \
        "https://github.com/coder/code-server/releases/download/v${CODE_SERVER_VERSION}/code-server-${CODE_SERVER_VERSION}-linux-${architecture}.tar.gz" \
    && echo "${code_server_sha256}  /tmp/code-server.tar.gz" | sha256sum --check --status \
    && mkdir -p /opt/code-server \
    && tar --extract --gzip --file /tmp/code-server.tar.gz --strip-components=1 --directory /opt/code-server \
    && rm -rf /opt/code-server/lib/vscode/extensions/copilot \
      /opt/code-server/lib/vscode/extensions/github \
      /opt/code-server/lib/vscode/extensions/github-authentication \
      /opt/code-server/lib/vscode/extensions/mermaid-markdown-features \
      /opt/code-server/lib/vscode/extensions/microsoft-authentication \
    && rm -rf /var/lib/apt/lists/* /tmp/code-server.tar.gz

FROM python:3.12-slim-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends bash ca-certificates git libstdc++6 make \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --shell /bin/bash candidate \
    && mkdir -p /workspace \
    && chown candidate:candidate /workspace

COPY --from=code-server-download /opt/code-server /opt/code-server

RUN ln -s /opt/code-server/bin/code-server /usr/local/bin/code-server

ENV HOME=/home/candidate
ENV PATH="/opt/code-server/bin:${PATH}"

USER candidate
WORKDIR /workspace
EXPOSE 8080
CMD ["code-server", "--bind-addr", "0.0.0.0:8080", "--auth", "password", "--disable-telemetry", "/workspace"]
