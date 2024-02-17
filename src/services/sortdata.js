function getSortingOrder(sort) {
  switch (sort) {
    case "latest":
      return [["createdAt", "DESC"]];
    case "oldest":
      return [["createdAt", "ASC"]];
    case "a-z":
      return [["last_name", "ASC"]];
    case "z-a":
      return [["last_name", "DESC"]];
    default:
      return [];
  }
}

function applySortingAndPagination(data, sort, offset, limit) {
  switch (sort) {
    case "latest":
      return data
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(offset, offset + limit);
    case "oldest":
      return data
        .sort((a, b) => a.createdAt - b.createdAt)
        .slice(offset, offset + limit);
    case "a-z":
      return data
        .sort((a, b) => a.last_name.localeCompare(b.last_name))
        .slice(offset, offset + limit);
    case "z-a":
      return data
        .sort((a, b) => b.last_name.localeCompare(a.last_name))
        .slice(offset, offset + limit);
    default:
      return data.slice(offset, offset + limit);
  }
}

module.exports = {
  getSortingOrder,
  applySortingAndPagination,
};
