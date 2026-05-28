import { useEffect, useState } from "react";
import axios from "axios";
import { HeartPulse, AlertTriangle, CheckCircle2 } from "lucide-react";

const BloodBankHero = () => {

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchBloodStats = async () => {
    try {

      const res = await axios.get("/api/blood-bank/inventory");

      if (res.data.success) {
        setStats(res.data.data.stats);
      }

    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBloodStats();
  }, []);

  return (
    <section className="py-16 bg-slate-50">

      <div className="max-w-7xl mx-auto px-4">

        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-slate-900">
            Blood Bank Overview
          </h2>

          <p className="text-slate-500 mt-3">
            Live blood inventory available in hospital
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Total Units */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border">
            <div className="flex items-center gap-3 text-blue-600">
              <HeartPulse />
              <h3 className="font-semibold uppercase text-sm">
                Total Blood Units
              </h3>
            </div>

            <p className="text-5xl font-bold mt-5">
              {loading ? "--" : stats?.totalUnits}
            </p>
          </div>

          {/* Critical */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle />
              <h3 className="font-semibold uppercase text-sm">
                Critical Groups
              </h3>
            </div>

            <p className="text-5xl font-bold mt-5">
              {loading ? "--" : stats?.criticalGroups?.length}
            </p>
          </div>

          {/* Normal */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border">
            <div className="flex items-center gap-3 text-emerald-600">
              <CheckCircle2 />
              <h3 className="font-semibold uppercase text-sm">
                Normal Groups
              </h3>
            </div>

            <p className="text-5xl font-bold mt-5">
              {loading
                ? "--"
                : stats?.fullInventory?.length -
                  stats?.criticalGroups?.length}
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};

export default BloodBankHero;