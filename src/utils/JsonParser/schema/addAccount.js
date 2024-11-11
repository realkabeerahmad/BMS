// schema.js
const accountSchema = {
  addAccount: {
    type: "object",
    required: true,
    properties: {
      account: {
        type: "object",
        required: true,
        properties: {
          account_no: { type: "string", required: true },
          account_title: { type: "string", required: true },
          branch_code: { type: "string", required: true },
          bank_routing_no: { type: "string", required: true },
          account_type: { type: "string", required: true },
          user: {
            type: "object",
            required: true,
            properties: {
              first_name: { type: "string", required: true },
              middle_name: { type: "string", required: false },
              last_name: { type: "string", required: true },
              email: { type: "string", required: true },
              phoneNumber: { type: "string", required: true },
              address1: { type: "string", required: true },
              address2: { type: "string", required: false },
              city: { type: "string", required: true },
              state: { type: "string", required: true },
              country: { type: "string", required: true },
              dob: { type: "string", required: true },
              cid_type: { type: "string", required: true },
              cid_no: { type: "string", required: true },
              gender: { type: "string", required: true },
            },
          },
          documents: {
            type: "array",
            required: false,
            items: { type: "object" },
          },
          applyFee: { type: "string", required: false },
          feeAmount: { type: "number", required: false },
          initialDeposit: { type: "number", required: true },
        },
      },
    },
  },
};

module.exports = accountSchema;
