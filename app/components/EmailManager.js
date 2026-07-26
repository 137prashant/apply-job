"use client";

import { useState, useMemo } from "react";
import { usePaginatedApplications, useApplicationStats } from "../../lib/usePaginatedApplications";
import { apiFetch } from "../../lib/apiClient";
import {
  Card,
  CardHeader,
  Button,
  Input,
  Select,
  FilterBar,
  FilterField,
  Badge,
  Alert,
  DataTable,
  Pagination,
  tableTh,
  tableTd,
  IconButton,
  InlineEditActions,
  SearchIcon,
  PlusIcon,
  TrashIcon,
  DownloadIcon,
  PencilIcon,
  MailIcon,
  SpinnerIcon,
} from "./ui";

export default function EmailManager({ onApplicationsChange }) {
  const [emailInput, setEmailInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [editingEmail, setEditingEmail] = useState(null);
  const [editName, setEditName] = useState("");
  const [editingEmailAddress, setEditingEmailAddress] = useState(null);
  const [editEmailAddress, setEditEmailAddress] = useState("");
  const [editingCompany, setEditingCompany] = useState(null);
  const [editCompany, setEditCompany] = useState("");
  const [editingHrNumber, setEditingHrNumber] = useState(null);
  const [editHrNumber, setEditHrNumber] = useState("");
  const [editingHrReply, setEditingHrReply] = useState(null);
  const [editHrReplyNotes, setEditHrReplyNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, applied, pending
  const [nameFilter, setNameFilter] = useState("all"); // all, set, not_set
  const [hrReplyFilter, setHrReplyFilter] = useState("all"); // all, replied, not_replied
  const [dateFilter, setDateFilter] = useState("all"); // all, latest, older
  const [appliedDateFrom, setAppliedDateFrom] = useState("");
  const [appliedDateTo, setAppliedDateTo] = useState("");
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [deleting, setDeleting] = useState(false);

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
    refresh,
  } = usePaginatedApplications(filters);

  const handleDataChange = () => {
    refresh();
    refreshStats();
    onApplicationsChange?.();
  };

  const allPageSelected =
    applications.length > 0 &&
    applications.every((app) => selectedEmails.includes(app.email));

  const handleSelectEmail = (email) => {
    setSelectedEmails((prev) =>
      prev.includes(email)
        ? prev.filter((e) => e !== email)
        : [...prev, email]
    );
  };

  const handleAddEmails = async () => {
    if (!emailInput.trim()) return;

    setLoading(true);
    setMessage("");

    try {
      // Split emails by comma, newline, or semicolon
      const emails = emailInput
        .split(/[,;\n]/)
        .map((email) => email.trim())
        .filter((email) => email.length > 0);

      const response = await apiFetch("/api/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emails }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(
          `✅ ${data.message}. Added: ${data.newCount}, Duplicates: ${data.duplicateCount}, Gmail filtered: ${data.gmailFilteredCount}`
        );
        setEmailInput("");
        handleDataChange();
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async (email, newName) => {
    try {
      const response = await apiFetch(`/api/emails/${encodeURIComponent(email)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newName }),
      });

      if (response.ok) {
        handleDataChange();
        setEditingEmail(null);
        setEditName("");
      }
    } catch (error) {
      console.error("Error updating name:", error);
    }
  };

  const handleUpdateCompany = async (email, newCompany) => {
    try {
      const response = await apiFetch(`/api/emails/${encodeURIComponent(email)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ company: newCompany }),
      });

      if (response.ok) {
        handleDataChange();
        setEditingCompany(null);
        setEditCompany("");
      }
    } catch (error) {
      console.error("Error updating company:", error);
    }
  };

  const handleUpdateHrNumber = async (email, newHrNumber) => {
    try {
      const response = await apiFetch(`/api/emails/${encodeURIComponent(email)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ hrNumber: newHrNumber }),
      });

      if (response.ok) {
        handleDataChange();
        setEditingHrNumber(null);
        setEditHrNumber("");
      }
    } catch (error) {
      console.error("Error updating HR number:", error);
    }
  };

  const handleUpdateEmailAddress = async (oldEmail, newEmail) => {
    if (!newEmail || !newEmail.trim()) {
      alert("Email address cannot be empty");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      alert("Invalid email format");
      return;
    }

    try {
      const response = await apiFetch(`/api/emails/${encodeURIComponent(oldEmail)}/update-email`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newEmail: newEmail.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        handleDataChange();
        setEditingEmailAddress(null);
        setEditEmailAddress("");
        setMessage(`✅ Email address updated successfully from ${oldEmail} to ${newEmail.trim()}`);
      } else {
        setMessage(`❌ Error: ${data.error || 'Failed to update email address'}`);
      }
    } catch (error) {
      console.error("Error updating email address:", error);
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  const handleUpdateHrReply = async (email, hrReplied, hrReplyNotes) => {
    try {
      const response = await apiFetch(`/api/emails/${encodeURIComponent(email)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ hrReplied, hrReplyNotes }),
      });

      if (response.ok) {
        handleDataChange();
        setEditingHrReply(null);
        setEditHrReplyNotes("");
      }
    } catch (error) {
      console.error("Error updating HR reply:", error);
    }
  };

  const handleDeleteApplication = async (email) => {
    if (!confirm("Are you sure you want to delete this application?")) return;

    try {
      const response = await apiFetch(`/api/emails/${encodeURIComponent(email)}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSelectedEmails((prev) => prev.filter((e) => e !== email));
        handleDataChange();
      }
    } catch (error) {
      console.error("Error deleting application:", error);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedEmails.length === 0) return;

    if (
      !confirm(
        `Are you sure you want to delete ${selectedEmails.length} application(s)?`
      )
    ) {
      return;
    }

    setDeleting(true);
    setMessage("");

    try {
      const response = await apiFetch("/api/emails", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emails: selectedEmails }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ Deleted ${data.deletedCount} application(s)`);
        setSelectedEmails([]);
        handleDataChange();
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const exportToExcel = async () => {
    try {
      const response = await apiFetch("/api/excel/export");
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `job_applications_${
          new Date().toISOString().split("T")[0]
        }.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error exporting to Excel:", error);
    }
  };

  const handleSelectAll = () => {
    const pageEmails = applications.map((app) => app.email);
    if (allPageSelected) {
      setSelectedEmails((prev) => prev.filter((e) => !pageEmails.includes(e)));
    } else {
      setSelectedEmails((prev) => [...new Set([...prev, ...pageEmails])]);
    }
  };

  const alertType = message.includes("✅") ? "success" : message.includes("❌") ? "error" : "info";

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Add New Email Addresses" icon={PlusIcon} />
        <div className="p-4 space-y-3">
          <div>
            <label className="filter-label mb-1.5 normal-case tracking-normal text-xs">
              Email addresses (comma, semicolon, or newline separated)
            </label>
            <textarea
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="john.doe@company.com, jane.smith@startup.io"
              className="form-control w-full h-24 resize-y"
            />
            <div className="mt-3 bg-amber-50 border border-amber-200/80 rounded-lg p-3 text-xs text-amber-900">
              <p className="font-medium mb-1">Gmail addresses are filtered; duplicates removed.</p>
              <p className="text-amber-800 mb-2">LinkedIn console — extract mailto links:</p>
              <pre className="bg-amber-100/80 text-amber-950 rounded-md p-2 overflow-x-auto text-[10px] leading-relaxed">
                <code>{`[...document.querySelectorAll('a[href^="mailto:"]')].map(a => a.href.replace("mailto:", ""));`}</code>
              </pre>
            </div>
          </div>

          <Button
            icon={PlusIcon}
            onClick={handleAddEmails}
            disabled={loading || !emailInput.trim()}
          >
            {loading ? "Processing…" : "Add emails"}
          </Button>

          {message && <Alert type={alertType}>{message}</Alert>}
        </div>
      </Card>

      <Card>
        <CardHeader
          title={`Applications (${stats?.total ?? 0})`}
          icon={MailIcon}
          subtitle={selectedEmails.length > 0 ? `${selectedEmails.length} selected` : undefined}
        >
          <div className="flex flex-wrap gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSelectAll}
              disabled={applications.length === 0 || tableLoading}
            >
              {allPageSelected ? "Deselect page" : "Select page"}
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={TrashIcon}
              onClick={handleDeleteSelected}
              disabled={deleting || selectedEmails.length === 0}
            >
              {deleting ? "Deleting…" : `Delete (${selectedEmails.length})`}
            </Button>
            <Button variant="success" size="sm" icon={DownloadIcon} onClick={exportToExcel}>
              Export
            </Button>
          </div>
        </CardHeader>

        <div className="px-4 pb-3 border-b border-slate-100">
          <FilterBar
            resultText={`${total} matching · page ${page} of ${totalPages}`}
            onClear={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setNameFilter("all");
              setHrReplyFilter("all");
              setDateFilter("all");
              setAppliedDateFrom("");
              setAppliedDateTo("");
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
              <col className="w-[3%]" />
              <col className="w-[17%]" />
              <col className="w-[9%]" />
              <col className="w-[9%]" />
              <col className="w-[8%]" />
              <col className="w-[7%]" />
              <col className="w-[8%]" />
              <col className="w-[6%]" />
              <col className="w-[14%]" />
              <col className="w-[5%]" />
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
                <th className={tableTh}>HR #</th>
                <th className={tableTh}>Status</th>
                <th className={tableTh}>Applied</th>
                <th className={tableTh}>HR?</th>
                <th className={tableTh}>Notes</th>
                <th className={tableTh}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applications.map((app) => (
                <tr
                  key={app.id}
                  className={
                    selectedEmails.includes(app.email) ? "bg-blue-50/60" : "hover:bg-slate-50/80"
                  }
                >
                  <td className={tableTd}>
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      checked={selectedEmails.includes(app.email)}
                      onChange={() => handleSelectEmail(app.email)}
                    />
                  </td>
                  <td className={`${tableTd} max-w-0`}>
                    {editingEmailAddress === app.email ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="email"
                          value={editEmailAddress}
                          onChange={(e) => setEditEmailAddress(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleUpdateEmailAddress(app.email, editEmailAddress);
                            } else if (e.key === "Escape") {
                              setEditingEmailAddress(null);
                              setEditEmailAddress("");
                            }
                          }}
                          className="inline-edit-input"
                          placeholder="Email"
                          autoFocus
                        />
                        <InlineEditActions
                          onSave={() => handleUpdateEmailAddress(app.email, editEmailAddress)}
                          onCancel={() => {
                            setEditingEmailAddress(null);
                            setEditEmailAddress("");
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-0.5 min-w-0">
                        <span className="truncate" title={app.email}>{app.email}</span>
                        <IconButton
                          icon={PencilIcon}
                          label="Edit email"
                          onClick={() => {
                            setEditingEmailAddress(app.email);
                            setEditEmailAddress(app.email);
                          }}
                        />
                      </div>
                    )}
                  </td>
                  <td className={tableTd}>
                    {editingEmail === app.email ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleUpdateName(app.email, editName);
                            } else if (e.key === "Escape") {
                              setEditingEmail(null);
                              setEditName("");
                            }
                          }}
                          className="inline-edit-input"
                          placeholder="Name"
                          autoFocus
                        />
                        <InlineEditActions
                          onSave={() => handleUpdateName(app.email, editName)}
                          onCancel={() => {
                            setEditingEmail(null);
                            setEditName("");
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-0.5 min-w-0">
                        <span className="truncate">{app.name || "—"}</span>
                        <IconButton
                          icon={PencilIcon}
                          label="Edit name"
                          onClick={() => {
                            setEditingEmail(app.email);
                            setEditName(app.name || "");
                          }}
                        />
                      </div>
                    )}
                  </td>
                  <td className={tableTd}>
                    {editingCompany === app.email ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={editCompany}
                          onChange={(e) => setEditCompany(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleUpdateCompany(app.email, editCompany);
                            } else if (e.key === "Escape") {
                              setEditingCompany(null);
                              setEditCompany("");
                            }
                          }}
                          className="inline-edit-input"
                          placeholder="Company"
                          autoFocus
                        />
                        <InlineEditActions
                          onSave={() => handleUpdateCompany(app.email, editCompany)}
                          onCancel={() => {
                            setEditingCompany(null);
                            setEditCompany("");
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-0.5 min-w-0">
                        <span className="truncate">{app.company || "—"}</span>
                        <IconButton
                          icon={PencilIcon}
                          label="Edit company"
                          onClick={() => {
                            setEditingCompany(app.email);
                            setEditCompany(app.company || "");
                          }}
                        />
                      </div>
                    )}
                  </td>
                  <td className={tableTd}>
                    {editingHrNumber === app.email ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="tel"
                          value={editHrNumber}
                          onChange={(e) => setEditHrNumber(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleUpdateHrNumber(app.email, editHrNumber);
                            } else if (e.key === "Escape") {
                              setEditingHrNumber(null);
                              setEditHrNumber("");
                            }
                          }}
                          className="inline-edit-input"
                          placeholder="HR #"
                          autoFocus
                        />
                        <InlineEditActions
                          onSave={() => handleUpdateHrNumber(app.email, editHrNumber)}
                          onCancel={() => {
                            setEditingHrNumber(null);
                            setEditHrNumber("");
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-0.5 min-w-0">
                        <span className="truncate">{app.hrNumber || "—"}</span>
                        <IconButton
                          icon={PencilIcon}
                          label="Edit HR number"
                          onClick={() => {
                            setEditingHrNumber(app.email);
                            setEditHrNumber(app.hrNumber || "");
                          }}
                        />
                      </div>
                    )}
                  </td>
                  <td className={tableTd}>
                    <Badge variant={app.isApplied ? "success" : "warning"}>
                      {app.isApplied ? "Applied" : "Pending"}
                    </Badge>
                  </td>
                  <td className={`${tableTd} text-slate-500`}>
                    {app.appliedDate
                      ? new Date(app.appliedDate).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className={tableTd}>
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      checked={app.hrReplied || false}
                      onChange={(e) =>
                        handleUpdateHrReply(
                          app.email,
                          e.target.checked,
                          app.hrReplyNotes
                        )
                      }
                      title={app.hrReplied ? "HR replied" : "No reply"}
                    />
                  </td>
                  <td className={tableTd}>
                    {editingHrReply === app.email ? (
                      <div className="flex items-center space-x-2">
                        <textarea
                          value={editHrReplyNotes}
                          onChange={(e) => setEditHrReplyNotes(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && e.ctrlKey) {
                              handleUpdateHrReply(
                                app.email,
                                app.hrReplied,
                                editHrReplyNotes
                              );
                            } else if (e.key === "Escape") {
                              setEditingHrReply(null);
                              setEditHrReplyNotes("");
                            }
                          }}
                          className="inline-edit-input resize-none"
                          placeholder="Notes…"
                          rows={1}
                          autoFocus
                        />
                        <InlineEditActions
                          onSave={() =>
                            handleUpdateHrReply(
                              app.email,
                              app.hrReplied,
                              editHrReplyNotes
                            )
                          }
                          onCancel={() => {
                            setEditingHrReply(null);
                            setEditHrReplyNotes("");
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-0.5 min-w-0">
                        <span className="truncate text-slate-600" title={app.hrReplyNotes || ""}>
                          {app.hrReplyNotes || "—"}
                        </span>
                        <IconButton
                          icon={PencilIcon}
                          label="Edit notes"
                          onClick={() => {
                            setEditingHrReply(app.email);
                            setEditHrReplyNotes(app.hrReplyNotes || "");
                          }}
                        />
                      </div>
                    )}
                  </td>
                  <td className={tableTd}>
                    <IconButton
                      icon={TrashIcon}
                      label="Delete"
                      variant="danger"
                      onClick={() => handleDeleteApplication(app.email)}
                    />
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
            {(stats?.total ?? 0) === 0
              ? "No applications yet. Add email addresses above."
              : "No applications match your filters."}
          </div>
        )}
      </Card>
    </div>
  );
}
