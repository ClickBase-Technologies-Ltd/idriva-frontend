// app/page.tsx
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "iDriva – Professional Driver Careers",
  description: "Welcome to iDriva, the professional driver community.",
};

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100 font-sans">
      {/* Navbar */}
     <Header/>

      {/* Main content */}
      <main className="flex-1 mt-24">
        {/* Hero Section */}
        <section className="flex flex-col-reverse lg:flex-row items-center justify-between pt-4 pb-32 px-4 sm:px-6 lg:px-12">
          <div className="w-full lg:w-1/2 flex flex-col justify-center items-center lg:items-start max-w-xl mx-auto text-center lg:text-left">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-6 leading-snug">
              Welcome to your professional driving community
            </h1>
            <button className="w-full sm:w-auto bg-white text-gray-800 border border-gray-400 rounded-full px-6 py-3 mb-4 hover:bg-gray-50 transition flex items-center justify-center">
              <Image src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google Logo" width={20} height={20} className="mr-3" />
              Continue with Google
            </button>
            <Link
              href="/auth/login"
              className="w-full sm:w-auto border border-gray-800 text-gray-800 px-6 py-3 rounded-full hover:bg-gray-100 transition mb-3 text-center block"
            >
              Sign in with email
            </Link>
            <p className="text-sm text-gray-600 mt-2">
              By clicking Continue, you agree to iDriva's{" "}
              <Link href="#" className="text-blue-600 underline">User Agreement</Link>,{" "}
              <Link href="#" className="text-blue-600 underline">Privacy Policy</Link>, and{" "}
              <Link href="#" className="text-blue-600 underline">Cookie Policy</Link>.
            </p>
            <p className="mt-4 text-sm">
              New to iDriva? <Link href="/auth/signup" className="text-blue-600 font-medium">Join now</Link>
            </p>
          </div>
          <div className="w-full lg:w-1/2 flex justify-center mb-10 lg:mb-0">
            <Image src="/driver.png" alt="Illustration" width={400} height={400} className="w-full max-w-xs sm:max-w-md" />
          </div>
        </section>

        {/* Explore Content Section */}
        <section className="bg-gray-50 px-4 sm:px-6 py-16">
          <div className="max-w-7xl mx-auto text-center lg:text-left">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">Explore top iDriva content</h2>
            <p className="text-gray-600 mb-6">Discover professional driving insights, training programs, and compliance guides — all curated by topic and in one place.</p>
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
              {[
                "Driver Training",
                "Career Growth",
                "Road Communication",
                "Fleet Finance",
                "Leadership for Drivers",
                "Driver Wellness",
                "Safety & Compliance",
                "Driving Technology",
                "Show all topics",
              ].map((topic) => (
                <Link
                  key={topic}
                  href="#"
                  className={`px-4 py-2 border rounded-full text-sm hover:bg-gray-200 transition ${topic === "Show all topics" ? "text-blue-600 hover:bg-gray-100" : ""}`}
                >
                  {topic}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Job Categories Section */}
        <section className="bg-white px-4 sm:px-6 py-16">
          <div className="max-w-7xl mx-auto text-center lg:text-left">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">Find the right driving opportunity for you</h2>
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
              {[
                "Ride-Hailing Driver",
                "Corporate Chauffeur",
                "Fleet Supervisor",
                "Delivery Driver",
                "Driving Instructor",
                "Interstate Driver",
                "Vehicle Inspector",
                "Training Coordinator",
                "Show more roles",
              ].map((role) => (
                <Link
                  key={role}
                  href="#"
                  className={`px-4 py-2 border rounded-full text-sm hover:bg-gray-200 transition ${role === "Show more roles" ? "hover:bg-gray-100" : ""}`}
                >
                  {role}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Post Job Call to Action */}
        <section className="bg-gray-50 px-4 sm:px-6 py-12 text-center">
          <h3 className="text-lg sm:text-xl text-red-700 font-medium mb-4">Post your job for millions of people to see</h3>
          <Link
            href="#"
            className="px-6 py-3 bg-white text-blue-700 border border-blue-700 rounded-full hover:bg-blue-700 hover:text-white transition text-sm"
          >
            Post a job
          </Link>
        </section>

        {/* Why Join iDriva Section */}
        <section className="bg-white px-4 sm:px-6 py-20">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-10">Why Join iDriva?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
              {[
                { icon: "bi-person-badge-fill", title: "Verified Driver Profiles", desc: "Build a trusted public driver profile to attract job opportunities and clients." },
                { icon: "bi-calendar-check-fill", title: "Track Training & Licenses", desc: "Never miss license renewals or compliance deadlines with our smart tracking system." },
                { icon: "bi-geo-alt-fill", title: "Access Top Driving Jobs", desc: "Get discovered by recruiters, transport companies, and ride-hailing platforms." },
                { icon: "bi-book-half", title: "Learn On-the-Go", desc: "Get access to LMS courses and certification programs to boost your career." },
                { icon: "bi-chat-dots-fill", title: "Live Driver Community", desc: "Engage with professional drivers, join forums, and learn from the best." },
                { icon: "bi-lightbulb-fill", title: "Daily Career Insights", desc: "Stay ahead with trending news, job alerts, and personalized recommendations." },
              ].map((item) => (
                <div key={item.title} className="p-6 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition">
                  <h3 className="text-lg font-semibold text-blue-700 mb-2">
                    <i className={`bi ${item.icon} mr-2`}></i>
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Sticky Footer */}
      {/* Sticky Footer */}

<Footer/>

    </div>
  );
}
