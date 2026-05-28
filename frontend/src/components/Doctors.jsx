// import React, { useEffect, useState } from "react";
// import axios from "axios";

// export default function Doctors() {

//    const [doctors, setDoctors] = useState([]);

//    useEffect(() => {

//       const fetchDoctors = async () => {

//          try {

//             const res = await axios.get(
//                "/api/doctors"
//             );

//             // ✅ FIX
//             setDoctors(res.data.data);

//          } catch (error) {

//             console.log(error);

//          }

//       };

//       fetchDoctors();

//    }, []);

//    return (

//       <section className="py-20 px-6">

//          <h1 className="text-4xl font-bold text-center mb-12">
//             Our Doctors
//          </h1>

//          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

//             {doctors.map((doctor) => (

//                <div
//                   key={doctor._id || doctor.email}
//                   className="bg-white rounded-2xl shadow-lg overflow-hidden"
//                >

//                   <img
//                      src={doctor.image}
//                      alt={doctor.name}
//                      className="w-full h-64 object-cover"
//                   />

//                   <div className="p-5">

//                      <h2 className="text-2xl font-bold">
//                         {doctor.name}
//                      </h2>

//                      <p className="text-cyan-600 font-semibold mt-2">
//                         {doctor.specialty}
//                      </p>

//                      <p className="text-gray-600 mt-2">
//                         {doctor.schedule}
//                      </p>

//                      <button
//                         className="mt-5 w-full bg-slate-900 text-white py-2 rounded-xl"
//                      >
//                         Book Appointment
//                      </button>

//                   </div>

//                </div>

//             ))}

//          </div>

//       </section>

//    );
// }






import React, { useEffect, useState } from "react";
import axios from "axios";
import { Calendar, ArrowRight } from "lucide-react";

export default function Doctors() {

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const fetchDoctors = async () => {

      try {

        const res = await axios.get(
          "/api/doctors"
        );

        setDoctors(res.data.data || []);

      } catch (error) {

        console.log(error);

      } finally {

        setLoading(false);

      }

    };

    fetchDoctors();

  }, []);

  return (

    <section className="bg-[#f8fbff] py-16 px-4">

      {/* Heading */}

      <div className="max-w-6xl mx-auto text-center mb-10">

        <p className="text-cyan-600 font-semibold uppercase text-sm tracking-widest">
          Our Doctors
        </p>

        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2">
          Meet Our Specialists
        </h1>

        <p className="text-slate-500 mt-3 max-w-xl mx-auto text-sm">
          Experienced doctors dedicated to quality healthcare
          and patient treatment.
        </p>

      </div>

      {/* Loading */}

      {loading ? (

        <div className="text-center text-slate-500">
          Loading doctors...
        </div>

      ) : (

        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

          {doctors.map((doctor) => (

            <div
              key={doctor._id || doctor.email}
              className="bg-white rounded-2xl overflow-hidden border border-slate-100 hover:shadow-xl transition duration-300 group"
            >

              {/* Image */}

              <div className="relative overflow-hidden">

                <img
                  src={doctor.image}
                  alt={doctor.name}
                  className="w-full h-64 object-cover group-hover:scale-105 transition duration-500"
                />

                {/* Specialty */}

                <div className="absolute bottom-3 left-3 bg-white/95 text-cyan-600 px-3 py-1 rounded-full text-xs font-semibold shadow">
                  {doctor.specialty}
                </div>

              </div>

              {/* Content */}

              <div className="p-5">

                <h2 className="text-xl font-bold text-slate-900">
                  {doctor.name}
                </h2>

                <div className="flex items-center gap-2 mt-3 text-slate-500">
                  <Calendar className="w-4 h-4" />

                  <p className="text-sm">
                    {doctor.schedule}
                  </p>
                </div>

                <p className="text-slate-500 text-sm leading-6 mt-3">
                  Specialist providing modern healthcare
                  with patient-focused treatment.
                </p>

                {/* Button */}

                <button className="mt-5 w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-slate-900 text-white py-2.5 rounded-xl font-medium transition duration-300">

                  Book Appointment

                  <ArrowRight className="w-4 h-4" />

                </button>

              </div>

            </div>

          ))}

        </div>

      )}

    </section>

  );

}
