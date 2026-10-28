const BUSINESS_TIME_ZONE = "Europe/Rome";

const getDatePartsInTimeZone = (date, timeZone = BUSINESS_TIME_ZONE) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
};

export const getBusinessToday = (now = new Date()) => {
  const { year, month, day } = getDatePartsInTimeZone(now);
  return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
};

export const parseContractDate = (value) => {
  if (!value) return null;

  const dateOnly = typeof value === "string" ? value.slice(0, 10) : null;
  const parsed = dateOnly
    ? new Date(`${dateOnly}T00:00:00.000Z`)
    : new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const getSocialCollaborationStatus = (
  startDate,
  currentStatus = "attiva",
  now = new Date()
) => {
  if (["terminata", "in sospeso"].includes(currentStatus)) {
    return currentStatus;
  }

  const parsedStartDate = parseContractDate(startDate);
  if (parsedStartDate && parsedStartDate > getBusinessToday(now)) {
    return "pending";
  }

  return "attiva";
};

export const getActiveSocialCollaborationFilter = (now = new Date()) => ({
  stato: { $nin: ["pending", "terminata", "in sospeso"] },
  $or: [
    { data_inizio_contratto: null },
    { data_inizio_contratto: { $exists: false } },
    { data_inizio_contratto: { $lte: getBusinessToday(now) } },
  ],
});

export const syncSocialCollaborationStatuses = async (
  CollaborazioneModel,
  now = new Date()
) => {
  const today = getBusinessToday(now);

  await Promise.all([
    CollaborazioneModel.updateMany(
      {
        stato: "pending",
        data_inizio_contratto: { $lte: today },
      },
      { $set: { stato: "attiva" } }
    ),
    CollaborazioneModel.updateMany(
      {
        $or: [
          { stato: "attiva" },
          { stato: null },
          { stato: { $exists: false } },
        ],
        data_inizio_contratto: { $gt: today },
      },
      { $set: { stato: "pending" } }
    ),
    CollaborazioneModel.updateMany(
      {
        $and: [
          {
            $or: [
              { stato: null },
              { stato: { $exists: false } },
            ],
          },
          {
            $or: [
              { data_inizio_contratto: null },
              { data_inizio_contratto: { $exists: false } },
              { data_inizio_contratto: { $lte: today } },
            ],
          },
        ],
      },
      { $set: { stato: "attiva" } }
    ),
  ]);
};
