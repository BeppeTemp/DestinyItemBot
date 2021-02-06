// @ts-check

const config = {
  endpoint: "https://dimdatabase.documents.azure.com:443/",
  key: "kmHVVaswEcv4JW0KZz0TvDPyaXpEuTlBrzJOVgj4zFM204rtUb149pXb0J1CuibYf02mDtKQ6t4uDUAyMwQqpw==",
  databaseId: "Manifest",
  containerId: "Items",
  partitionKey: { kind: "Hash", paths: ["/category"] }
};

module.exports = config;
