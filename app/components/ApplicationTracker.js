'use client';

import { useState, useMemo } from 'react';
import { usePaginatedApplications, useApplicationStats } from '../../lib/usePaginatedApplications';
import {
  Card,
  CardHeader,
  StatCard,
  FilterBar,
  FilterField,
  Input,
  Select,
  Badge,
  DataTable,
  Pagination,
  tableTh,
  tableTd,
  SearchIcon,
  ChartIcon,
  UsersIcon,
  CheckIcon,
  ClockIcon,
  ChatIcon,
  SpinnerIcon,
} from './ui';

export default function ApplicationTracker() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [nameFilter, setNameFilter] = useState('all');
  const [hrReplyFilter, setHrReplyFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [appliedDateFrom, setAppliedDateFrom] = useState('');
  const [appliedDateTo, setAppliedDateTo] = useState('');

  const { stats, refresh: refreshStats } = useApplicationStats();

  const filters = useMemo(
    () => ({
      status: statusFilter,
      name: nameFilter,
      hrReply: hrReplyFilter,
      appliedDateFrom,
      appliedDateTo,
      search: searchTerm,
      sort: dateFilter,
    }),
    [
      statusFilter,
      nameFilter,
      hrReplyFilter,
      appliedDateFrom,
      appliedDateTo,
      searchTerm,
      dateFilter,
    ]
  );

  const {
    applications,
    page,
    setPage,
    total,
    totalPages,
    pageSize,
    loading: tableLoading,
  } = usePaginatedApplications(filters);

  const countBadge = (n) => {
    if (n === 0) return 'default';
    if (n === 1) return 'info';
    return 'purple';
  };

  const recentApplications = stats?.recentApplied ?? [];
  const applicationsByDate = stats?.appliedByDate ?? [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total" value={stats?.total ?? 0} icon={ChartIcon} color="blue" />
        <StatCard label="Applied" value={stats?.applied ?? 0} icon={CheckIcon} color="green" />
        <StatCard label="Pending" value={stats?.pending ?? 0} icon={ClockIcon} color="amber" />
        <StatCard label="HR replied" value={stats?.hrReplied ?? 0} icon={ChatIcon} color="violet" />
      </div>

      <Card>
        <CardHeader title="Application history" icon={UsersIcon} />

        <div className="px-4 pb-3 border-b border-slate-100">
          <FilterBar
            resultText={`${total} matching · page ${page} of ${totalPages}`}
            onClear={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setNameFilter('all');
              setHrReplyFilter('all');
              setDateFilter('all');
              setAppliedDateFrom('');
              setAppliedDateTo('');
            }}
          >
            <FilterField label="Search" icon={SearchIcon}>
              <Input
                icon={SearchIcon}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Email, name, company…"
              />
            </FilterField>
            <FilterField label="Status">
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All ({stats?.total ?? 0})</option>
                <option value="pending">
                  Pending ({stats?.pending ?? 0})
                </option>
                <option value="applied">
                  Applied ({stats?.applied ?? 0})
                </option>
              </Select>
            </FilterField>
            <FilterField label="Name">
              <Select value={nameFilter} onChange={(e) => setNameFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="set">
                  Set ({stats?.nameSet ?? 0})
                </option>
                <option value="not_set">
                  Not set ({stats?.nameNotSet ?? 0})
                </option>
              </Select>
            </FilterField>
            <FilterField label="HR reply">
              <Select value={hrReplyFilter} onChange={(e) => setHrReplyFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="replied">
                  Replied ({stats?.hrReplied ?? 0})
                </option>
                <option value="not_replied">
                  No ({(stats?.total ?? 0) - (stats?.hrReplied ?? 0)})
                </option>
              </Select>
            </FilterField>
            <FilterField label="Applied from">
              <Input
                type="date"
                value={appliedDateFrom}
                onChange={(e) => setAppliedDateFrom(e.target.value)}
              />
            </FilterField>
            <FilterField label="Applied to">
              <Input
                type="date"
                value={appliedDateTo}
                onChange={(e) => setAppliedDateTo(e.target.value)}
              />
            </FilterField>
            <FilterField label="Sort">
              <Select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
                <option value="all">Default</option>
                <option value="latest">Newest</option>
                <option value="older">Oldest</option>
              </Select>
            </FilterField>
          </FilterBar>
        </div>

        {tableLoading && applications.length === 0 ? (
          <div className="flex justify-center py-12">
            <SpinnerIcon className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <DataTable>
            <colgroup>
              <col className="w-[18%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[9%]" />
              <col className="w-[8%]" />
              <col className="w-[9%]" />
              <col className="w-[9%]" />
              <col className="w-[6%]" />
              <col className="w-[6%]" />
              <col className="w-[15%]" />
            </colgroup>
            <thead className="bg-slate-50">
              <tr>
                <th className={tableTh}>Email</th>
                <th className={tableTh}>Name</th>
                <th className={tableTh}>Co.</th>
                <th className={tableTh}>HR #</th>
                <th className={tableTh}>Status</th>
                <th className={tableTh}>Applied</th>
                <th className={tableTh}>Created</th>
                <th className={tableTh}>#</th>
                <th className={tableTh}>HR?</th>
                <th className={tableTh}>Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/80">
                  <td className={`${tableTd} truncate`} title={app.email}>
                    {app.email}
                  </td>
                  <td className={`${tableTd} truncate`}>{app.name || '—'}</td>
                  <td className={`${tableTd} truncate`}>{app.company || '—'}</td>
                  <td className={tableTd}>{app.hrNumber || '—'}</td>
                  <td className={tableTd}>
                    <Badge variant={app.isApplied ? 'success' : 'warning'}>
                      {app.isApplied ? 'Applied' : 'Pending'}
                    </Badge>
                  </td>
                  <td className={`${tableTd} text-slate-500`}>
                    {app.appliedDate ? new Date(app.appliedDate).toLocaleDateString() : '—'}
                  </td>
                  <td className={`${tableTd} text-slate-500`}>
                    {new Date(app.createdAt).toLocaleDateString()}
                  </td>
                  <td className={tableTd}>
                    <Badge variant={countBadge(app.applicationCount || 0)}>
                      {app.applicationCount || 0}
                    </Badge>
                  </td>
                  <td className={tableTd}>
                    <Badge variant={app.hrReplied ? 'success' : 'default'}>
                      {app.hrReplied ? 'Y' : 'N'}
                    </Badge>
                  </td>
                  <td className={`${tableTd} truncate`} title={app.hrReplyNotes || ''}>
                    {app.hrReplyNotes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onPageChange={setPage}
          loading={tableLoading}
        />

        {!tableLoading && applications.length === 0 && (
          <div className="text-center py-8 text-sm text-slate-500">
            No applications match the selected filter.
          </div>
        )}
      </Card>

      {recentApplications.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <ClockIcon className="w-4 h-4 text-slate-400" />
            Recent applications
          </h3>
          <div className="space-y-2">
            {recentApplications.map((app) => (
              <div
                key={app.id}
                className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-slate-50 border-b border-slate-100 last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-900 truncate">{app.email}</p>
                  <p className="text-[10px] text-slate-500">{app.name || 'No name'}</p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="text-xs text-slate-600">
                    {new Date(app.appliedDate).toLocaleDateString()}
                  </p>
                  <Badge variant="success">Applied</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {applicationsByDate.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <ChartIcon className="w-4 h-4 text-slate-400" />
            By date
          </h3>
          <div className="space-y-1.5">
            {applicationsByDate.map(({ date, count }) => (
              <div key={date} className="flex justify-between text-xs py-1">
                <span className="text-slate-600">{new Date(date).toDateString()}</span>
                <span className="font-medium text-slate-900 tabular-nums">{count}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
