import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Printer,
  Receipt,
  Search,
} from 'lucide-react';
import axios from 'axios';

axios.defaults.withCredentials = true;

export default function BillingPharmacy() {
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/billing/all');
      if (res.data.success) {
        setInvoices(res.data.data || []);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const filteredInvoices = useMemo(() => {
    if (!Array.isArray(invoices)) return [];

    return invoices.filter((inv) => {
      const searchTerm = search.toLowerCase();
      const patientName = (inv?.patientName || '').toLowerCase();
      const invoiceId = (inv?.invoiceId || '').toLowerCase();

      return patientName.includes(searchTerm) || invoiceId.includes(searchTerm);
    });
  }, [invoices, search]);

  const handlePayment = async (invoice) => {
    const confirmed = window.confirm(`Mark invoice ${invoice.invoiceId} as paid?`);
    if (!confirmed) return;

    try {
      const res = await axios.patch(`/api/billing/${invoice._id}/status`, { status: 'Paid' });
      if (res.data.success) {
        const deliveredChannels = [];
        const failedChannels = [];
        if (res.data.notifications?.email?.sent) deliveredChannels.push('email');
        if (res.data.notifications?.whatsapp?.sent) deliveredChannels.push('WhatsApp');
        if (res.data.notifications?.email && !res.data.notifications.email.sent) {
          failedChannels.push(`email: ${res.data.notifications.email.reason || 'delivery failed'}`);
        }
        if (res.data.notifications?.whatsapp && !res.data.notifications.whatsapp.sent) {
          failedChannels.push(`WhatsApp: ${res.data.notifications.whatsapp.reason || 'delivery failed'}`);
        }

        const notificationMessage =
          deliveredChannels.length > 0
            ? `Invoice marked as paid. Receipt link sent via ${deliveredChannels.join(' and ')}.${failedChannels.length ? ` ${failedChannels.join(' | ')}.` : ''}`
            : failedChannels.length > 0
              ? `Invoice marked as paid, but auto notification was not sent. ${failedChannels.join(' | ')}.`
              : 'Invoice marked as paid.';

        const whatsappFallbackLink = res.data.notifications?.whatsapp?.link;
        if (whatsappFallbackLink && !res.data.notifications?.whatsapp?.sent) {
          const shouldOpen = window.confirm(`${notificationMessage}\n\nOpen WhatsApp now with the receipt link?`);
          if (shouldOpen) {
            window.open(whatsappFallbackLink, '_blank', 'noopener,noreferrer');
          }
        } else {
          alert(notificationMessage);
        }
        fetchInvoices();
      }
    } catch (err) {
      console.error('Invoice status update failed:', err);
      alert('Could not update invoice status.');
    }
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Hospital Billing</h2>
          <p className="text-slate-500 text-sm">Manage patient invoices and payment status</p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
            placeholder="Search patient name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Pending" value={invoices.filter((i) => i.status !== 'Paid').length} icon={Clock} color="amber" />
        <StatCard title="Paid Invoices" value={invoices.filter((i) => i.status === 'Paid').length} icon={CheckCircle} color="emerald" />
        <StatCard title="Total Count" value={invoices.length} icon={Receipt} color="blue" />
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Patient Details</th>
                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Invoice ID</th>
                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-20 text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto" />
                    <p className="mt-4 text-slate-500 font-medium">Fetching invoices...</p>
                  </td>
                </tr>
              ) : filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => (
                  <tr key={inv._id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
                    <td className="p-5">
                      <p className="font-bold text-slate-800">{inv.patientName}</p>
                      <p className="text-xs text-slate-400">{inv.department}</p>
                    </td>
                    <td className="p-5 text-slate-500 font-mono text-sm">{inv.invoiceId}</td>
                    <td className="p-5 font-extrabold text-slate-900 text-lg">{'\u20B9'}{inv.totalAmount}</td>
                    <td className="p-5">
                      <span
                        className={`px-4 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                          inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            inv.status === 'Paid' ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                        />
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-5 text-right space-x-2">
                      {inv.status !== 'Paid' && (
                        <button
                          onClick={() => handlePayment(inv)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                        >
                          Mark Paid
                        </button>
                      )}
                      <button className="p-2.5 bg-slate-100 rounded-xl text-slate-500 hover:bg-slate-200 transition-all">
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-20 text-center">
                    <div className="bg-slate-50 rounded-3xl p-8 border-2 border-dashed border-slate-100 inline-block">
                      <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-400 font-medium">No matching invoices found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
      <div className={`p-4 rounded-2xl border ${colorStyles[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-3xl font-black text-slate-900 leading-none">{value}</h3>
      </div>
    </div>
  );
}
