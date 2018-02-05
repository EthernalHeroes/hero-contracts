module.exports = {
  networks: {
    dev: {
      host: "localhost",
      port: 8545,
      network_id: "*",
	  gas: 4600000,
	  from: "0xd794763e54eecb87a7879147b5a17bfa6663a33c"
    }
  }
};
