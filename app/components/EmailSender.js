'use client';

import { useState, useMemo, useEffect } from 'react';
import { generatePreviewTemplate, generateEmailTemplate } from '../../lib/emailTemplate';
import { usePaginatedApplications, useApplicationStats } from '../../lib/usePaginatedApplications';
import { apiFetch } from '../../lib/apiClient';
import {
  Card,
  CardHeader,
  Button,
  Input,
  Select,
  Checkbox,
  FilterBar,
  FilterField,
  Badge,
  Alert,
  DataTable,
  Pagination,
  TabPills,
  tableTh,
  tableTd,
  SearchIcon,
  SendIcon,
  EyeIcon,
  XIcon,
  SpinnerIcon,
  MailIcon,
} from './ui';

const EMAIL_PROVIDER_KEY = 'emailProvider';

export default function EmailSender({ onApplicationsChange }) {
  const [selectedByEmail, setSelectedByEmail] = useState({});
  const [cvPath, setCvPath] = useState('');
  const [emailProvider, setEmailProvider] = useState('sendgrid');
  const [providerStatus, setProviderStatus] = useState(null);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [previewEmail, setPreviewEmail] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, applied, pending
  const [countFilter, setCountFilter] = useState('all'); // all, 0, 1, 2+
  const [excludeHrReplied, setExcludeHrReplied] = useState(true); // Filter out HR replied emails
  const [nameFilter, setNameFilter] = useState('all'); // all, has_name, no_name
  const [sendingProgress, setSendingProgress] = useState({ current: 0, total: 0, batch: 0, totalBatches: 0 });

  useEffect(() => {
    const saved = localStorage.getItem(EMAIL_PROVIDER_KEY);
    if (saved === 'gmail' || saved === 'sendgrid') {
      setEmailProvider(saved);
    }

    apiFetch('/api/test-email')
      .then((res) => res.json())
      .then((data) => setProviderStatus(data.providers))
      .catch(() => {});
  }, []);

  const handleProviderChange = (provider) => {
    setEmailProvider(provider);
    localStorage.setItem(EMAIL_PROVIDER_KEY, provider);
  };

  const providerLabel = emailProvider === 'gmail' ? 'Gmail' : 'SendGrid';
  const providerFrom =
    emailProvider === 'gmail'
      ? providerStatus?.gmail?.from
      : providerStatus?.sendgrid?.from;

  const { stats, refresh: refreshStats } = useApplicationStats();

  const filters = useMemo(
    () => ({
      status: statusFilter,
      count: countFilter,
      name: nameFilter,
      excludeHrReplied,
      search: searchTerm,
    }),
    [statusFilter, countFilter, nameFilter, excludeHrReplied, searchTerm]
  );

  const {
    applications,
    page,
    setPage,
    total,
    totalPages,
    pageSize,
    loading: tableLoading,
    refresh,
  } = usePaginatedApplications(filters);

  const selectedEmails = Object.keys(selectedByEmail);

  const handleDataChange = () => {
    refresh();
    refreshStats();
    onApplicationsChange?.();
  };

  const allPageSelected =
    applications.length > 0 &&
    applications.every((app) => selectedByEmail[app.email]);
  const handleSelectEmail = (app) => {
    setSelectedByEmail((prev) => {
      if (prev[app.email]) {
        const next = { ...prev };
        delete next[app.email];
        return next;
      }
      return { ...prev, [app.email]: app };
    });
  };

  const handleSelectAll = () => {
    if (allPageSelected) {
      setSelectedByEmail((prev) => {
        const next = { ...prev };
        applications.forEach((app) => delete next[app.email]);
        return next;
      });
    } else {
      setSelectedByEmail((prev) => {
        const next = { ...prev };
        applications.forEach((app) => {
          next[app.email] = app;
        });
        return next;
      });
    }
  };

  const handleRowClick = (app, event) => {
    if (
      event.target.type === 'checkbox' ||
      event.target.closest('button')
    ) {
      return;
    }
    handleSelectEmail(app);
  };

  const handleSendEmails = async () => {
    if (selectedEmails.length === 0) {
      setMessage('❌ Please select at least one email to send to.');
      return;
    }

    setSending(true);
    setMessage('');

    try {
      const emailsToSend = Object.values(selectedByEmail).map(app => ({        ...app,
        email: app.email.replace(/^"(.*)"$/, '$1') // Remove extra quotes
      }));

      setSendingProgress({
        current: 0,
        total: emailsToSend.length,
        batch: 0,
        totalBatches: 0
      });

      let totalSent = 0;
      let totalFailed = 0;
      const failedEmails = [];

      // Process each email individually with random delays
      for (let emailIndex = 0; emailIndex < emailsToSend.length; emailIndex++) {
        const emailData = emailsToSend[emailIndex];
        
        setSendingProgress(prev => ({
          ...prev,
          current: emailIndex
        }));

        setMessage(`📤 Sending email ${emailIndex + 1}/${emailsToSend.length} to ${emailData.email}...`);

        try {
          const response = await apiFetch('/api/emails/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              emails: [emailData], // Send one email at a time
              cvPath: cvPath || null,
              provider: emailProvider,
            }),
          });

          let data;
          try {
            data = await response.json();
          } catch (jsonError) {
            console.error('JSON parsing error:', jsonError);
            setMessage(`❌ Server returned invalid response for email ${emailIndex + 1}. Status: ${response.status}`);
            totalFailed += 1;
            failedEmails.push(emailData.email);
            continue;
          }

          if (response.ok) {
            totalSent += data.totalSent || 0;
            totalFailed += data.totalFailed || 0;
            if (data.failedEmails) {
              failedEmails.push(...data.failedEmails);
            }
          } else {
            setMessage(`❌ Error sending email ${emailIndex + 1}: ${data.error || 'Unknown error occurred'}`);
            totalFailed += 1;
            failedEmails.push(emailData.email);
          }

          setSendingProgress(prev => ({
            ...prev,
            current: emailIndex + 1
          }));

        } catch (error) {
          console.error(`Error sending email ${emailIndex + 1}:`, error);
          setMessage(`❌ Error sending email ${emailIndex + 1}: ${error.message}`);
          totalFailed += 1;
          failedEmails.push(emailData.email);
        }

        // Add random delay between emails (except for the last email)
        if (emailIndex < emailsToSend.length - 1) {
          const randomDelay = Math.floor(Math.random() * (100 - 10 + 1)) + 10; // Random between 10-100 seconds
          setMessage(`⏳ Waiting ${randomDelay} seconds before next email...`);
          await new Promise(resolve => setTimeout(resolve, randomDelay * 1000));
        }
      }

      // Final results
      if (totalFailed === 0) {
        setMessage(`✅ All emails sent successfully! Sent: ${totalSent}, Failed: ${totalFailed}`);
      } else {
        setMessage(`⚠️ Email sending completed. Sent: ${totalSent}, Failed: ${totalFailed}. Failed emails: ${failedEmails.join(', ')}`);
      }

      setSelectedByEmail({});
      handleDataChange();

    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setSending(false);
      setSendingProgress({ current: 0, total: 0, batch: 0, totalBatches: 0 });
    }
  };

  const generatePreview = (emailData) => {
    const template = generateEmailTemplate({
      name: emailData.name,
      company: emailData.company,
    });
    return {
      subject: template.subject,
      greeting: template.greeting,
      htmlBody: generatePreviewTemplate({
        name: emailData.name,
        company: emailData.company,
      }),
    };
  };

  const messageType = message.includes('✅')
    ? 'success'
    : message.includes('⚠️')
      ? 'warning'
      : 'error';

  const countBadge = (n) => {
    if (n === 0) return 'default';
    if (n === 1) return 'info';
    return 'purple';
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Email provider" icon={MailIcon}>
          <TabPills
            options={[
              { id: 'sendgrid', label: 'SendGrid' },
              { id: 'gmail', label: 'Gmail' },
            ]}
            value={emailProvider}
            onChange={handleProviderChange}
          />
        </CardHeader>
        <div className="px-4 py-3 text-xs text-slate-600 space-y-2">
          <p>
            Sending via <span className="font-semibold text-slate-900">{providerLabel}</span>
            {providerFrom ? (
              <span className="text-slate-500"> · from {providerFrom}</span>
            ) : null}
          </p>
          {emailProvider === 'gmail' ? (
            <div className="bg-amber-50 border border-amber-200/80 rounded-lg p-3 text-amber-900 space-y-1">
              <p className="font-semibold">Gmail limits</p>
              <p>Random 10–100s delay between sends · ~100/day (free), ~500/day (Workspace).</p>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200/80 rounded-lg p-3 text-blue-900">
              <p className="font-semibold">SendGrid</p>
              <p>Uses your verified sender via the SendGrid API.</p>
            </div>
          )}
          {providerStatus && !providerStatus[emailProvider]?.configured && (
            <Alert type="warning">
              {providerLabel} is not fully configured. Check your .env.local settings.
            </Alert>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Select recipients"
          icon={SendIcon}
          subtitle={`${selectedEmails.length} selected`}
        >
          <div className="flex flex-wrap gap-1.5">
            <Button variant="secondary" size="sm" onClick={handleSelectAll}>
              {allPageSelected ? 'Deselect page' : 'Select page'}
            </Button>
            <Button
              variant="success"
              size="sm"
              icon={SendIcon}
              onClick={handleSendEmails}
              disabled={sending || selectedEmails.length === 0}
            >
              {sending
                ? `Sending ${sendingProgress.current}/${sendingProgress.total}`
                : `Send (${selectedEmails.length})`}
            </Button>
          </div>
        </CardHeader>

        <div className="px-4 pb-3 border-b border-slate-100">
          <FilterBar
            resultText={`${total} matching · page ${page} of ${totalPages}`}
            onClear={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setCountFilter('all');
              setNameFilter('all');
              setExcludeHrReplied(true);
            }}
          >
            <FilterField label="Search" icon={SearchIcon}>
              <Input
                icon={SearchIcon}
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
            <FilterField label="Count">
              <Select value={countFilter} onChange={(e) => setCountFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="0">
                  Never ({stats?.count0 ?? 0})
                </option>
                <option value="1">
                  Once ({stats?.count1 ?? 0})
                </option>
                <option value="2+">
                  2+ ({stats?.count2Plus ?? 0})
                </option>
              </Select>
            </FilterField>
            <FilterField label="Name">
              <Select value={nameFilter} onChange={(e) => setNameFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="has_name">
                  Has ({stats?.nameSet ?? 0})
                </option>
                <option value="no_name">
                  None ({stats?.nameNotSet ?? 0})
                </option>
              </Select>
            </FilterField>
            <FilterField label="HR filter">
              <Checkbox
                checked={excludeHrReplied}
                onChange={(e) => setExcludeHrReplied(e.target.checked)}
                label="Exclude HR replied"
                description={`${stats?.hrReplied ?? 0} replied`}
              />
            </FilterField>
          </FilterBar>
        </div>

        {message && (
          <div className="px-4 py-2 border-b border-slate-100">
            <Alert type={messageType}>{message}</Alert>
          </div>
        )}

        {sending && sendingProgress.total > 0 && (
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex justify-between text-xs font-medium text-blue-800 mb-1.5">
                <span>
                  {sendingProgress.current} / {sendingProgress.total}
                </span>
                <span>
                  {Math.round((sendingProgress.current / sendingProgress.total) * 100)}%
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-1.5">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${(sendingProgress.current / sendingProgress.total) * 100}%`,
                  }}
                />
              </div>
              <p className="mt-1.5 text-[10px] text-blue-600">Delay between emails: 10–100s</p>
            </div>
          </div>
        )}

        {tableLoading && applications.length === 0 ? (
          <div className="flex justify-center py-12">
            <SpinnerIcon className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
        <DataTable>
          <colgroup>
            <col className="w-[3%]" />
            <col className="w-[24%]" />
            <col className="w-[12%]" />
            <col className="w-[14%]" />
            <col className="w-[10%]" />
            <col className="w-[7%]" />
            <col className="w-[11%]" />
            <col className="w-[8%]" />
          </colgroup>
          <thead className="bg-slate-50">
            <tr>
              <th className={tableTh}>
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={allPageSelected}
                  onChange={handleSelectAll}
                />
              </th>
              <th className={tableTh}>Email</th>
              <th className={tableTh}>Name</th>
              <th className={tableTh}>Co.</th>
              <th className={tableTh}>Status</th>
              <th className={tableTh}>#</th>
              <th className={tableTh}>Applied</th>
              <th className={tableTh}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {applications.map((app) => (
              <tr
                key={app.id}
                onClick={(e) => handleRowClick(app, e)}
                className={`cursor-pointer transition-colors ${
                  selectedByEmail[app.email]
                    ? 'bg-blue-50/60'
                    : 'hover:bg-slate-50/80'
                }`}
              >
                <td className={tableTd}>
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={!!selectedByEmail[app.email]}
                    onChange={() => handleSelectEmail(app)}
                  />
                </td>
                <td className={`${tableTd} truncate`} title={app.email}>
                  {app.email}
                </td>
                <td className={`${tableTd} truncate`}>{app.name || '—'}</td>
                <td className={`${tableTd} truncate`}>{app.company || '—'}</td>
                <td className={tableTd}>
                  <Badge variant={app.isApplied ? 'success' : 'warning'}>
                    {app.isApplied ? 'Applied' : 'Pending'}
                  </Badge>
                </td>
                <td className={tableTd}>
                  <Badge variant={countBadge(app.applicationCount || 0)}>
                    {app.applicationCount || 0}
                  </Badge>
                </td>
                <td className={`${tableTd} text-slate-500`}>
                  {app.appliedDate ? new Date(app.appliedDate).toLocaleDateString() : '—'}
                </td>
                <td className={tableTd}>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={EyeIcon}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewEmail(app);
                    }}
                  >
                    Preview
                  </Button>
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
            No emails match your filters.
          </div>
        )}
      </Card>

      {previewEmail && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl border border-slate-200 my-8">
            <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">Email preview</h3>
              <button
                type="button"
                onClick={() => setPreviewEmail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                aria-label="Close"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-sm">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase">To</span>
                <p className="text-slate-900 mt-0.5">{previewEmail.email}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase">Subject</span>
                <p className="text-slate-900 mt-0.5">{generatePreview(previewEmail).subject}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase">Message</span>
                <div
                  className="mt-1 p-3 bg-slate-50 rounded-lg text-xs prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: generatePreview(previewEmail).htmlBody }}
                />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase">Attachment</span>
                <p className="text-slate-700 mt-0.5 text-xs">prashant.pdf (auto-attached)</p>
              </div>
            </div>

            <div className="px-4 py-3 border-t border-slate-100 flex justify-end">
              <Button variant="secondary" onClick={() => setPreviewEmail(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
