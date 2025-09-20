const { Kafka } = require("kafkajs");
const express = require("express");
const fs = require("fs");
const client = require("prom-client");
const path = require("path");

// Environment variables
const kafkaBroker = process.env.KAFKA_BROKER || "kafka:9092";
const cdcTopic = process.env.CDC_TOPIC || "events";
const logFilePath = "/usr/share/filebeat/logs/cdc.log";

// Prometheus counter for CDC operations
const cdcCounter = new client.Counter({
  name: "cdc_operations_total",
  help: "Number of CDC operations",
  labelNames: ["table", "operation"]
});

// Setup Express for Prometheus metrics
const app = express();
const port = 3000;
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});
app.listen(port, () => console.log(`Prometheus metrics available at http://localhost:${port}/metrics`));

// Kafka consumer setup
const kafka = new Kafka({ brokers: [kafkaBroker] });
const consumer = kafka.consumer({ groupId: process.env.KAFKA_CONSUMER_GROUP || "cdc-group" });

async function runConsumer() {
  // Retry loop in case Kafka is not ready yet
  while (true) {
    try {
      await consumer.connect();
      break;
    } catch (err) {
      console.log("Kafka not ready yet, retrying in 2s...", err.message);
      await new Promise(res => setTimeout(res, 2000));
    }
  }

  await consumer.subscribe({ topic: cdcTopic, fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      let event;
      try {
        event = JSON.parse(message.value.toString());
      } catch (err) {
        console.error("Invalid JSON message, skipping:", message.value.toString());
        return;
      }

      // Update Prometheus counter
      cdcCounter.inc({ table: event.table, operation: event.type });

      // Log event to file
      const logLine = `${new Date().toISOString()} | Table: ${event.table} | Operation: ${event.type} | Data: ${JSON.stringify(event.data)}\n`;
      fs.appendFileSync(logFilePath, logLine);

      console.log("CDC Event:", logLine.trim());
    }
  });
}

// Start consumer
runConsumer().catch(console.error);
