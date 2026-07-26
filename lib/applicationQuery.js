const PAGE_SIZE = 50;

function parseFilters(searchParams) {
  return {
    status: searchParams.get('status') || 'all',
    name: searchParams.get('name') || 'all',
    hrReply: searchParams.get('hrReply') || 'all',
    excludeHrReplied: searchParams.get('excludeHrReplied') === 'true',
    count: searchParams.get('count') || 'all',
    appliedDateFrom: searchParams.get('appliedDateFrom') || '',
    appliedDateTo: searchParams.get('appliedDateTo') || '',
    search: searchParams.get('search') || '',
    sort: searchParams.get('sort') || 'all',
    unapplied: searchParams.get('unapplied') === 'true',
  };
}

function buildApplicationQuery(filters) {
  const conditions = [];
  const params = [];

  if (filters.unapplied) {
    conditions.push('isApplied = 0');
  }

  switch (filters.status) {
    case 'applied':
      conditions.push('isApplied = 1');
      break;
    case 'pending':
      conditions.push('isApplied = 0');
      break;
  }

  switch (filters.name) {
    case 'set':
    case 'has_name':
      conditions.push("name IS NOT NULL AND TRIM(name) != ''");
      break;
    case 'not_set':
    case 'no_name':
      conditions.push("(name IS NULL OR TRIM(name) = '')");
      break;
  }

  switch (filters.hrReply) {
    case 'replied':
      conditions.push('hrReplied = 1');
      break;
    case 'not_replied':
      conditions.push('(hrReplied = 0 OR hrReplied IS NULL)');
      break;
  }

  if (filters.excludeHrReplied) {
    conditions.push('(hrReplied = 0 OR hrReplied IS NULL)');
  }

  switch (filters.count) {
    case '0':
      conditions.push('(applicationCount = 0 OR applicationCount IS NULL)');
      break;
    case '1':
      conditions.push('applicationCount = 1');
      break;
    case '2+':
      conditions.push('applicationCount >= 2');
      break;
  }

  if (filters.appliedDateFrom) {
    conditions.push('appliedDate IS NOT NULL AND date(appliedDate) >= date(?)');
    params.push(filters.appliedDateFrom);
  }

  if (filters.appliedDateTo) {
    conditions.push('appliedDate IS NOT NULL AND date(appliedDate) <= date(?)');
    params.push(filters.appliedDateTo);
  }

  if (filters.search) {
    const term = `%${filters.search.toLowerCase()}%`;
    conditions.push(`(
      LOWER(email) LIKE ? OR
      LOWER(COALESCE(name, '')) LIKE ? OR
      LOWER(COALESCE(company, '')) LIKE ? OR
      LOWER(COALESCE(hrNumber, '')) LIKE ? OR
      LOWER(COALESCE(hrReplyNotes, '')) LIKE ?
    )`);
    params.push(term, term, term, term, term);
  }

  const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  let orderBy = 'ORDER BY createdAt DESC';
  switch (filters.sort) {
    case 'latest':
      orderBy = 'ORDER BY createdAt DESC';
      break;
    case 'older':
      orderBy = 'ORDER BY createdAt ASC';
      break;
  }

  return { whereSql, params, orderBy };
}

function filtersToSearchParams(filters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (value === false) return;
    if (value === 'all') return;
    params.set(key, value === true ? 'true' : String(value));
  });
  return params;
}

module.exports = {
  PAGE_SIZE,
  parseFilters,
  buildApplicationQuery,
  filtersToSearchParams,
};
