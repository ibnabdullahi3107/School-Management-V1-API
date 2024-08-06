const crypto = require("crypto");
const { Receipt } = require("../../models");

// Function to generate a unique receipt number with checksum
const generateReceiptNumber = async () => {
  let receiptNumber;

  // Loop until a unique receipt number is generated
  do {
    // Generate a random receipt number using crypto
    receiptNumber = generateRandomNumber(10); // Adjust the length as needed

    // Calculate checksum for the receipt number
    const checksum = generateChecksum(receiptNumber);

    // Concatenate the receipt number and checksum as strings
    const fullReceiptNumber = receiptNumber.toString() + checksum.toString();

    try {
      // Check if the generated full receipt number is unique in the database
      const existingReceipt = await Receipt.findOne({
        where: { receipt_number: fullReceiptNumber },
      });

      // If no existing receipt found with the generated number, exit the loop
      if (!existingReceipt) {
        // Return the full receipt number
        return fullReceiptNumber;
      }
    } catch (error) {
      // Handle database error
      console.error("Error checking existing receipt:", error);
      throw new Error("Error generating receipt number");
    }
  } while (true);
};

// Function to generate a random number of specified length using crypto
const generateRandomNumber = (length) => {
  const buffer = crypto.randomBytes(Math.ceil(length / 2));
  const randomNumber = buffer.toString("hex").slice(0, length);

  // Replace non-numeric characters with random digits
  return randomNumber.replace(/\D/g, () => Math.floor(Math.random() * 10));
};

// Function to generate a checksum digit for validation
const generateChecksum = (receiptNumber) => {
  const digits = receiptNumber.split("").map(Number);

  for (let i = digits.length - 2; i >= 0; i -= 2) {
    let double = digits[i] * 2;
    if (double > 9) double -= 9;
    digits[i] = double;
  }

  const sum = digits.reduce((acc, val) => acc + val, 0);
  const checksum = (10 - (sum % 10)) % 10;

  return checksum;
};

module.exports = { generateReceiptNumber };
