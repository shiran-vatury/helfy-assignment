# helfy-assignment

run with `docker compose up -d`
grafana is available in `http://localhost:3001`
elasticsearch available at `http://localhost:9200`

- Logs: 
  - node-consumer js app is connected to kafka broker named `events` and it will post logs
via filebeat


- Metrics:
  - Kafka exposes metrics (through JMX)
  - A JMX Exporter is used to convert these into a Prometheus-compatible format.
Prometheus then scrapes the exporter’s `/metrics` endpoint and stores the time-series data for visualization in Grafana.


#### I didn't manage to make grafana use the folder structure correctly