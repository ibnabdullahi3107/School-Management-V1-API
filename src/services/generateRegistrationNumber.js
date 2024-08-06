const { Student } = require("../../models");
const { Op } = require("sequelize");


// Function to generate registration number
const generateRegistrationNumber = async () => {
  // IHN is a constant
  const constantPart = "IHN";

  // Get the current year
  const currentYear = new Date().getFullYear();

  // Find the count of students registered in the current year
  const lastStudent = await Student.findOne({
    where: {
      reg_number: {
        [Op.startsWith]: `${constantPart}/${currentYear}`,
      },
    },
    order: [["reg_number", "DESC"]],
  });

  let uniqueNumber;
  if (lastStudent) {
    // Extract the unique number part and increment it
    const lastRegistrationNumber = lastStudent.reg_number;
    const lastUniqueNumber = parseInt(lastRegistrationNumber.split("/")[2], 10);
    uniqueNumber = lastUniqueNumber + 1;
  } else {
    // Start from 1001 if no previous registrations for the current year
    uniqueNumber = 1001;
  }

  // Format the registration number with the checksum digit
  const registrationNumber = `${constantPart}/${currentYear}/${uniqueNumber
    .toString()
    .padStart(4, "0")}`;

  return registrationNumber;
};

module.exports = {
  generateRegistrationNumber,
};
