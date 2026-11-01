FROM ubuntu:24.04 AS build
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends g++ cmake make libasio-dev libssl-dev libcurl4-openssl-dev libsqlite3-dev libpq-dev nlohmann-json3-dev libarchive-dev && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY backend backend
COPY vendor/Crow/include vendor/Crow/include
COPY database database
RUN cmake -S backend -B build -DCMAKE_BUILD_TYPE=Release && cmake --build build -j2 && ctest --test-dir build --output-on-failure
FROM ubuntu:24.04
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends libssl3t64 libcurl4t64 libsqlite3-0 libpq5 libarchive13t64 poppler-utils ca-certificates curl && rm -rf /var/lib/apt/lists/* && useradd --uid 10001 --create-home hi
WORKDIR /app
COPY --from=build /app/build/hi_server ./hi_server
COPY database ./database
RUN mkdir /data && chown hi:hi /data
USER hi
ENV BIND_ADDRESS=0.0.0.0 PORT=8081 SCHEMA_PATH=/app/database/schema.sql
EXPOSE 8081
HEALTHCHECK --interval=15s --timeout=5s --start-period=15s CMD curl -f http://localhost:8081/api/health || exit 1
CMD ["./hi_server"]
