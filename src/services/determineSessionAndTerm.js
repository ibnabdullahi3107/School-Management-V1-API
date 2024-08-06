const { Op } = require("sequelize");
const { Session, Term, Enrollment } = require("../../models");
const { BadRequestError } = require("../errors");

const determineSessionAndTerm = async (student_id, lastPayment) => {

  const { session_id: lastSessionID, term_id: lastTermID } = lastPayment;

  const nextTerm = await Term.findOne({
    where: {
      session_id: lastSessionID,
      term_id: { [Op.gt]: lastTermID },
    },
    order: [["term_id", "ASC"]],
  });

  if (nextTerm) {
    return { session_id: lastSessionID, term_id: nextTerm.term_id };
  }

  const nextSession = await Session.findOne({
    where: { session_id: { [Op.gt]: lastSessionID } },
    order: [["session_id", "ASC"]],
  });

  if (nextSession) {
    const firstTermOfNextSession = await Term.findOne({
      where: { session_id: nextSession.session_id },
      order: [["term_id", "ASC"]],
    });

    if (firstTermOfNextSession) {
      return {
        session_id: nextSession.session_id,
        term_id: firstTermOfNextSession.term_id,
      };
    }
  }

  throw new BadRequestError("No more sessions available for payment.");
};

module.exports = {
  determineSessionAndTerm,
};
