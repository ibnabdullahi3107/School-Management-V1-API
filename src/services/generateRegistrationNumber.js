const {
  Student,
} = require("../../models");
const { Op } = require("sequelize");


// Function to generate registration number
const generateRegistrationNumber = async () => {
  // IHN is a constant
  const constantPart = "IHN";

  // Get the current year
  const currentYear = new Date().getFullYear();

  // Find the count of students registered in the current year
  const count = await Student.count({
    where: {
      reg_number: {
        [Op.startsWith]: `${constantPart}/${currentYear}`,
      },
    },
  });

  // Increment the count for the current year to create a unique registration number
  const uniqueNumber = count + 1001;

  // Format the registration number
  const registrationNumber = `${constantPart}/${currentYear}/${uniqueNumber
    .toString()
    .padStart(4, "0")}`;

  return registrationNumber;
};

module.exports = {
  generateRegistrationNumber,
};