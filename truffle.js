module.exports = {
  networks: {
    main: {
      host: "localhost",
      port: 8548,
      network_id: 1,
	  gas: 6564277,
	  gasPrice: "50000000000",
	  from: "0xa165950EfE0Bce322AbB1Fe9FF3Bf16a73628D04"
    },

    dev: {
      host: "localhost",
      port: 8545,
      network_id: "*",
	  gas: 4712388,
	  gasPrice: "50000000000",
	  from: "0xa165950EfE0Bce322AbB1Fe9FF3Bf16a73628D04"
    }
  }
};
