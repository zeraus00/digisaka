export const PER_PAGE = 5;
// One page of a flat list: the rows to show and how many pages there are (at least one).
export const paginate = (rows, page, per = PER_PAGE) => ({
  shown: rows.slice((page - 1) * per, page * per),
  pages: Math.max(1, Math.ceil(rows.length / per)),
});
