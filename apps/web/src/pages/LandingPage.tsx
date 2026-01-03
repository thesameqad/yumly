import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  MapPin,
  Star,
  Utensils,
  Search,
  Sparkles,
} from "lucide-react";

export function LandingPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const handleStartChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate("/chat", { state: { initialMessage: query } });
    } else {
      navigate("/chat");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-yum-50 overflow-hidden font-sans">
      {/* Navbar */}
      <nav className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50 max-w-7xl mx-auto w-full">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-yum-500 to-yum-600 rounded-xl flex items-center justify-center shadow-lg shadow-yum-200">
            <Utensils className="text-white w-6 h-6" />
          </div>
          <span className="font-bold text-2xl text-gray-900 tracking-tight">
            Yumly
          </span>
        </button>
        <button
          onClick={() => navigate("/chat")}
          className="px-6 py-2.5 bg-white text-yum-600 font-semibold rounded-full shadow-sm hover:shadow-md transition-all border border-yum-100"
        >
          Open App
        </button>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-32 pb-20 px-6">
        {/* Background Elements */}
        <div className="absolute top-20 right-0 -z-10 opacity-10 pointer-events-none">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
            className="w-[800px] h-[800px] rounded-full border-[60px] border-yum-200 border-dashed"
          />
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-4 py-2 bg-yum-50 text-yum-700 rounded-full text-sm font-medium border border-yum-100"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Dining Assistant</span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-5xl lg:text-7xl font-extrabold text-gray-900 leading-[1.1] tracking-tight"
            >
              Discover your next <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yum-500 to-yum-700">
                favorite meal
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-xl text-gray-600 max-w-lg leading-relaxed"
            >
              Stop scrolling through endless reviews. Just tell Yumly what
              you're craving, and get personalized recommendations instantly.
            </motion.p>

            <motion.form
              variants={itemVariants}
              onSubmit={handleStartChat}
              className="relative max-w-lg group"
            >
              <div className="absolute inset-0 bg-yum-200 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="relative flex items-center bg-white rounded-2xl shadow-xl shadow-yum-100/50 p-2 border border-gray-100">
                <div className="pl-4 text-gray-400">
                  <Search className="w-6 h-6" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Best sushi in downtown..."
                  className="flex-1 px-4 py-4 bg-transparent border-none focus:ring-0 text-lg placeholder:text-gray-400 text-gray-900"
                />
                <button
                  type="submit"
                  className="bg-gradient-to-r from-yum-500 to-yum-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-yum-500/30 transition-all flex items-center gap-2 group/btn"
                >
                  <span>Ask</span>
                  <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
              <div className="flex justify-end mt-2 pr-2">
                <a
                  href="https://www.yelp.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity"
                >
                  <span className="text-[10px] text-gray-500 font-medium">
                    Powered by
                  </span>
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/a/ad/Yelp_Logo.svg"
                    alt="Yelp"
                    className="h-3.5"
                  />
                </a>
              </div>
            </motion.form>

            <motion.div
              variants={itemVariants}
              className="flex items-center gap-8 pt-2"
            >
              <div className="flex -space-x-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-12 h-12 rounded-full border-4 border-white bg-gray-200 overflow-hidden"
                  >
                    <img
                      src={`https://i.pravatar.cc/100?img=${i + 10}`}
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 text-yellow-400">
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                </div>
                <p className="text-sm text-gray-600 font-medium">
                  Loved by foodies everywhere
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Visual */}
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="relative hidden lg:block"
          >
            <div className="relative z-10 animate-float">
              {/* Main Card */}
              <div className="bg-white rounded-3xl shadow-2xl shadow-yum-900/10 p-6 max-w-md mx-auto border border-gray-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-yum-100 rounded-full flex items-center justify-center text-yum-600">
                    <Utensils className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">
                      Best Pizza Nearby
                    </h3>
                    <p className="text-sm text-gray-500">
                      Found 3 top-rated places
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group"
                    >
                      <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={`https://images.unsplash.com/photo-${
                            i === 1
                              ? "1513104890138-7c749659a591"
                              : i === 2
                              ? "1574071318508-1cdbab80d002"
                              : "1604382354936-07c5d9983bd3"
                          }?auto=format&fit=crop&w=200&q=80`}
                          alt="Food"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-gray-900">
                            Tony's Pizzeria
                          </h4>
                          <span className="flex items-center text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            4.{8 - i}{" "}
                            <Star className="w-3 h-3 ml-1 fill-current" />
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Italian • $$ • 0.{i + 2} mi
                        </p>
                        <div className="flex gap-2 mt-2">
                          <span className="text-[10px] bg-gray-100 px-2 py-1 rounded-md text-gray-600">
                            Wood fired
                          </span>
                          <span className="text-[10px] bg-gray-100 px-2 py-1 rounded-md text-gray-600">
                            Cozy
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating Elements */}
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1,
                }}
                className="absolute -top-12 -right-12 bg-white p-4 rounded-2xl shadow-xl shadow-yum-500/20 flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-500">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Location</p>
                  <p className="text-sm font-bold text-gray-900">
                    San Francisco, CA
                  </p>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 15, 0] }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
                className="absolute -bottom-8 -left-8 bg-white p-4 rounded-2xl shadow-xl shadow-yum-500/20 flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-500">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">AI Match</p>
                  <p className="text-sm font-bold text-gray-900">98% Match</p>
                </div>
              </motion.div>
            </div>

            {/* Decorative Blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-br from-yum-200/50 to-orange-200/50 rounded-full blur-3xl -z-10" />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
