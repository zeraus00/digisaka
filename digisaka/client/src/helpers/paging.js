export const PER_PAGE = 5;
// One page of a flat list: the rows to show and how many pages there are (at least one).
const pages = (rows, per) => Math.max(1, Math.ceil(rows.length / per));
export const paginate = (rows, page, per = PER_PAGE) => ({
  shown: rows.slice((Math.min(page, pages(rows, per)) - 1) * per, Math.min(page, pages(rows, per)) * per),
  pages: pages(rows, per),
});
