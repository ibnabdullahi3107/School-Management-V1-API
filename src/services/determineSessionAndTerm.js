const { Op } = require("sequelize");
const {
  Session,
  Term,
} = require("../../models");

const { BadRequestError } = require("../errors");


const determineSessionAndTerm = async (student_id, lastPayment) => {
  // Retrieve the session_id and term_id of the last payment
  const { session_id: lastSessionID, term_id: lastTermID } = lastPayment;

  // Check for the next term within the current session
  const nextTerm = await Term.findOne({
    where: {
      session_id: lastSessionID,
      term_id: { [Op.gt]: lastTermID },
    },
    order: [["term_id", "ASC"]],
  });

  // If there's a next term within the current session, return its session_id and term_id
  if (nextTerm) {
    return { session_id: lastSessionID, term_id: nextTerm.term_id };
  }

  // If there's no next term within the current session, check for the next session
  const nextSession = await Session.findOne({
    where: { session_id: { [Op.gt]: lastSessionID } },
    order: [["session_id", "ASC"]],
  });

  // If there's a next session, use the first term of the next session
  if (nextSession) {
    const firstTermOfNextSession = await Term.findOne({
      where: { session_id: nextSession.session_id },
      order: [["term_id", "ASC"]],
    });

    // If there's a first term for the next session, return its session_id and term_id
    if (firstTermOfNextSession) {
      return {
        session_id: nextSession.session_id,
        term_id: firstTermOfNextSession.term_id,
      };
    }
  }

  // If no more sessions are available for payment, throw an error
  throw new BadRequestError("No more sessions available for payment.");
};

module.exports = {
  determineSessionAndTerm,
};
